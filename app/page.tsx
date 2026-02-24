'use client';

import { useState } from 'react';
import { CpuIcon, Zap, Brain } from 'lucide-react';
import dynamic from 'next/dynamic';

// Use dynamic imports to reduce initial bundle size
const InferenceSimulator = dynamic(() => import('./inference'), { ssr: false });
const TrainingSimulator = dynamic(() => import('./training'), { ssr: false });
const TaalasSimulator = dynamic(() => import('./taalas'), { ssr: false });

export default function App() {
  const [activeTab, setActiveTab] = useState<'inference' | 'training' | 'taalas'>('inference');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 bg-[#020617]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
              <CpuIcon className="text-blue-400 w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white uppercase italic">LLM_SIM</h1>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Hardware Pipeline Visualization</div>
            </div>
          </div>
          <div className="flex gap-1 bg-[#0a0a0f] p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('inference')} 
              className={`px-4 py-2 text-xs font-bold uppercase rounded transition-all ${activeTab === 'inference' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <span className="flex items-center gap-2"><Zap size={14} /> GPU</span>
            </button>
            <button 
              onClick={() => setActiveTab('training')} 
              className={`px-4 py-2 text-xs font-bold uppercase rounded transition-all ${activeTab === 'training' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <span className="flex items-center gap-2"><Brain size={14} /> Train</span>
            </button>
            <button 
              onClick={() => setActiveTab('taalas')} 
              className={`px-4 py-2 text-xs font-bold uppercase rounded transition-all ${activeTab === 'taalas' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <span className="flex items-center gap-2"><Zap size={14} /> Taalas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'inference' && <InferenceSimulator />}
        {activeTab === 'training' && <TrainingSimulator />}
        {activeTab === 'taalas' && <TaalasSimulator />}
      </div>
    </div>
  );
}