'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Database,
  Cpu,
  Zap,
  Settings2,
  HardDrive,
  CpuIcon,
  AlertTriangle,
  Brain,
} from 'lucide-react';

const GPUS: Record<string, {name: string, vram: number}> = {
  'h100': { name: 'NVIDIA H100', vram: 80 },
  'h200': { name: 'NVIDIA H200', vram: 141 },
  'b100': { name: 'NVIDIA B100', vram: 100 },
  'b200': { name: 'NVIDIA B200', vram: 141 },
  'b200a': { name: 'NVIDIA B200A', vram: 192 },
  'gb200': { name: 'NVIDIA GB200', vram: 288 },
  'a100-80': { name: 'NVIDIA A100 (80GB)', vram: 80 },
  'a100-40': { name: 'NVIDIA A100 (40GB)', vram: 40 },
  'a10': { name: 'NVIDIA A10', vram: 24 },
  'l40s': { name: 'NVIDIA L40S', vram: 48 },
  'rtx4090': { name: 'RTX 4090', vram: 24 },
  'rtx3090': { name: 'RTX 3090', vram: 24 },
  'mi300x': { name: 'AMD MI300X', vram: 192 },
  'mi250': { name: 'AMD MI250', vram: 128 },
};

const INFERENCE_MODELS: Record<string, {name: string, params: number}> = {
  'llama-3.3-70b': { name: 'Llama 3.3 70B', params: 70 },
  'llama-4-maverick': { name: 'Llama 4 Maverick', params: 400 },
  'llama-4-scout': { name: 'Llama 4 Scout', params: 109 },
  'deepseek-v3': { name: 'DeepSeek-V3', params: 671 },
  'deepseek-r1': { name: 'DeepSeek-R1', params: 671 },
  'qwen2.5-72b': { name: 'Qwen 2.5 72B', params: 72 },
  'qwen2.5-moe': { name: 'Qwen 2.5-MoE', params: 145 },
  'qwen2.5-coder-32b': { name: 'Qwen 2.5 Coder 32B', params: 32 },
  'mistral-large2': { name: 'Mistral Large 2', params: 123 },
  'mistral-small': { name: 'Mistral Small', params: 22 },
  'phi-4': { name: 'Phi-4', params: 14 },
  'phi-4-mini': { name: 'Phi-4 Mini', params: 4 },
  'gemma-3-27b': { name: 'Gemma 3 27B', params: 27 },
  'gemma-3-12b': { name: 'Gemma 3 12B', params: 12 },
  'gemma-2-2b': { name: 'Gemma 2 2B', params: 2 },
  'gpt-4o': { name: 'GPT-4o', params: 200 },
  'gpt-4o-mini': { name: 'GPT-4o Mini', params: 8 },
  'claude-3-5': { name: 'Claude 3.5 Sonnet', params: 175 },
  'claude-3-haiku': { name: 'Claude 3 Haiku', params: 20 },
};

const DATASETS: Record<string, {name: string, tokens: number}> = {
  'pile-1tb': { name: 'The Pile (1TB)', tokens: 300e9 },
  'fineweb-10tb': { name: 'FineWeb (10TB)', tokens: 12e12 },
  'fineweb-edu-2tb': { name: 'FineWeb-Edu (2TB)', tokens: 800e9 },
  'dolma-1tb': { name: 'Dolma (1TB)', tokens: 400e9 },
  'slimporg-500gb': { name: 'SlimPajama (500GB)', tokens: 200e9 },
  'redpajama-1tb': { name: 'RedPajama (1TB)', tokens: 300e9 },
  'cosmopedia-1tb': { name: 'Cosmopedia (1TB)', tokens: 400e9 },
  'wikipedia': { name: 'Wikipedia (en)', tokens: 4e9 },
  'arxiv': { name: 'ArXiv', tokens: 2e9 },
  'github-code': { name: 'GitHub Code', tokens: 800e9 },
};

