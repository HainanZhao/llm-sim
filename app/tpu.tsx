'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';

const TPU_CHIPS: Record<string, {name: string, vram: number, teraOps: number, power: string}> = {
  'tpu-v5e': { name: 'TPU v5e', vram: 95, teraOps: 197, power: '300W' },
  'tpu-v5p': { name: 'TPU v5p', vram: 145, teraOps: 459, power: '750W' },
  'tpu-v4': { name: 'TPU v4', vram: 220, teraOps: 275, power: '400W' },
  'tpu-v4-8': { name: 'TPU v4 Pod (8)',
 vram: 1760, teraOps: 2200, power: '3200W' },
  'tpu-v5e-4': { name: 'TPU v5e Pod (4)', vram: 380, teraOps: 788, power: '1200W' },
};

export default function TpuSimulator() {
  const [chipKey, setChipKey] = useState('tpu-v5e');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chip = TPU_CHIPS[chipKey];

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
      // TPU - Google colors
      ctx.fillStyle = '#4285f4';
      ctx.shadowColor = '#4285f4';
      ctx.shadowBlur = 25;
      ctx.beginPath(); ctx.roundRect(width/2 - 80, centerY - 80, 160, 160, 16); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('GOOGLE', width/2, centerY - 30);
      ctx.font = '14px sans-serif'; ctx.fillText(chip.name, width/2, centerY + 5);
      ctx.font = '12px sans-serif'; ctx.fillText(`${chip.teraOps} TOPS`, width/2, centerY + 25);
      ctx.fillStyle = '#34a853'; ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`${chip.vram}GB`, width/2, centerY + 60);
      ctx.font = '10px sans-serif'; ctx.fillText('HBM', width/2, centerY + 75);
      requestAnimationFrame(draw);
    };
    draw();
    return () => { running = false; };
  }, [chip]);

  return (
    <div className="flex gap-4">
      <div className="flex-1 bg-[#12121a] rounded-2xl p-4 border border-blue-500/30">
        <canvas ref={canvasRef} width={800} height={350} className="w-full rounded-xl" />
      </div>
      <div className="w-80 space-y-4">
        <div className="bg-[#12121a] rounded-xl p-4 border border-blue-500/30">
          <label className="text-sm text-gray-400 flex items-center gap-2 mb-3"><Zap className="w-4 h-4" /> TPU</label>
          <select value={chipKey} onChange={(e) => setChipKey(e.target.value)} className="w-full bg-[#1a1a2e] border border-blue-500/30 rounded-lg px-3 py-2 text-sm">
            {Object.entries(TPU_CHIPS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-blue-500/30">
          <div className="text-gray-400 text-xs mb-1">Performance</div>
          <div className="text-3xl font-bold text-blue-400">{chip.teraOps} <span className="text-sm font-normal">TOPS</span></div>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-blue-500/30">
          <div className="text-gray-400 text-xs mb-1">VRAM (HBM)</div>
          <div className="text-2xl font-bold text-white">{chip.vram}GB</div>
        </div>
        <div className="bg-[#12121a] rounded-xl p-4 border border-blue-500/30">
          <div className="text-gray-400 text-xs mb-1">Power</div>
          <div className="text-xl font-bold text-white">{chip.power}</div>
        </div>
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30 text-center">
          <div className="text-blue-400 font-bold text-sm">Google Cloud TPU</div>
          <div className="text-gray-400 text-xs mt-1">Optimized for TensorFlow & JAX</div>
        </div>
      </div>
    </div>
  );
}