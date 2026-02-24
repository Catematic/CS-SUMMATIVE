
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { OnboardingForm } from './components/OnboardingForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { OnboardingData, AnalysisResult, Message } from './types';
import { analyzeCounselingData } from './services/geminiService';
import { ArrowRight, ShieldCheck, Globe, BookOpen, ScrollText, RefreshCw } from 'lucide-react';

type AppState = 'landing' | 'onboarding' | 'loading' | 'results';

const SESSION_KEY = 'scholar_mirror_session_v1';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('landing');
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load session on mount
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOnboardingData(parsed.onboardingData);
        setResults(parsed.results);
        setChatHistory(parsed.chatHistory || []);
        setState(parsed.state === 'loading' ? 'onboarding' : parsed.state);
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save session on changes
  useEffect(() => {
    if (isLoaded) {
      const session = {
        state,
        onboardingData,
        results,
        chatHistory
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }, [state, onboardingData, results, chatHistory, isLoaded]);

  const handleStart = () => setState('onboarding');

  const handleReset = () => {
    if (window.confirm("Are you sure you wish to clear this session and start a new consultation?")) {
      localStorage.removeItem(SESSION_KEY);
      setState('landing');
      setOnboardingData(null);
      setResults(null);
      setChatHistory([]);
    }
  };

  const handleOnboardingSubmit = async (data: OnboardingData) => {
    setOnboardingData(data);
    setState('loading');
    setError(null);
    try {
      const result = await analyzeCounselingData(data);
      setResults(result);
      setState('results');
    } catch (err) {
      console.error(err);
      setError("The quill has snapped. The Counselor is resting. Please try again in a few moments.");
      setState('onboarding');
    }
  };

  if (!isLoaded) return null;

  const renderState = () => {
    switch (state) {
      case 'landing':
        return (
          <div className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber/5 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="mb-12 relative">
               <div className="p-8 bg-mahogany/30 rounded-full border border-amber/10 shadow-inner">
                 <ScrollText size={64} className="text-amber" strokeWidth={1} />
               </div>
               <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber rounded-full animate-pulse shadow-[0_0_10px_#d9a05b]"></div>
            </div>

            <h1 className="text-6xl md:text-9xl text-stone-100 font-bold mb-10 max-w-6xl leading-[1.1] font-serif italic tracking-tight">
              Draft your <span className="text-amber">Masterpiece</span>.
            </h1>
            
            <p className="text-xl md:text-2xl text-stone-500 mb-14 max-w-3xl leading-relaxed font-serif italic font-light">
              "Escape the noise of the masses. Sit with us in the quiet hours and let us chart the constellations of your potential."
            </p>
            
            <button
              onClick={handleStart}
              className="group bg-amber text-black text-[11px] tracking-[0.5em] font-bold px-16 py-6 rounded-full flex items-center gap-5 hover:bg-amber/90 transition-all shadow-2xl shadow-amber/10 hover:-translate-y-1 uppercase"
            >
              Consult the Mirror <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </button>

            <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-20 w-full max-w-5xl border-t border-white/5 pt-20">
              <div className="flex flex-col items-center gap-6 group">
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 group-hover:border-amber/30 transition-colors">
                  <ShieldCheck className="text-amber/40 group-hover:text-amber transition-colors" size={24} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-stone-300 uppercase tracking-widest text-[10px]">Deep Cognition</h3>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-[220px] font-serif italic">Beyond data; we seek the essence of your intellectual calling.</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-6 group">
                 <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 group-hover:border-amber/30 transition-colors">
                  <Globe className="text-amber/40 group-hover:text-amber transition-colors" size={24} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-stone-300 uppercase tracking-widest text-[10px]">Boundless Registry</h3>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-[220px] font-serif italic">Our scrolls contain the secrets of every major institution on Earth.</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6 group">
                 <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 group-hover:border-amber/30 transition-colors">
                  <BookOpen className="text-amber/40 group-hover:text-amber transition-colors" size={24} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-stone-300 uppercase tracking-widest text-[10px]">The Archive's Echo</h3>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-[220px] font-serif italic">Talk back. We refine your roadmap as your story continues to unfold.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'onboarding':
        return (
          <div className="min-h-[85vh]">
            {error && (
              <div className="max-w-xl mx-auto mt-12 bg-red-950/20 border border-red-900/40 text-red-400 p-6 rounded-2xl text-center font-serif italic shadow-xl">
                {error}
              </div>
            )}
            <OnboardingForm onSubmit={handleOnboardingSubmit} />
          </div>
        );

      case 'loading':
        return (
          <div className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center">
            <div className="relative mb-14">
              <div className="w-32 h-32 border-b border-amber/30 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-amber/40 animate-pulse" size={48} />
              </div>
            </div>
            <h2 className="text-4xl text-stone-100 font-bold mb-6 font-serif italic">Meditating on your Path...</h2>
            <p className="text-stone-500 italic max-w-sm font-serif leading-relaxed text-lg">The candles are burning low as we analyze the patterns in your story.</p>
          </div>
        );

      case 'results':
        return results && onboardingData ? (
          <ResultsDashboard 
            data={results} 
            onboardingData={onboardingData} 
            initialMessages={chatHistory} 
            onMessagesUpdate={setChatHistory}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Layout onReset={state !== 'landing' ? handleReset : undefined}>
      {renderState()}
    </Layout>
  );
};

const Sparkles: React.FC<{ className?: string, size?: number }> = ({ className, size = 24 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

export default App;
