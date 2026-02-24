'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';

const TAALAS_CHIPS: Record<string, {name: string, model: string, params: number, tokensPerSec: number, power: string}> = {
  'hc1-8b': { name: 'Taalas HC1', model: 'Llama 3.1 8B', params: 8, tokensPerSec: 17000, power: '50W' },
  'hc1-reasoning': { name: 'Taalas HC1-R', model: 'Reasoning LLM', params: 32, tokensPerSec: 8000, power: '80W' },
};

export default function TaalasSimulator() {
  const [chipKey, setChipKey] = useState('hc1-8b');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chip = TAALAS_CHIPS[chipKey];

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
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.roundRect(width/2 - 80, centerY - 80, 160, 160, 16); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('TAALAS', width/2, centerY - 30);
      ctx.font = '14px sans-serif'; ctx.fillText(chip.name, width/2, centerY + 5);
      ctx.font = '12px sans-serif'; ctx.fillText(chip.model, width/2, centerY + 25);
      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`${chip.tokensPerSec.toLocaleString()}`, width/2, centerY + 60);
      ctx.font = '10px sans-serif'; ctx.fillText('tokens/sec', width/2, centerY + 75);
      requestAnimationFrame(draw);
    };
    draw();
    return () => { running = false; };
  }, [chip]);

  return (
    <div className="flex gap-4">
      <div className="flex-1 bg-[#12121a] rounded-2xl p-4 border border-green-500/30">
        <canvas ref={canvasRef} width={800} height={350} className="w-full rounded-xl" />
      </div>
      <div className="w-80 space-y-4">
        <div className="bg-[#12121a] rounded-xl p-4 border border-green-500/30">
          <label className="text-sm text-gray-400 flex items-center gap-2 mb-3"><Zap className="w-4 h-4" /> Taalas Chip</label>
          <select value={chipKey} onChange={(e) => setChipKey(e.target.value)} className="w-full bg-[#1a1a2e] border border-green-500/30 rounded-lg px-3 py-2 text-sm">
            {Object.entries(TAALAS_CHIPS).map(([k, v]) => <option key={k} value={k}>{v.name} - {v.model}</option>)}
          </select>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-green-500/30">
          <div className="text-gray-400 text-xs mb-1">Model</div>
          <div className="text-xl font-bold text-white">{chip.model}</div>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-green-500/30">
          <div className="text-gray-400 text-xs mb-1">Performance</div>
          <div className="text-3xl font-bold text-green-400">{chip.tokensPerSec.toLocaleString()} <span className="text-sm font-normal">tok/s</span></div>
          <div className="text-xs text-gray-500 mt-1">10x faster than H200</div>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-green-500/30">
          <div className="text-gray-400 text-xs mb-1">Power</div>
          <div className="text-xl font-bold text-white">{chip.power}</div>
          <div className="text-xs text-gray-500 mt-1">10x less than GPU servers</div>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-green-500/30">
          <div className="text-gray-400 text-xs mb-1">VRAM</div>
          <div className="text-xl font-bold text-white">On-chip only</div>
          <div className="text-xs text-gray-500 mt-1">No HBM needed</div>
        </div>
        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30 text-center">
          <div className="text-green-400 font-bold text-sm">Hard-wired Model</div>
          <div className="text-gray-400 text-xs mt-1">Custom silicon for each model</div>
        </div>
      </div>
    </div>
  );
}