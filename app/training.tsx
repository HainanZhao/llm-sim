'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Database, Cpu, Settings2, HardDrive, AlertTriangle, Brain } from 'lucide-react';

const GPUS: Record<string, {name: string, vram: number}> = {
  'h100': { name: 'NVIDIA H100', vram: 80 },
  'h200': { name: 'NVIDIA H200', vram: 141 },
  'b100': { name: 'NVIDIA B100', vram: 100 },
  'b200': { name: 'NVIDIA B200', vram: 141 },
  'a100-80': { name: 'NVIDIA A100 (80GB)', vram: 80 },
  'a100-40': { name: 'NVIDIA A100 (40GB)', vram: 40 },
};

const DATASETS: Record<string, {name: string}> = {
  'pile-1tb': { name: 'The Pile (1TB)' },
  'fineweb-2tb': { name: 'FineWeb-Edu (2TB)' },
  'dolma-1tb': { name: 'Dolma (1TB)' },
  'slimporg-500gb': { name: 'SlimPajama (500GB)' },
};

const MODELS: Record<string, {name: string, params: number}> = {
  'llama-3.1-8b': { name: 'Llama 3.1 8B', params: 8 },
  'llama-3.1-70b': { name: 'Llama 3.1 70B', params: 70 },
  'qwen2.5-7b': { name: 'Qwen 2.5 7B', params: 7 },
  'qwen2.5-72b': { name: 'Qwen 2.5 72B', params: 72 },
  'mixtral-8x7b': { name: 'Mixtral 8x7B', params: 45 },
};

export default function TrainingSimulator() {
  const [modelKey, setModelKey] = useState('llama-3.1-8b');
  const [gpuKey, setGpuKey] = useState('h100');
  const [datasetKey, setDatasetKey] = useState('pile-1tb');
  const [phase, setPhase] = useState('idle');
  const [precision, setPrecision] = useState(16);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentModel = MODELS[modelKey];
  const currentGpu = GPUS[gpuKey];
  const modelMemory = currentModel.params * (precision / 8) * 4;
  const isOverflow = modelMemory > currentGpu.vram;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width, height = canvas.height, centerY = height / 2;
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
      ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Data', leftX + 40, centerY + 5);
      ctx.fillStyle = phase === 'idle' ? '#6366f1' : '#10b981';
      ctx.beginPath(); ctx.roundRect(gpuX - 50, centerY - 50, 100, 100, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText('GPU', gpuX, centerY - 15); ctx.font = '10px sans-serif'; ctx.fillText(currentGpu.name, gpuX, centerY + 5);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.roundRect(rightX, centerY - 40, 80, 80, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText('Model', rightX + 40, centerY + 5);
      if (phase !== 'idle') {
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
    <div className="flex gap-4">
      <div className="flex-1 bg-[#0f172a] rounded-xl border border-slate-800 p-4 relative">
        <canvas ref={canvasRef} width={800} height={350} className="w-full" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 border border-slate-700 px-6 py-2 rounded-full flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${phase === 'idle' ? 'bg-slate-600' : 'bg-green-500 animate-pulse'}`} />
          <span className="text-[10px] font-mono font-bold uppercase">{phase === 'idle' ? 'IDLE' : 'TRAINING'}</span>
        </div>
      </div>
      <div className="w-80 space-y-4">
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <label className="text-xs text-slate-500 font-bold uppercase mb-2 block"><Cpu className="w-3 h-3 inline" /> GPU</label>
          <select value={gpuKey} onChange={(e) => setGpuKey(e.target.value)} className="w-full bg-[#020617] border border-slate-800 text-xs text-white py-2 px-3 rounded-lg">
            {Object.entries(GPUS).map(([k, v]) => <option key={k} value={k}>{v.name} ({v.vram}GB)</option>)}
          </select>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <label className="text-xs text-slate-500 font-bold uppercase mb-2 block"><Brain className="w-3 h-3 inline" /> Model</label>
          <select value={modelKey} onChange={(e) => setModelKey(e.target.value)} className="w-full bg-[#020617] border border-slate-800 text-xs text-white py-2 px-3 rounded-lg">
            {Object.entries(MODELS).map(([k, v]) => <option key={k} value={k}>{v.name} ({v.params}B)</option>)}
          </select>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <label className="text-xs text-slate-500 font-bold uppercase mb-2 block"><Database className="w-3 h-3 inline" /> Dataset</label>
          <select value={datasetKey} onChange={(e) => setDatasetKey(e.target.value)} className="w-full bg-[#020617] border border-slate-800 text-xs text-white py-2 px-3 rounded-lg">
            {Object.entries(DATASETS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <label className="text-xs text-slate-500 font-bold uppercase mb-2 block"><Settings2 className="w-3 h-3 inline" /> Precision</label>
          <div className="flex gap-2">
            {[16, 8, 4].map((p) => (
              <button key={p} onClick={() => setPrecision(p)} className={`flex-1 py-2 rounded-lg text-xs font-medium ${precision === p ? 'bg-purple-600' : 'bg-slate-800'}`}>{p}-bit</button>
            ))}
          </div>
        </div>
        <button onClick={() => setPhase(phase === 'idle' ? 'running' : 'idle')} className={`w-full py-3 rounded-lg font-bold text-xs uppercase ${phase === 'idle' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
          {phase === 'idle' ? <><Play className="w-4 h-4 inline mr-2" /> Start Training</> : <><Square className="w-4 h-4 inline mr-2" /> Stop</>}
        </button>
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-500"><HardDrive className="w-3 h-3 inline" /> VRAM (training)</span>
            <span className="text-slate-400">{modelMemory.toFixed(1)}GB / {currentGpu.vram}GB</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${isOverflow ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(100, (modelMemory / currentGpu.vram) * 100)}%` }} />
          </div>
          {isOverflow && <div className="mt-2 text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Not enough VRAM!</div>}
        </div>
      </div>
    </div>
  );
}
