
import React from 'react';
import { RefreshCw } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode; onReset?: () => void }> = ({ children, onReset }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-midnight/80 backdrop-blur-md border-b border-white/5 py-5 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-mahogany rounded-lg flex items-center justify-center font-serif text-xl font-bold text-amber border border-amber/20 shadow-lg shadow-black">
            A
          </div>
          <h1 className="text-xl tracking-tight hidden sm:block font-serif">
            The <span className="text-amber italic">Scholar's</span> Mirror
          </h1>
        </div>
        <div className="flex items-center gap-6">
          {onReset && (
            <button 
              onClick={onReset}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-500 hover:text-amber transition-colors group"
              title="Reset Session"
            >
              <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
              New Journey
            </button>
          )}
          <nav className="text-[10px] uppercase tracking-[0.4em] text-amber/60 font-medium border-l border-white/10 pl-6 hidden md:block">
            Whispers of Wisdom
          </nav>
        </div>
      </header>
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-midnight py-12 px-8 text-center text-stone-600 text-xs border-t border-white/5">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="font-serif italic text-sm text-stone-500">"In the depth of winter, I finally learned that there was in me an invincible summer."</p>
          <div className="h-px w-12 bg-amber/20 mx-auto"></div>
          <p className="tracking-widest opacity-60 uppercase">&copy; {new Date().getFullYear()} Academia AI | The Library of Futures</p>
        </div>
      </footer>
    </div>
  );
};