const TRAINING_MODELS: Record<string, {name: string, params: number}> = {
  'llama-3.1-8b': { name: 'Llama 3.1 8B', params: 8 },
  'llama-3.1-70b': { name: 'Llama 3.1 70B', params: 70 },
  'llama-3.1-405b': { name: 'Llama 3.1 405B', params: 405 },
  'qwen2.5-7b': { name: 'Qwen 2.5 7B', params: 7 },
  'qwen2.5-72b': { name: 'Qwen 2.5 72B', params: 72 },
  'qwen2.5-coder-32b': { name: 'Qwen 2.5 Coder 32B', params: 32 },
  'mixtral-8x7b': { name: 'Mixtral 8x7B', params: 45 },
  'mistral-7b': { name: 'Mistral 7B', params: 7 },
  'phi-4': { name: 'Phi-4', params: 14 },
  'gemma-2-27b': { name: 'Gemma 2 27B', params: 27 },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'inference' | 'training'>('inference');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans">
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
            <button onClick={() => setActiveTab('inference')} className={`px-6 py-2 text-xs font-bold uppercase rounded transition-all ${activeTab === 'inference' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <span className="flex items-center gap-2"><Zap size={14} /> Inference</span>
            </button>
            <button onClick={() => setActiveTab('training')} className={`px-6 py-2 text-xs font-bold uppercase rounded transition-all ${activeTab === 'training' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <span className="flex items-center gap-2"><Brain size={14} /> Training</span>
            </button>
          </div>
        </div>
      </div>
      <div className="p-6">
        {activeTab === 'inference' ? <InferenceSimulator /> : <TrainingSimulator />}
      </div>
    </div>
  );
}

function InferenceSimulator() {
  const [modelKey, setModelKey] = useState('llama-3.3-70b');
  const [gpuKey, setGpuKey] = useState('h100');
  const [phase, setPhase] = useState('idle');
  const [precision, setPrecision] = useState(8);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentModel = INFERENCE_MODELS[modelKey];
  const currentGpu = GPUS[gpuKey];
  const modelMemory = currentModel.params * (precision / 8);
  const isOverflow = modelMemory > currentGpu.vram;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    let running = true;

    const draw = () => {
      if (!running) return;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#1a1a2e';
      for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
      ctx.fillStyle = phase === 'idle' ? '#6366f1' : '#10b981';
      ctx.beginPath();
      ctx.roundRect(width/2 - 60, centerY - 60, 120, 120, 12);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GPU', width/2, centerY - 20);
      ctx.font = '10px sans-serif';
      ctx.fillText(currentGpu.name, width/2, centerY + 5);
      ctx.fillText(`${currentGpu.vram}GB`, width/2, centerY + 20);
      requestAnimationFrame(draw);
    };
    draw();
    return () => { running = false; };
  }, [phase, currentGpu]);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8 bg-[#12121a] rounded-2xl p-4 border border-[#1f1f3a]">
        <canvas ref={canvasRef} width={800} height={300} className="w-full rounded-xl" />
      </div>
      <div className="col-span-4 space-y-4">
        <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
          <label className="text-sm text-gray-400 flex items-center gap-2 mb-3"><Cpu className="w-4 h-4" /> GPU</label>
          <select value={gpuKey} onChange={(e) => setGpuKey(e.target.value)} className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm">
            {Object.entries(GPUS).map(([k, v]) => <option key={k} value={k}>{v.name} ({v.vram}GB)</option>)}
          </select>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
          <label className="text-sm text-gray-400 flex items-center gap-2 mb-3"><Zap className="w-4 h-4" /> Model</label>
          <select value={modelKey} onChange={(e) => setModelKey(e.target.value)} className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm">
            {Object.entries(INFERENCE_MODELS).map(([k, v]) => <option key={k} value={k}>{v.name} ({v.params}B)</option>)}
          </select>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
          <label className="text-sm text-gray-400 flex items-center gap-2 mb-3"><Settings2 className="w-4 h-4" /> Precision</label>
          <div className="flex gap-2">
            {[16, 8, 4].map((p) => (
              <button key={p} onClick={() => setPrecision(p)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${precision === p ? 'bg-blue-600' : 'bg-[#1a1a2e] hover:bg-[#2a2a4a]'}`}>{p}-bit</button>
            ))}
          </div>
        </div>
        <button onClick={() => setPhase(phase === 'idle' ? 'running' : 'idle')} className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition ${phase === 'idle' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
          {phase === 'idle' ? <><Play className="w-4 h-4 inline mr-2" /> Run Inference</> : <><Square className="w-4 h-4 inline mr-2" /> Stop</>}
        </button>
        <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm flex items-center gap-2"><HardDrive className="w-4 h-4" /> VRAM</span>
            <span className="text-xs text-gray-500">{modelMemory.toFixed(1)}GB / {currentGpu.vram}GB</span>
          </div>
          <div className="h-3 bg-[#1a1a2e] rounded-full overflow-hidden">
            <div className={`h-full ${isOverflow ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`} style={{ width: `${Math.min(100, (modelMemory / currentGpu.vram) * 100)}%` }} />
          </div>
          {isOverflow && <div className="mt-2 text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Not enough VRAM!</div>}
        </div>
      </div>
    </div>
  );
}

function TrainingSimulator() {
  const [modelKey, setModelKey] = useState('llama-3.1-8b');
  const [gpuKey, setGpuKey] = useState('h100');
  const [datasetKey, setDatasetKey] = useState('pile-1tb');
  const [phase, setPhase] = useState('idle');
  const [precision, setPrecision] = useState(16);
  const [step, setStep] = useState(0);
  const [loss, setLoss] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentModel = TRAINING_MODELS[modelKey];
  const currentGpu = GPUS[gpuKey];
  const currentDataset = DATASETS[datasetKey];
  const modelMemory = currentModel.params * (precision / 8) * 4;
  const isOverflow = modelMemory > currentGpu.vram;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    let running = true;

    const draw = () => {
      if (!running) return;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#1a1a2e';
      for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
      const leftX = 100, rightX = width - 100, gpuX = width / 2;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath(); ctx.roundRect(leftX, centerY - 40, 80, 80, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Data', leftX + 40, centerY + 5);
      ctx.fillStyle = phase === 'idle' ? '#6366f1' : '#10b981';
      ctx.beginPath(); ctx.roundRect(gpuX - 50, centerY - 50, 100, 100, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText('GPU', gpuX, centerY - 15); ctx.font = '10px sans-serif'; ctx.fillText(currentGpu.name, gpuX, centerY + 5);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.roundRect(rightX, centerY - 40, 80, 80, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText('Model', rightX + 40, centerY + 5);
      if (phase !== 'idle') {
        const t = (Date.now() / 1000) % 1;
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.setLineDash([8, 4]);
        ctx.beginPath(); ctx.moveTo(leftX + 80, centerY); ctx.lineTo(gpuX - 50, centerY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gpuX + 50, centerY); ctx.lineTo(rightX, centerY); ctx.stroke();
        ctx.setLineDash([]);
      }
      requestAnimationFrame(draw);
    };
    draw();
    return () => { running = false; };
  }, [phase, currentGpu]);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8 bg-[#12121a] rounded-2xl p-4 border border-[#1f1f3a]">
        <canvas ref={canvasRef} width={800} height={300} className="w-full rounded-xl" />
      </div>
      <div className="col-span-4 space-y-4">
        <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
          <label className="text-sm text-gray-400 flex items-center gap-2 mb-3"><Cpu className="w-4 h-4" /> GPU</label>
          <select value={gpuKey} onChange={(e) => setGpuKey(e.target.value)} className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm">
            {Object.entries(GPUS).map(([k, v]) => <option key={k} value={k}>{v.name} ({v.vram}GB)</option>)}
          </select>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
          <label className="text-sm text-gray-400 flex items-center gap-2 mb-3"><Brain className="w-4 h-4" /> Model</label>
          <select value={modelKey} onChange={(e) => setModelKey(e.target.value)} className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm">
            {Object.entries(TRAINING_MODELS).map(([k, v]) => <option key={k} value={k}>{v.name} ({v.params}B)</option>)}
          </select>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
          <label className="text-sm text-gray-400 flex items-center gap-2 mb-3"><Database className="w-4 h-4" /> Dataset</label>
          <select value={datasetKey} onChange={(e) => setDatasetKey(e.target.value)} className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm">
            {Object.entries(DATASETS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
          <label className="text-sm text-gray-400 flex items-center gap-2 mb-3"><Settings2 className="w-4 h-4" /> Precision</label>
          <div className="flex gap-2">
            {[16, 8, 4].map((p) => (
              <button key={p} onClick={() => setPrecision(p)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${precision === p ? 'bg-purple-600' : 'bg-[#1a1a2e] hover:bg-[#2a2a4a]'}`}>{p}-bit</button>
            ))}
          </div>
        </div>
        <button onClick={() => setPhase(phase === 'idle' ? 'running' : 'idle')} className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition ${phase === 'idle' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
          {phase === 'idle' ? <><Play className="w-4 h-4 inline mr-2" /> Start Training</> : <><Square className="w-4 h-4 inline mr-2" /> Stop</>}
        </button>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
            <div className="text-gray-400 text-xs">Loss</div>
            <div className="text-xl font-bold text-green-400">{loss.toFixed(4)}</div>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
            <div className="text-gray-400 text-xs">Step</div>
            <div className="text-xl font-bold">{step}</div>
          </div>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm flex items-center gap-2"><HardDrive className="w-4 h-4" /> VRAM (training)</span>
            <span className="text-xs text-gray-500">{modelMemory.toFixed(1)}GB / {currentGpu.vram}GB</span>
          </div>
          <div className="h-3 bg-[#1a1a2e] rounded-full overflow-hidden">
            <div className={`h-full ${isOverflow ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`} style={{ width: `${Math.min(100, (modelMemory / currentGpu.vram) * 100)}%` }} />
          </div>
          {isOverflow && <div className="mt-2 text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Not enough VRAM!</div>}
        </div>
      </div>
    </div>
  );
}
