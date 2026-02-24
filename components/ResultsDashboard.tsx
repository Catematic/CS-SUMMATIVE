
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, OnboardingData, Message, RecommendedMajor, RecommendedUniversity, UniversityRoadmap } from '../types';
import { GraduationCap, School, MessageCircle, MapPin, Sparkles, Send, Compass, DollarSign, Briefcase, TrendingUp, X, Globe, Trophy, ExternalLink, Languages, BookOpen, Users, Building, Landmark, Percent, Calendar, CheckCircle2, ChevronRight, AlertCircle, Map, Check, Circle } from 'lucide-react';
import { startCounselorChat, generateUniversityRoadmap } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

interface Props {
  data: AnalysisResult;
  onboardingData: OnboardingData;
  initialMessages?: Message[];
  onMessagesUpdate?: (messages: Message[]) => void;
}

const ChatMessageContent: React.FC<{ text: string }> = ({ text }) => {
  const cardRegex = /```university-card\s*([\s\S]*?)\s*```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = cardRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    try {
      const cardData = JSON.parse(match[1]);
      parts.push({ type: 'card', content: cardData });
    } catch (e) {
      parts.push({ type: 'text', content: match[0] });
    }
    lastIndex = cardRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  if (parts.length === 0 && text) {
    parts.push({ type: 'text', content: text });
  }

  return (
    <div className="space-y-4">
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return (
            <div key={i} className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed opacity-90">
              {part.content.split('\n').map((line, j) => {
                const segments = line.split(/(\*\*.*?\*\*)/g);
                return (
                  <p key={j} className="mb-2">
                    {segments.map((seg, k) => {
                      if (seg.startsWith('**') && seg.endsWith('**')) {
                        return <strong key={k} className="text-stone-100">{seg.slice(2, -2)}</strong>;
                      }
                      return seg;
                    })}
                  </p>
                );
              })}
            </div>
          );
        } else {
          const uni = part.content as RecommendedUniversity;
          return (
            <div key={i} className="bg-black/60 border border-amber/30 rounded-2xl p-6 my-4 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-bold text-stone-100 font-serif">{uni.name}</h4>
                <span className="text-[8px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-amber/20 text-amber border border-amber/30">{uni.type}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-4">
                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-amber" /> {uni.location}</div>
                <div className="flex items-center gap-1.5"><Trophy size={12} className="text-amber" /> Rank: {uni.internationalRanking}</div>
                <div className="flex items-center gap-1.5"><DollarSign size={12} className="text-amber" /> {uni.annualTuition}</div>
                <div className="flex items-center gap-1.5"><Percent size={12} className="text-amber" /> {uni.acceptanceRate}</div>
              </div>
              <p className="text-xs text-stone-300 font-serif italic mb-4 opacity-80">{uni.description}</p>
              <a href={uni.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-amber text-[10px] uppercase font-bold hover:underline">
                Visit Official Website <ExternalLink size={10} />
              </a>
            </div>
          );
        }
      })}
    </div>
  );
};

