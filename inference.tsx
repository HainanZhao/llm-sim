'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Square,
  Info,
  Database,
  Cpu,
  Zap,
  RotateCcw,
  Settings2,
  Activity,
  HardDrive,
  CpuIcon,
  Layers,
  Network,
  Loader2,
  Gauge,
  Terminal,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const GPUS = {
  'h100': { name: 'NVIDIA H100', vram: 80, bandwidth: 3352 },
  'h200': { name: 'NVIDIA H200', vram: 141, bandwidth: 4800 },
  'b100': { name: 'NVIDIA B100', vram: 100, bandwidth: 4000 },
  'b200': { name: 'NVIDIA B200', vram: 141, bandwidth: 5600 },
  'a100-80': { name: 'NVIDIA A100 (80GB)', vram: 80, bandwidth: 2039 },
  'a100-40': { name: 'NVIDIA A100 (40GB)', vram: 40, bandwidth: 1555 },
  'rtx4090': { name: 'RTX 4090', vram: 24, bandwidth: 1008 },
};

const MODELS_2026 = {
  'llama-3.3-70b': {
    name: 'Llama 3.3 70B',
    params: 70,
    defaultPrec: 8,
    layers: 80,
    hidden: 8192,
    heads: 64,
    moe: false,
  },
  'llama-4-mav': {
    name: 'Llama 4 Maverick',
    params: 400,
    defaultPrec: 4,
    layers: 96,
    hidden: 12288,
    heads: 64,
    moe: true,
  },
  'deepseek-v3': {
    name: 'DeepSeek-V3 (671B)',
    params: 671,
    defaultPrec: 4,
    layers: 128,
    hidden: 7168,
    heads: 128,
    moe: true,
  },
  'deepseek-v3.2': {
    name: 'DeepSeek-V3.2',
    params: 671,
    defaultPrec: 4,
    layers: 128,
    hidden: 7168,
    heads: 128,
    moe: true,
  },
  'qwen2.5-72b': {
    name: 'Qwen 2.5 72B',
    params: 72,
    defaultPrec: 8,
    layers: 80,
    hidden: 8192,
    heads: 64,
    moe: false,
  },
  'qwen2.5-moe': {
    name: 'Qwen 2.5-MoE',
    params: 145,
    defaultPrec: 4,
    layers: 60,
    hidden: 6144,
    heads: 48,
    moe: true,
  },
  'mistral-large2': {
    name: 'Mistral Large 2 (123B)',
    params: 123,
    defaultPrec: 8,
    layers: 88,
    hidden: 12288,
    heads: 96,
    moe: false,
  },
  'phi-4': {
    name: 'Phi-4 (14B)',
    params: 14,
    defaultPrec: 16,
    layers: 40,
    hidden: 5120,
    heads: 40,
    moe: false,
  },
  'gemma-3-27b': {
    name: 'Gemma 3 (27B)',
    params: 27,
    defaultPrec: 16,
    layers: 42,
    hidden: 4096,
    heads: 32,
    moe: false,
  },
  'gpt-oss-120b': {
    name: 'GPT-OSS-120B',
    params: 120,
    defaultPrec: 8,
    layers: 80,
    hidden: 8192,
    heads: 64,
    moe: true,
  },
};

