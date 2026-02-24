
import React, { useState } from 'react';
import { OnboardingData } from '../types';
import { Heart, XCircle, Zap, MapPin, DollarSign, Target, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';

interface Props {
  onSubmit: (data: OnboardingData) => void;
}

const steps = [
  { 
    id: 'interests', 
    label: 'Academic Interests', 
    question: 'What are your primary academic interests?', 
    icon: Heart, 
    placeholder: 'Identify subjects or activities that drive your curiosity...' 
  },
  { 
    id: 'dislikes', 
    label: 'Career Avoidance', 
    question: 'What career paths or subjects do you definitely want to avoid?', 
    icon: XCircle, 
    placeholder: 'List environments or topics you find draining...' 
  },
  { 
    id: 'skills', 
    label: 'Core Skills', 
    question: 'What are your strongest technical or soft skills?', 
    icon: Zap, 
    placeholder: 'Examples: Mathematics, writing, leadership, problem solving...' 
  },
  { 
    id: 'curriculum', 
    label: 'Curriculum Preference', 
    question: 'What curriculum do you prefer (IB, AP, A-Levels, etc.) and why?', 
    icon: BookOpen, 
    placeholder: 'Explain your current system or your preference for the future...' 
  },
  { 
    id: 'location', 
    label: 'Location Preference', 
    question: 'In which countries or regions do you wish to study?', 
    icon: MapPin, 
    placeholder: 'Specify cities, countries, or regions of interest...' 
  },
  { 
    id: 'budget', 
    label: 'Financial Provision', 
    question: 'What is your maximum annual tuition budget?', 
    icon: DollarSign, 
    placeholder: 'Provide a numeric range (e.g. $15,000 - $30,000)...' 
  },
  { 
    id: 'goals', 
    label: 'Career Vision', 
    question: 'Where do you intend to be professionally in 10 years?', 
    icon: Target, 
    placeholder: 'Define your desired impact or professional role...' 
  },
];

export const OnboardingForm: React.FC<Props> = ({ onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    interests: '',
    dislikes: '',
    skills: '',
    location: '',
    budget: '',
    goals: '',
    curriculum: '',
  });

  const activeStep = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(formData);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-xl mx-auto py-20 px-6">
      <div className="mb-12 text-center">
        <div className="inline-block px-3 py-1 rounded-full border border-amber/20 bg-amber/5 mb-4">
           <span className="text-[10px] uppercase tracking-[0.3em] text-amber font-bold">
             Step {currentStep + 1} of {steps.length}
           </span>
        </div>
        <div className="w-full h-px bg-white/5 relative">
          <div 
            className="absolute top-0 left-0 h-px bg-amber transition-all duration-1000 ease-in-out shadow-[0_0_8px_rgba(217,160,91,0.5)]" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="manuscript-card rounded-2xl p-10 md:p-14 shadow-2xl relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber/5 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col gap-6 mb-10">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-mahogany border border-amber/30 text-amber">
            <activeStep.icon size={20} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl md:text-3xl text-stone-200 font-bold leading-snug font-serif">
            {activeStep.question}
          </h2>
        </div>

        <textarea
          autoFocus
          className="w-full h-40 bg-transparent border-b border-stone-800 focus:border-amber outline-none text-xl text-stone-300 transition-all resize-none font-serif placeholder:text-stone-700 placeholder:italic leading-relaxed"
          placeholder={activeStep.placeholder}
          value={(formData as any)[activeStep.id]}
          onChange={(e) => setFormData({ ...formData, [activeStep.id]: e.target.value })}
        />

        <div className="mt-14 flex items-center gap-6">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="p-4 rounded-full border border-stone-800 text-stone-500 hover:text-amber hover:border-amber/50 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!(formData as any)[activeStep.id].trim()}
            className={`flex-1 py-5 rounded-xl font-bold flex items-center justify-center gap-3 transition-all uppercase text-xs tracking-[0.3em] ${
              !(formData as any)[activeStep.id].trim()
              ? 'bg-stone-900 text-stone-600 cursor-not-allowed'
              : 'bg-amber text-black hover:bg-amber/90 transform active:scale-[0.98] shadow-lg shadow-amber/10'
            }`}
          >
            {currentStep === steps.length - 1 ? 'Analyze Path' : 'Continue'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