export const ResultsDashboard: React.FC<Props> = ({ data, onboardingData, initialMessages = [], onMessagesUpdate }) => {
  const [isChatOpen, setIsChatOpen] = useState(initialMessages.length > 0);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [chatInstance, setChatInstance] = useState<any>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  
  const [selectedMajor, setSelectedMajor] = useState<RecommendedMajor | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<RecommendedUniversity | null>(null);
  
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [activeRoadmap, setActiveRoadmap] = useState<UniversityRoadmap | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMessagesUpdate?.(messages);
  }, [messages, onMessagesUpdate]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    if (initialMessages.length > 0 && !chatInstance) {
      const chat = startCounselorChat(onboardingData, data);
      setChatInstance(chat);
    }
  }, []);

  const initChat = () => {
    if (!chatInstance) {
      const chat = startCounselorChat(onboardingData, data);
      setChatInstance(chat);
      if (messages.length === 0) {
        setMessages([{ role: 'model', text: 'How can I assist your specific inquiries regarding these paths?' }]);
      }
    }
    setIsChatOpen(true);
  };

  const handleForgeRoadmap = async (uniName: string) => {
    setIsGeneratingRoadmap(true);
    setSelectedUniversity(null);
    try {
      const roadmap = await generateUniversityRoadmap(onboardingData, uniName);
      setActiveRoadmap(roadmap);
    } catch (err) {
      console.error(err);
      alert("Admissions council could not be reached. Try again later.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatInstance || isLoadingChat) return;

    const userMsg = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoadingChat(true);

    try {
      const stream = await chatInstance.sendMessageStream({ message: userMsg });
      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        fullText += c.text;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: 'model', text: fullText };
          return newMsgs;
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'An error occurred. Please repeat your query.' }]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-20 px-6">
      <header className="mb-16 space-y-4">
        <div className="flex items-center gap-3">
           <Compass className="text-amber" size={20} />
           <span className="text-[10px] uppercase tracking-[0.4em] text-amber font-bold">Comprehensive Analysis Result</span>
        </div>
        <h2 className="text-5xl md:text-7xl text-stone-100 font-bold leading-tight font-serif italic">Your Strategic Blueprint</h2>
      </header>

      {/* Summary Dossier */}
      <section className="mb-20">
        <div className="manuscript-card p-12 rounded-3xl shadow-2xl relative overflow-hidden group border-amber/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber/5 blur-[120px] rounded-full"></div>
          <h3 className="text-xs font-bold text-amber mb-8 uppercase tracking-[0.5em] flex items-center gap-3">
            <Sparkles size={14} /> Counselor's Executive Summary
          </h3>
          <p className="text-2xl md:text-3xl text-stone-200 leading-relaxed font-serif italic font-light max-w-4xl">
            {data.matchSummary}
          </p>
        </div>
      </section>

      {/* Recommended Majors Section */}
      <section className="mb-24">
        <div className="flex items-center gap-6 mb-12">
          <div className="h-px flex-1 bg-stone-800"></div>
          <h3 className="text-xl font-bold text-stone-100 uppercase tracking-[0.3em] font-serif italic">Curated Disciplines</h3>
          <div className="h-px flex-1 bg-stone-800"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.majors.map((major, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedMajor(major)}
              className="bg-espresso/40 p-10 rounded-2xl border border-white/5 hover:border-amber/40 transition-all group cursor-pointer flex flex-col h-full hover:bg-espresso/60"
            >
              <div className="w-12 h-12 bg-mahogany rounded-xl flex items-center justify-center text-amber border border-amber/10 mb-8 group-hover:scale-110 transition-transform">
                <Briefcase size={20} />
              </div>
              <h4 className="text-2xl font-bold text-stone-100 mb-4 group-hover:text-amber transition-colors font-serif leading-tight">{major.name}</h4>
              <p className="text-stone-500 text-sm leading-relaxed italic line-clamp-3 mb-8 flex-grow">{major.whyFits}</p>
              
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest text-stone-600 font-bold">Avg Salary</span>
                  <span className="text-amber text-xs font-bold">{major.avgSalary}</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[10px] uppercase tracking-widest text-amber/60 font-bold">View Portfolio</span>
                   <ArrowUpRight size={14} className="text-amber group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Academic Institutions Section */}
      <section className="mb-24">
        <div className="flex items-center gap-6 mb-12">
          <div className="h-px flex-1 bg-stone-800"></div>
          <h3 className="text-xl font-bold text-stone-100 uppercase tracking-[0.3em] font-serif italic">Sanctuaries of Knowledge</h3>
          <div className="h-px flex-1 bg-stone-800"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {data.universities.map((uni, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedUniversity(uni)}
              className="manuscript-card p-12 rounded-3xl border border-white/5 hover:border-amber/40 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <School size={120} />
              </div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="space-y-2">
                   <h4 className="text-3xl font-bold text-stone-100 leading-tight font-serif pr-12">{uni.name}</h4>
                   <div className="flex items-center gap-2 text-amber text-[10px] font-bold uppercase tracking-[0.2em]">
                     <MapPin size={10} /> {uni.location}
                   </div>
                </div>
                <span className={`text-[9px] uppercase font-bold tracking-[0.2em] px-3 py-1.5 rounded-full ${
                  uni.type === 'Reach' ? 'bg-red-950/40 text-red-400 border border-red-900/40' : 
                  uni.type === 'Match' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' : 
                  'bg-green-950/40 text-green-400 border border-green-900/40'
                }`}>
                  {uni.type}
                </span>
              </div>

              <p className="text-stone-400 text-sm leading-relaxed font-serif italic line-clamp-3 mb-10 flex-grow relative z-10">
                {uni.description}
              </p>

              {/* Major Alignment Checkbox Area */}
              <div className="mb-10 p-6 bg-black/40 rounded-2xl border border-white/5 relative z-10">
                 <h5 className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-6 flex items-center gap-2">
                   <Sparkles size={12} className="text-amber" /> Major Alignment Check
                 </h5>
                 <div className="grid grid-cols-1 gap-3">
                   {data.majors.map((recMajor, mIdx) => {
                     const isOffered = uni.offeredMajors.some(m => 
                       m.toLowerCase().includes(recMajor.name.toLowerCase()) || 
                       recMajor.name.toLowerCase().includes(m.toLowerCase())
                     );
                     return (
                       <div key={mIdx} className="flex items-center justify-between">
                         <span className={`text-[11px] font-medium transition-colors ${isOffered ? 'text-stone-300' : 'text-stone-600'}`}>
                           {recMajor.name}
                         </span>
                         {isOffered ? (
                           <div className="w-5 h-5 rounded-full bg-amber/20 flex items-center justify-center border border-amber/40">
                             <Check size={10} className="text-amber" strokeWidth={3} />
                           </div>
                         ) : (
                           <Circle size={14} className="text-stone-800" />
                         )}
                       </div>
                     );
                   })}
                 </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="block text-[8px] uppercase tracking-widest text-stone-600 font-bold mb-1">Acceptance</span>
                    <span className="block text-sm font-bold text-stone-300">{uni.acceptanceRate}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[8px] uppercase tracking-widest text-stone-600 font-bold mb-1">Ranking</span>
                    <span className="block text-sm font-bold text-amber">{uni.internationalRanking}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-amber/40 group-hover:bg-amber/5 transition-all">
                   <ArrowUpRight size={16} className="text-stone-600 group-hover:text-amber transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Global Action Button */}
      <div className="mt-12 text-center pb-20">
        <button
          onClick={initChat}
          className="inline-flex items-center gap-4 px-16 py-7 bg-amber text-black rounded-full font-bold uppercase text-[11px] tracking-[0.5em] shadow-2xl shadow-amber/20 hover:scale-105 active:scale-95 transition-all group"
        >
          <MessageCircle size={20} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" /> 
          Inquire with the Archive
        </button>
      </div>

      {/* Major Detail Modal */}
      {selectedMajor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
          <div className="manuscript-card w-full max-w-2xl p-8 md:p-14 rounded-3xl relative animate-in fade-in zoom-in duration-300 my-auto shadow-[0_0_100px_rgba(217,160,91,0.05)]">
            <button onClick={() => setSelectedMajor(null)} className="absolute top-8 right-8 text-stone-500 hover:text-white transition-colors p-2">
              <X size={28} />
            </button>
            <div className="flex items-center gap-6 mb-12 pb-10 border-b border-white/5">
              <div className="w-16 h-16 bg-mahogany rounded-2xl flex items-center justify-center text-amber border border-amber/20 shrink-0">
                <Briefcase size={32} />
              </div>
              <div>
                <h3 className="text-4xl font-serif text-stone-100 font-bold leading-tight">{selectedMajor.name}</h3>
                <span className="text-amber/60 text-[10px] uppercase tracking-[0.4em] font-bold">Career Portfolio Analysis</span>
              </div>
            </div>
            
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                  <h4 className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
                    <DollarSign size={14} className="text-amber" /> Median Remuneration
                  </h4>
                  <div className="text-amber text-3xl font-bold">{selectedMajor.avgSalary}</div>
                </div>
                <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                  <h4 className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
                    <TrendingUp size={14} className="text-amber" /> Market Trajectory
                  </h4>
                  <div className="text-stone-100 text-xl font-bold font-serif">{selectedMajor.jobGrowth}</div>
                </div>
              </div>

              <div className="space-y-8">
                 <div>
                    <h4 className="text-amber text-[10px] uppercase tracking-[0.4em] font-bold mb-6">Counselor's Insight</h4>
                    <p className="text-stone-300 font-serif italic text-xl leading-relaxed border-l-2 border-amber/30 pl-8">
                      {selectedMajor.careerPathDetails}
                    </p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                      <h4 className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-bold mb-6 flex items-center gap-2">
                        <Building size={14} className="text-amber" /> Notable Hiring Bodies
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {selectedMajor.topCompanies.map((co, i) => (
                          <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-stone-300 font-serif">{co}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-bold mb-6 flex items-center gap-2">
                        <Landmark size={14} className="text-amber" /> Academic Requisite
                      </h4>
                      <div className="text-stone-200 font-serif italic text-lg leading-relaxed">{selectedMajor.degreeLevel}</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* University Detail Modal */}
      {selectedUniversity && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
          <div className="manuscript-card w-full max-w-4xl p-8 md:p-14 rounded-3xl relative animate-in fade-in zoom-in duration-300 my-auto shadow-[0_0_150px_rgba(217,160,91,0.08)]">
            <button onClick={() => setSelectedUniversity(null)} className="absolute top-8 right-8 text-stone-500 hover:text-white transition-colors p-2">
              <X size={32} />
            </button>
            
            <div className="flex flex-col md:flex-row md:items-center gap-10 mb-16 pb-12 border-b border-white/5">
              <div className="w-24 h-24 bg-mahogany rounded-[2rem] flex items-center justify-center text-amber border border-amber/20 shrink-0 shadow-2xl shadow-black">
                <School size={48} />
              </div>
              <div className="flex-1">
                <h3 className="text-5xl md:text-6xl font-serif text-stone-100 font-bold mb-4 pr-12">{selectedUniversity.name}</h3>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-stone-500 text-[11px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2"><MapPin size={12} className="text-amber" /> {selectedUniversity.location}</span>
                  <span className="flex items-center gap-2"><Languages size={12} className="text-amber" /> {selectedUniversity.language}</span>
                  <span className="flex items-center gap-2"><Building size={12} className="text-amber" /> {selectedUniversity.campusSetting}</span>
                  <a href={selectedUniversity.website} target="_blank" rel="noopener noreferrer" className="text-amber hover:underline flex items-center gap-2 border border-amber/30 rounded-lg px-3 py-1 bg-amber/5"><Globe size={12} /> Academic Portal <ExternalLink size={10} /></a>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div className="lg:col-span-2 space-y-12">
                <div className="flex gap-4 mb-8">
                  <button 
                    onClick={() => handleForgeRoadmap(selectedUniversity.name)}
                    className="flex-1 bg-amber text-black py-5 rounded-2xl font-bold uppercase text-[11px] tracking-[0.4em] shadow-2xl shadow-amber/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
                  >
                    <Compass size={18} /> Forge Path to Admission
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                    <Trophy className="mx-auto text-amber mb-3" size={18} />
                    <span className="text-stone-200 text-2xl font-bold block">{selectedUniversity.nationalRanking}</span>
                    <span className="text-[9px] text-stone-500 uppercase tracking-widest font-bold">National</span>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                    <Globe className="mx-auto text-amber mb-3" size={18} />
                    <span className="text-stone-200 text-2xl font-bold block">{selectedUniversity.internationalRanking}</span>
                    <span className="text-[9px] text-stone-500 uppercase tracking-widest font-bold">World Rank</span>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                    <Percent className="mx-auto text-amber mb-3" size={18} />
                    <span className="text-stone-200 text-2xl font-bold block">{selectedUniversity.acceptanceRate}</span>
                    <span className="text-[9px] text-stone-500 uppercase tracking-widest font-bold">Selectivity</span>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                    <Users className="mx-auto text-amber mb-3" size={18} />
                    <span className="text-stone-200 text-2xl font-bold block">{selectedUniversity.facultyRatio}</span>
                    <span className="text-[9px] text-stone-500 uppercase tracking-widest font-bold">Scholar Ratio</span>
                  </div>
                </div>

                <div className="bg-white/5 p-10 rounded-3xl border border-white/5 relative">
                   <h4 className="text-amber text-[11px] uppercase tracking-[0.4em] font-bold mb-8 flex items-center gap-3">
                     <BookOpen size={16} /> Curricular Philosophy
                   </h4>
                   <p className="text-stone-300 font-serif italic text-2xl leading-relaxed mb-10 border-l-2 border-amber/20 pl-8">
                      {selectedUniversity.curriculumFocus}
                   </p>
                   <div className="pt-8 border-t border-white/5">
                      <p className="text-stone-400 font-sans text-sm leading-relaxed opacity-80">
                        {selectedUniversity.description}
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                    <h4 className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-3">Community Size</h4>
                    <div className="text-stone-100 text-xl font-bold font-serif">{selectedUniversity.totalEnrollment} Scholars</div>
                  </div>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                    <h4 className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-3">Funding Policy</h4>
                    <div className="text-stone-100 text-xl font-bold font-serif">{selectedUniversity.financialAidStatus}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="bg-amber/5 p-10 rounded-[2.5rem] border border-amber/10 shadow-2xl sticky top-24">
                  <h4 className="text-amber text-[11px] uppercase tracking-[0.5em] font-bold mb-10 text-center">Economic Forecast</h4>
                  <div className="space-y-12">
                    <div className="text-center">
                      <span className="text-stone-500 text-[10px] uppercase font-bold tracking-[0.3em] block mb-3">Annual Investment</span>
                      <span className="text-amber text-5xl font-bold block">{selectedUniversity.annualTuition}</span>
                    </div>
                    <div className="pt-12 border-t border-amber/10 text-center">
                      <span className="text-stone-500 text-[10px] uppercase font-bold tracking-[0.3em] block mb-3">Median Graduate Salary</span>
                      <span className="text-stone-100 text-4xl font-bold block font-serif">{selectedUniversity.avgGraduateSalary}</span>
                    </div>
                    <div className="bg-black/40 p-6 rounded-2xl text-center border border-white/5">
                       <span className={`text-[10px] uppercase font-bold tracking-[0.4em] px-4 py-2 rounded-full ${
                        selectedUniversity.type === 'Reach' ? 'bg-red-950/40 text-red-400 border border-red-900/40' : 
                        selectedUniversity.type === 'Match' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' : 
                        'bg-green-950/40 text-green-400 border border-green-900/40'
                      }`}>
                        Tier: {selectedUniversity.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roadmap Viewer */}
      {activeRoadmap && (
        <div className="fixed inset-0 z-[100] bg-[#0d0d0d] flex flex-col font-sans overflow-y-auto custom-scrollbar">
          <div className="bg-[#1a1a1a] p-10 flex justify-between items-center border-b border-white/5 sticky top-0 z-10 shadow-2xl backdrop-blur-xl bg-opacity-95">
            <div className="flex items-center gap-8">
              <div className="w-14 h-14 bg-amber text-black rounded-3xl flex items-center justify-center font-bold shadow-2xl shadow-amber/20">
                <Map size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-serif italic text-4xl text-stone-100">{activeRoadmap.universityName} Journey</h3>
                <span className="text-amber/60 text-[11px] uppercase tracking-[0.4em] font-bold">Custom Strategic Roadmap</span>
              </div>
            </div>
            <button onClick={() => setActiveRoadmap(null)} className="text-stone-500 hover:text-white transition-colors p-3 bg-white/5 rounded-full border border-white/5">
              <X size={32} />
            </button>
          </div>

          <div className="max-w-4xl mx-auto py-24 px-8 w-full">
            <div className="manuscript-card p-14 rounded-[3rem] border-amber/10 mb-20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <Sparkles size={160} />
              </div>
              <h4 className="text-amber text-[10px] uppercase tracking-[0.5em] font-bold mb-8">Consultant's Foreword</h4>
              <p className="text-stone-200 text-2xl font-serif italic leading-relaxed relative z-10 font-light">
                {activeRoadmap.overview}
              </p>
            </div>

            <div className="space-y-16 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-amber/40 before:via-stone-800 before:to-transparent">
              {activeRoadmap.phases.map((step, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 200}ms` }}>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border border-amber bg-black text-amber shadow-2xl shadow-amber/20 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 font-serif italic text-xl">
                    {idx + 1}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] manuscript-card p-10 rounded-3xl shadow-2xl border-white/5 hover:border-amber/20 transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <time className="text-amber font-bold uppercase text-[10px] tracking-widest">{step.timeline}</time>
                      <span className={`text-[9px] uppercase px-3 py-1 rounded-full border ${
                        step.importance === 'Critical' ? 'border-red-900/50 bg-red-950/20 text-red-400' :
                        step.importance === 'Recommended' ? 'border-amber-900/50 bg-amber-950/20 text-amber-400' :
                        'border-stone-800 bg-stone-900/50 text-stone-500'
                      } font-bold tracking-widest`}>
                        {step.importance}
                      </span>
                    </div>
                    <h5 className="text-2xl font-bold text-stone-100 font-serif mb-6 leading-tight">{step.title}</h5>
                    <p className="text-stone-400 text-sm font-sans mb-8 leading-relaxed opacity-80">{step.description}</p>
                    <ul className="space-y-4">
                      {step.tasks.map((task, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-4 text-stone-300 text-[13px] font-sans leading-relaxed group/task">
                          <CheckCircle2 size={16} className="text-amber shrink-0 mt-0.5 opacity-40 group-hover/task:opacity-100 transition-opacity" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-32 p-16 bg-amber text-black rounded-[3rem] text-center shadow-[0_0_80px_rgba(217,160,91,0.2)]">
              <Sparkles className="mx-auto mb-8" size={64} />
              <h4 className="text-4xl font-serif italic font-bold mb-6">The path is set.</h4>
              <p className="font-sans text-sm font-bold uppercase tracking-[0.4em] opacity-80">
                You possess the blueprint. The legacy awaits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for Roadmap */}
      {isGeneratingRoadmap && (
        <div className="fixed inset-0 z-[110] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center">
          <div className="relative mb-16">
            <RefreshCw className="text-amber animate-spin" size={80} strokeWidth={0.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Compass className="text-amber/60 animate-pulse" size={32} />
            </div>
          </div>
          <h2 className="text-5xl font-serif italic text-stone-100 mb-6 animate-pulse">Calculating Trajectory...</h2>
          <p className="text-stone-500 text-xl font-serif italic max-w-md leading-relaxed">The admissions mirror is synthesizing your profile against institutional records to draft your specific roadmap.</p>
        </div>
      )}

      {/* Full-Screen Chat Experience */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[90] bg-[#0d0d0d] flex flex-col font-sans">
          <div className="bg-[#1a1a1a] p-8 flex justify-between items-center border-b border-white/5 shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-amber text-black rounded-2xl flex items-center justify-center font-bold text-lg shadow-2xl shadow-amber/20">A</div>
              <div>
                <h3 className="font-serif italic text-3xl text-stone-100 tracking-tight">The Counselor's Desk</h3>
                <span className="text-amber/40 text-[9px] uppercase tracking-[0.4em] font-bold">Encrypted Academic Link</span>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-stone-500 hover:text-white transition-colors p-3 bg-white/5 rounded-full">
              <X size={32} strokeWidth={1.5} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 md:p-16 space-y-12 bg-[#0d0d0d] custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-12 pb-24">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`max-w-[95%] md:max-w-[85%] p-10 rounded-3xl shadow-2xl ${
                    msg.role === 'user' 
                      ? 'bg-amber text-black font-bold border-none' 
                      : 'bg-[#1a1a1a] text-stone-300 border border-white/5'
                  }`}>
                    <ChatMessageContent text={msg.text} />
                  </div>
                </div>
              ))}
              {isLoadingChat && (
                <div className="flex justify-start">
                  <div className="flex gap-3 p-10 bg-[#1a1a1a] rounded-3xl border border-white/5">
                    <div className="w-2.5 h-2.5 bg-amber rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-amber rounded-full animate-bounce delay-150"></div>
                    <div className="w-2.5 h-2.5 bg-amber rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="p-8 md:p-16 border-t border-white/5 bg-[#1a1a1a] shadow-[0_-20px_100px_rgba(0,0,0,0.8)]">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Inquire further about your chosen path..."
                  className="w-full px-10 py-6 rounded-3xl bg-black/60 border border-white/10 text-stone-200 focus:ring-1 focus:ring-amber focus:border-amber outline-none font-sans text-xl placeholder:text-stone-700 shadow-inner"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isLoadingChat}
                />
              </div>
              <button
                type="submit"
                className={`p-6 rounded-3xl transition-all shadow-2xl ${
                  isLoadingChat || !inputText.trim() 
                  ? 'bg-stone-800 text-stone-600 cursor-not-allowed' 
                  : 'bg-amber text-black hover:bg-amber/90 active:scale-95 shadow-amber/10'
                }`}
                disabled={isLoadingChat || !inputText.trim()}
              >
                <Send size={32} strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ArrowUpRight: React.FC<{ className?: string, size?: number }> = ({ className, size = 16 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
  </svg>
);

const RefreshCw: React.FC<{ className?: string, size?: number, strokeWidth?: number }> = ({ className, size = 24, strokeWidth = 2 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M3 21v-5h5"/>
  </svg>
);