const App = () => {
  // --- State Management ---
  const [modelKey, setModelKey] = useState('llama-3.3-70b');
  const [gpuKey, setGpuKey] = useState('h100');
  const [phase, setPhase] = useState('idle'); // idle, prefill, decode, completed
  const [status, setStatus] = useState('SYSTEM_READY');
  const [tokenCount, setTokenCount] = useState(0);
  const [promptSize, setPromptSize] = useState(540);
  const [memoryUsed, setMemoryUsed] = useState(0);
  const [speed, setSpeed] = useState(1.5);
  const [precision, setPrecision] = useState(8);
  const [log, setLog] = useState([]);
  const [generatedWords, setGeneratedWords] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [measuredTPS, setMeasuredTPS] = useState(0);

  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const requestRef = useRef();
  const startTimeRef = useRef(null);

  // Real-time measurement refs
  const lastTokenArrivedRef = useRef(null);
  const tpsHistoryRef = useRef([]);

  const currentModel = MODELS_2026[modelKey];
  const currentGpu = GPUS[gpuKey];

  // --- Constants ---
  const VRAM_CAPACITY = currentGpu.vram;
  const MODEL_PARAMS = currentModel.params;
  const GB_PER_TOKEN = useMemo(() => {
    return (
      (2 * currentModel.layers * currentModel.hidden * (precision / 8)) /
      Math.pow(1024, 3)
    );
  }, [currentModel, precision]);

  const currentWeightsSize = useMemo(
    () => currentModel.params * (precision / 8),
    [currentModel, precision],
  );
  const totalVRAMUsed = memoryUsed + currentWeightsSize;
  const isOverflow = totalVRAMUsed > VRAM_CAPACITY;

  const SAMPLE_STORY_SUMMARY = [
    'SUMMARY:',
    'In',
    'the',
    'year',
    '2026,',
    'AI',
    'models',
    'like',
    currentModel.name,
    'have',
    'surpassed',
    'human',
    'benchmarks',
    'in',
    'coding',
    'and',
    'complex',
    'reasoning.',
    'However,',
    'the',
    'physical',
    'laws',
    'of',
    'memory',
    'bandwidth',
    'still',
    'apply.',
    'As',
    'the',
    'KV',
    'cache',
    'fills',
    'the',
    'HBM3e',
    'stacks,',
    'the',
    'GPU',
    'must',
    'efficiently',
    'pipeline',
    'gigabytes',
    'of',
    'weights',
    'for',
    'every',
    'single',
    'token',
    'generated.',
    'The',
    'bottleneck',
    'is',
    'no',
    'longer',
    'the',
    'math,',
    'but',
    'the',
    'speed',
    'of',
    'light',
    'across',
    'the',
    'bus.',
  ];

  // --- Animation State ---
  const kvCacheMatrix = useRef([]);
  const packets = useRef([]);
  const lastTokenHandledRef = useRef(-1);

  const busLinesY = Array.from({ length: 8 }, (_, i) => 80 + i * 20);

  const addLog = (msg) => {
    setLog((prev) => [msg, ...prev].slice(0, 10));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [generatedWords]);

  useEffect(() => {
    let interval;
    if (phase !== 'idle' && phase !== 'completed') {
      interval = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime((Date.now() - startTimeRef.current) / 1000);
        }
      }, 50);
    } else {
      setMeasuredTPS(0);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const reset = () => {
    setPhase('idle');
    setStatus('SYSTEM_READY');
    setTokenCount(0);
    setMemoryUsed(0);
    setGeneratedWords([]);
    setElapsedTime(0);
    setMeasuredTPS(0);
    kvCacheMatrix.current = [];
    packets.current = [];
    lastTokenHandledRef.current = -1;
    startTimeRef.current = null;
    lastTokenArrivedRef.current = null;
    tpsHistoryRef.current = [];
    addLog(`System Reset. Switched to ${currentModel.name}.`);
  };

  const startInference = () => {
    setPhase('prefill');
    setTokenCount(0);
    setGeneratedWords([]);
    setElapsedTime(0);
    setMeasuredTPS(0);
    lastTokenHandledRef.current = -1;
    startTimeRef.current = Date.now();
    lastTokenArrivedRef.current = null;
    tpsHistoryRef.current = [];
    setStatus('INITIALIZING_TENSORS');
    addLog(`STARTING: ${currentModel.name} (${precision}-bit)`);
  };

  const spawnPacket = (
    sourceX,
    sourceY,
    targetX,
    targetY,
    color,
    size = 3,
    isInput = false,
    type = 'data',
    payload = null,
  ) => {
    packets.current.push({
      x: sourceX,
      y: sourceY,
      tx: targetX,
      ty: targetY,
      busY: busLinesY[Math.floor(Math.random() * 8)],
      color,
      size,
      isInput,
      type,
      payload,
      stage: isInput ? 'input_flow' : 'entrance',
    });
  };

  const animate = (time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Physical Hardware Views
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(35, 45, 140, 215);
    ctx.strokeRect(width - 175, 45, 140, 215);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.fillRect(35, 45, 140, 215);
    ctx.fillRect(width - 175, 45, 140, 215);

    const drawInternalBlocks = (
      x,
      y,
      rows,
      cols,
      size,
      dataRows,
      label,
      active,
    ) => {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(label, x, y - 8);
      const viewStart = Math.max(0, dataRows - rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const actualRowIdx = r + viewStart;
          const hasData = actualRowIdx < dataRows;
          const isLastActiveRow = active && actualRowIdx === dataRows - 1;
          if (isLastActiveRow) {
            ctx.fillStyle = '#3b82f6';
          } else if (hasData) {
            ctx.fillStyle = `rgba(148, 163, 184, 0.6)`;
          } else {
            ctx.fillStyle = 'rgba(51, 65, 85, 0.3)';
          }
          ctx.fillRect(x + c * size, y + r * size, size - 1, size - 1);
        }
      }
    };

    drawInternalBlocks(
      45,
      60,
      25,
      16,
      8,
      kvCacheMatrix.current.length,
      'HBM_KV_CACHE',
      phase === 'decode',
    );
    drawInternalBlocks(
      width - 165,
      100,
      15,
      15,
      8,
      phase !== 'idle' && phase !== 'completed' ? 15 : 0,
      'SRAM_L1_L2',
      phase !== 'idle' && phase !== 'completed',
    );

    busLinesY.forEach((y) => {
      ctx.beginPath();
      ctx.strokeStyle = '#1e293b';
      ctx.moveTo(175, y);
      ctx.lineTo(width - 175, y);
      ctx.stroke();
    });

    // Prefill logic
    if (phase === 'prefill') {
      const progress = Math.min(1, (tokenCount + speed * 3) / promptSize);
      setTokenCount(Math.floor(progress * promptSize));
      const scanY = 50 + progress * 200;
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.moveTo(width - 170, scanY);
      ctx.lineTo(width - 40, scanY);
      ctx.stroke();
      if (Math.random() < 0.4 * speed)
        spawnPacket(width - 100, -10, width - 100, 100, '#3b82f6', 2, true);
      if (Math.random() < 0.3 * speed && progress > 0.4)
        spawnPacket(
          width - 175,
          130,
          175,
          50 + Math.random() * 200,
          '#3b82f6',
          2.5,
        );
      if (kvCacheMatrix.current.length < tokenCount) {
        while (kvCacheMatrix.current.length < tokenCount)
          kvCacheMatrix.current.push(1);
      }
      if (progress >= 1) {
        setPhase('decode');
        setMemoryUsed(promptSize * GB_PER_TOKEN);
      }
    }

    // Decoding logic
    if (phase === 'decode') {
      const cycleTime = 2000 / speed;
      const cycle = (time / cycleTime) % 1;

      if (cycle < 0.25) setStatus('FETCH_WEIGHTS');
      else if (cycle < 0.6) setStatus('STREAMING_BUS');
      else if (cycle < 0.85) setStatus('ATN_COMPUTE');
      else setStatus('WRITE_CACHE');

      if (cycle < 0.25 && time % 15 < 1)
        spawnPacket(width - 175, 150, 175, 100, '#ef4444', 3);
      if (cycle >= 0.25 && cycle < 0.6 && time % 10 < 1)
        spawnPacket(175, 100, width - 175, 150, '#f59e0b', 4);
      if (cycle >= 0.85 && cycle < 0.98 && time % 8 < 1)
        spawnPacket(
          width - 175,
          150,
          175,
          50 + (tokenCount % 25) * 8,
          '#10b981',
          5,
        );

      if (cycle >= 0.98 && lastTokenHandledRef.current !== tokenCount) {
        lastTokenHandledRef.current = tokenCount;
        const nextIdx = tokenCount - promptSize;
        if (nextIdx < SAMPLE_STORY_SUMMARY.length) {
          spawnPacket(
            width - 100,
            50,
            width - 100,
            -10,
            '#60a5fa',
            4,
            true,
            'output',
            SAMPLE_STORY_SUMMARY[nextIdx],
          );
          setTokenCount((t) => t + 1);
          setMemoryUsed((m) => m + GB_PER_TOKEN);
          kvCacheMatrix.current.push(1);
        } else {
          setPhase('completed');
          setStatus('COMPLETED');
          addLog(`STREAM FINISHED: ${tokenCount} total tokens.`);
        }
      }
      if (cycle < 0.1) lastTokenHandledRef.current = -1;
    }

    // Process Packets & Real-time Throughput Calculation
    packets.current = packets.current.filter((p) => {
      let dx, dy;
      const moveSpeed = 0.18 * speed;
      if (p.isInput) {
        dx = p.tx - p.x;
        dy = p.ty - p.y;
        p.x += dx * moveSpeed;
        p.y += dy * moveSpeed;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
          // TOKEN ARRIVED AT HOST
          if (p.type === 'output' && p.payload) {
            const now = Date.now();
            if (lastTokenArrivedRef.current) {
              const diff = (now - lastTokenArrivedRef.current) / 1000;
              const instantTPS = 1 / diff;
              tpsHistoryRef.current.push(instantTPS);
              if (tpsHistoryRef.current.length > 5)
                tpsHistoryRef.current.shift();
              const avgTPS =
                tpsHistoryRef.current.reduce((a, b) => a + b, 0) /
                tpsHistoryRef.current.length;
              setMeasuredTPS(avgTPS);
            }
            lastTokenArrivedRef.current = now;
            setGeneratedWords((prev) => [...prev, p.payload]);
          }
          return false;
        }
      } else {
        // Standard Bus pathing...
        if (p.stage === 'entrance') {
          dx = (p.tx < p.x ? width - 175 : 175) - p.x;
          dy = p.busY - p.y;
          p.x += dx * moveSpeed;
          p.y += dy * moveSpeed;
          if (Math.abs(dx) < 3 && Math.abs(dy) < 3) p.stage = 'bus';
        } else if (p.stage === 'bus') {
          dx = (p.tx < p.x ? 175 : width - 175) - p.x;
          p.x += dx * moveSpeed;
          if (Math.abs(dx) < 3) p.stage = 'exit';
        } else if (p.stage === 'exit') {
          dx = p.tx - p.x;
          dy = p.ty - p.y;
          p.x += dx * moveSpeed;
          p.y += dy * moveSpeed;
          if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return false;
        }
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    // Infrastructure Labels
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HOST PCIe Gen5', width - 100, 8);
    ctx.fillText('HBM STORAGE', 100, 280);
    ctx.fillText('NVLINK BUS', width / 2, 280);
    ctx.fillText('GPU CORES', width - 100, 280);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(width - 100, -10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Visual Legend
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    ctx.fillRect(180, 220, 140, 45);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(180, 220, 140, 45);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(185, 230, 8, 8);
    ctx.fillStyle = '#64748b';
    ctx.font = '8px monospace';
    ctx.fillText('= ACTIVE OPS', 198, 237);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.fillRect(185, 245, 8, 8);
    ctx.fillStyle = '#64748b';
    ctx.fillText('= STORED DATA', 198, 252);

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [phase, speed, precision, tokenCount, status, modelKey]);

  return (
    <div className="flex flex-col h-screen bg-[#020617] font-sans text-slate-300 select-none overflow-hidden">
      <div className="border-b border-slate-800 px-6 py-4 flex justify-between items-center bg-[#020617] h-18 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
            <CpuIcon className="text-blue-400 w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white uppercase italic truncate">
              {currentGpu.name.toUpperCase().replace(/ /g, '_')}_SIM // PIPELINE_OBSERVER
            </h1>
            <div className="flex gap-2 items-center text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              <span className="flex items-center gap-1">
                <Layers size={10} /> {currentModel.name}
              </span>
              <span className="flex items-center gap-1 text-blue-500/80">
                <Network size={10} /> {currentGpu.bandwidth} GB/S
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-8 shrink-0">
          <HUDStat
            icon={<Clock size={12} />}
            label="ELAPSED"
            value={`${elapsedTime.toFixed(2)}s`}
            color="text-slate-400"
          />
          <HUDStat
            icon={<Zap size={12} />}
            label="THROUGHPUT"
            value={`${measuredTPS.toFixed(1)} t/s`}
            color="text-amber-400"
          />
          <div
            className={`px-4 py-1 rounded border font-mono text-xs font-bold transition-all ${
              phase === 'idle'
                ? 'border-slate-800 text-slate-600'
                : phase === 'completed'
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-green-500 text-green-400 bg-green-500/5'
            }`}
          >
            {phase.toUpperCase()}
          </div>
        </div>
      </div>

      <main className="flex-1 flex p-4 gap-4 overflow-auto min-h-0">
        <div className="flex-[3] flex flex-col gap-4 min-w-0 h-full overflow-hidden">
          <div className="bg-black/60 border border-slate-800 rounded-xl p-3 flex gap-2 items-center h-14 shrink-0 overflow-hidden shadow-lg">
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-900 rounded text-[10px] font-bold text-blue-400 border border-blue-900/50 shrink-0">
              <Terminal size={12} /> OUTPUT_STREAM
            </div>
            <div
              ref={scrollRef}
              className="flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-hide flex-1 items-center min-w-0"
            >
              {generatedWords.length === 0 && (
                <span className="text-slate-700 italic text-xs">
                  Waiting for stream...
                </span>
              )}
              {generatedWords.map((word, i) => (
                <span
                  key={i}
                  className={`text-xs font-medium ${i === generatedWords.length - 1 && phase !== 'completed' ? 'text-white animate-pulse font-bold' : 'text-slate-400'}`}
                >
                  {word}
                </span>
              ))}
              {phase === 'completed' && (
                <span className="ml-2 text-blue-400 flex items-center gap-1 font-bold text-xs">
                  <CheckCircle2 size={12} /> DONE
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-2xl flex-1 relative flex flex-col overflow-hidden min-h-0 min-h-[280px]">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 border border-slate-700 px-6 py-2 rounded-full backdrop-blur-md flex items-center gap-3 z-10">
              {phase === 'prefill' || phase === 'decode' ? (
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              ) : phase === 'completed' ? (
                <CheckCircle2 className="w-3 h-3 text-green-400" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-600" />
              )}
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-100 uppercase">
                {status}
              </span>
            </div>
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              className="w-full flex-1 pt-12 min-h-0"
            />

            <div className="p-4 bg-black/40 border-t border-slate-800 flex justify-between items-center gap-10 shrink-0 h-28">
              <DetailedStat
                label="KV Memory Pairs"
                value={`${tokenCount}`}
                sub="Context Resident"
              />
              <div className="flex-1 flex flex-col gap-2 min-w-[280px]">
                 <div className="flex justify-between items-end">
                   <div className="flex flex-col">
                     <span className="text-[8px] font-bold uppercase text-slate-500 flex items-center gap-1">
                       KV_Cache usage <Info size={8} className="text-slate-600" />
                     </span>
                     <span className="text-xs font-mono font-bold text-blue-400">
                       {memoryUsed.toFixed(3)} GB
                     </span>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="text-[8px] font-bold uppercase text-slate-500">
                       Total VRAM load
                     </span>
                     <span
                       className={`text-xs font-mono font-bold ${isOverflow ? 'text-red-500 animate-pulse' : 'text-blue-200'}`}
                     >
                       {totalVRAMUsed.toFixed(1)} / {VRAM_CAPACITY} GB
                     </span>
                   </div>
                 </div>
                 <div className="text-[9px] font-mono text-slate-500 bg-slate-900/50 px-2 py-1 rounded border border-slate-800">
                   <span className="text-slate-600">Formula:</span> {tokenCount} × 2 × {currentModel.layers} layers × {currentModel.hidden} hidden × ({precision}/8) B ÷ 1024³
                 </div>
                 <div
                   className={`w-full h-2 rounded-full overflow-hidden border p-0.5 flex items-center ${isOverflow ? 'bg-red-950 border-red-500' : 'bg-slate-900 border-slate-800'}`}
                 >
                   <div
                     className={`h-full transition-all duration-300 rounded-full ${isOverflow ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`}
                     style={{
                       width: `${Math.min(100, (totalVRAMUsed / VRAM_CAPACITY) * 100)}%`,
                     }}
                   ></div>
                 </div>
               </div>
              <DetailedStat
                label="Arithmetic"
                value={
                  phase === 'prefill'
                    ? 'HIGH'
                    : phase === 'completed'
                      ? 'IDLE'
                      : 'LOW'
                }
                sub={phase === 'prefill' ? 'Prefill Phase' : 'Decoding Phase'}
              />
            </div>
          </div>
        </div>

        <div className="w-80 flex flex-col gap-4 shrink-0 h-full overflow-hidden">
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-6 shrink-0 shadow-xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Settings2 size={14} /> Global_Config
            </h3>
            <div className="space-y-6">
              <ControlGroup label="GPU / Accelerator" value={`${currentGpu.vram}GB`}>
                <div className="relative group">
                  <select
                    value={gpuKey}
                    onChange={(e) => setGpuKey(e.target.value)}
                    disabled={phase !== 'idle' && phase !== 'completed'}
                    className="w-full bg-[#020617] border border-slate-800 text-xs text-white py-2.5 px-3 rounded-lg appearance-none cursor-pointer hover:border-green-500 transition-colors"
                  >
                    {Object.entries(GPUS).map(([key, g]) => (
                      <option key={key} value={key}>
                        {g.name} ({g.vram}GB)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </ControlGroup>
              <ControlGroup label="Model">
                <div className="relative group">
                  <select
                    value={modelKey}
                    onChange={(e) => {
                      setModelKey(e.target.value);
                      reset();
                    }}
                    disabled={phase !== 'idle' && phase !== 'completed'}
                    className="w-full bg-[#020617] border border-slate-800 text-xs text-white py-2.5 px-3 rounded-lg appearance-none cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {Object.entries(MODELS_2026).map(([key, m]) => (
                      <option key={key} value={key}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </ControlGroup>
              <ControlGroup
                label="Playback Speed"
                value={`${speed.toFixed(1)}x`}
              >
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.5"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none accent-amber-500"
                />
              </ControlGroup>
              <ControlGroup label="Prompt Size" value={`${promptSize} tokens`}>
                <input
                  type="range"
                  min="128"
                  max="4096"
                  step="128"
                  value={promptSize}
                  onChange={(e) => setPromptSize(parseInt(e.target.value))}
                  disabled={phase !== 'idle' && phase !== 'completed'}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none accent-blue-500"
                />
              </ControlGroup>
              <ControlGroup label="Precision">
                <div className="grid grid-cols-3 gap-1">
                  {[16, 8, 4].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrecision(p)}
                      disabled={phase !== 'idle' && phase !== 'completed'}
                      className={`py-2 text-[10px] font-bold rounded border transition-all ${precision === p ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-transparent text-slate-500 border-slate-800'}`}
                    >
                      {p}-BIT
                    </button>
                  ))}
                </div>
              </ControlGroup>
              <div className="pt-2">
                <button
                  onClick={
                    phase === 'idle' || phase === 'completed'
                      ? startInference
                      : reset
                  }
                  className={`w-full py-3 rounded font-black text-xs uppercase tracking-tighter transition-all ${phase === 'idle' || phase === 'completed' ? 'bg-white text-black hover:bg-blue-400 shadow-xl' : 'bg-red-900/20 text-red-500 border border-red-900/50'}`}
                >
                  {phase === 'idle' || phase === 'completed'
                    ? 'Run Inference'
                    : 'Halt Simulation'}
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-black rounded-xl p-5 border border-slate-800 flex flex-col font-mono text-[10px] overflow-hidden shadow-inner">
            <div className="text-slate-600 border-b border-slate-900 pb-2 mb-3 flex justify-between shrink-0">
              <span>SYSTEM_LOG</span>
              <span className="animate-pulse text-red-500 font-bold uppercase tracking-widest italic">
                ● REC
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar min-h-0">
              {log.map((entry, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${i === 0 ? 'text-blue-400' : 'text-slate-500'}`}
                >
                  <span className="opacity-30 shrink-0">
                    [
                    {new Date().toLocaleTimeString([], {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                    ]
                  </span>
                  <span className="break-all">{entry}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        input[type=range] { cursor: pointer; }
      `,
        }}
      />
    </div>
  );
};

const HUDStat = ({ icon, label, value, color }) => (
  <div className="text-right flex flex-col justify-center">
    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter flex items-center justify-end gap-1">
      {icon} {label}
    </div>
    <div className={`text-[10px] font-mono font-bold ${color} truncate`}>
      {value}
    </div>
  </div>
);

const DetailedStat = ({ label, value, sub }) => (
  <div className="shrink-0 w-32">
    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
      {label}
    </div>
    <div className="text-sm font-bold text-white font-mono truncate">
      {value}
    </div>
    <div className="text-[8px] text-slate-600 uppercase font-bold truncate">
      {sub}
    </div>
  </div>
);

const ControlGroup = ({ label, value, children }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[10px]">
      <label className="font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      {value && <span className="text-blue-400 font-mono">{value}</span>}
    </div>
    {children}
  </div>
);

export default App;
