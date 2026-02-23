'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
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
  Layers,
  Network,
  Loader2,
  Gauge,
  Terminal,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Clock,
  Brain,
  TrendingUp,
  Target,
  FlaskConical,
  CpuIcon,
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

const DATASETS = {
  'pile-1tb': { name: 'The Pile (1TB)', size: 1, tokens: 300e9 },
  'fineweb-2tb': { name: 'FineWeb-Edu (2TB)', size: 2, tokens: 800e9 },
  'dolma-1tb': { name: 'Dolma (1TB)', size: 1, tokens: 400e9 },
  'slimporg-500gb': { name: 'SlimPajama (500GB)', size: 0.5, tokens: 200e9 },
  'custom-1tb': { name: 'Custom Dataset (1TB)', size: 1, tokens: 300e9 },
};

const MODELS = {
  'llama-3.1-8b': {
    name: 'Llama 3.1 8B',
    params: 8,
    layers: 32,
    hidden: 4096,
    heads: 32,
  },
  'llama-3.1-70b': {
    name: 'Llama 3.1 70B',
    params: 70,
    layers: 80,
    hidden: 8192,
    heads: 64,
  },
  'llama-4-maverick': {
    name: 'Llama 4 Maverick',
    params: 400,
    layers: 96,
    hidden: 12288,
    heads: 64,
  },
  'qwen2.5-7b': {
    name: 'Qwen 2.5 7B',
    params: 7,
    layers: 28,
    hidden: 3584,
    heads: 28,
  },
  'qwen2.5-72b': {
    name: 'Qwen 2.5 72B',
    params: 72,
    layers: 80,
    hidden: 8192,
    heads: 64,
  },
  'mistral-7b': {
    name: 'Mistral 7B',
    params: 7,
    layers: 32,
    hidden: 4096,
    heads: 32,
  },
  'mixtral-8x7b': {
    name: 'Mixtral 8x7B',
    params: 45,
    layers: 44,
    hidden: 4096,
    heads: 32,
  },
};

const App = () => {
  // --- State Management ---
  const [modelKey, setModelKey] = useState('llama-3.1-8b');
  const [gpuKey, setGpuKey] = useState('h100');
  const [datasetKey, setDatasetKey] = useState('pile-1tb');
  const [phase, setPhase] = useState('idle'); // idle, loading_data, preprocessing, forward, backward, updating, completed
  const [status, setStatus] = useState('SYSTEM_READY');
  const [epoch, setEpoch] = useState(0);
  const [step, setStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(10000);
  const [loss, setLoss] = useState(0);
  const [learningRate, setLearningRate] = useState(1e-4);
  const [batchSize, setBatchSize] = useState(32);
  const [memoryUsed, setMemoryUsed] = useState(0);
  const [precision, setPrecision] = useState(16);
  const [log, setLog] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [samplesPerSec, setSamplesPerSec] = useState(0);
  const [tokensPerSec, setTokensPerSec] = useState(0);
  const [gradNorm, setGradNorm] = useState(0);
  const [lrDecay, setLrDecay] = useState('cosine');
  const [warmupSteps, setWarmupSteps] = useState(500);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Training measurement refs
  const lastTokenArrivedRef = useRef<number | null>(null);
  const lossHistoryRef = useRef<number[]>([]);

  const currentModel = (MODELS as any)[modelKey];
  const currentGpu = (GPUS as any)[gpuKey];
  const currentDataset = (DATASETS as any)[datasetKey];

  // --- Constants ---
  const VRAM_CAPACITY = currentGpu.vram;
  const MODEL_PARAMS = currentModel.params;
  
  // Training memory calculation (roughly 4x inference for gradients + optimizer states)
  const MEMORY_PER_PARAM = (precision / 8) * 4; // model + gradient + optimizer states
  const modelMemory = MODEL_PARAMS * MEMORY_PER_PARAM;
  const activationsMemory = MODEL_PARAMS * 0.5; // approximate
  const totalTrainingMemory = modelMemory + activationsMemory;
  const isOverflow = totalTrainingMemory > VRAM_CAPACITY;

  const tokensPerBatch = batchSize * 4096; // assume seq len 4096
  const estimatedSteps = Math.floor((currentDataset.tokens * 0.8) / tokensPerBatch);

  // Loss curve simulation
  const lossHistory = useMemo(() => {
    const history = [];
    let l = 4.0;
    for (let i = 0; i <= Math.min(step, 100); i++) {
      l = l * 0.96 + Math.random() * 0.1;
      history.push(l);
    }
    return history;
  }, [step]);

  const addLog = (msg: string) => {
    setLog((prev) => [msg, ...prev].slice(0, 10));
  };

  // --- Simulation ---
  useEffect(() => {
    if (phase === 'idle') return;

    if (phase === 'loading_data') {
      setStatus('LOADING_DATASET_TO_VRAM');
      addLog(`Loading ${currentDataset.name}...`);
      setTimeout(() => setPhase('preprocessing'), 1500);
      return;
    }

    if (phase === 'preprocessing') {
      setStatus('TOKENIZING_AND_BATCHING');
      addLog('Tokenizing dataset and creating batches...');
      setTimeout(() => setPhase('forward'), 2000);
      return;
    }

    if (phase === 'forward') {
      setStatus('FORWARD_PASS_COMPUTING');
      addLog(`Forward pass: computing predictions (batch ${step}/${totalSteps})`);
      
      const timer = setInterval(() => {
        if (phase !== 'forward') {
          clearInterval(timer);
          return;
        }
        
        setStep((s) => {
          const newStep = s + 1;
          setTotalSteps(estimatedSteps);
          
          // Simulate loss decreasing
          setLoss((l) => Math.max(0.1, l * 0.998 + Math.random() * 0.02));
          
          // Simulate samples/sec
          setSamplesPerSec(50 + Math.random() * 30);
          setTokensPerSec(samplesPerSec * tokensPerBatch);
          
          // Grad norm simulation
          setGradNorm(1.5 + Math.random() * 0.5);
          
          if (newStep >= estimatedSteps) {
            clearInterval(timer);
            setPhase('completed');
            setStatus('TRAINING_COMPLETED');
            addLog(`Training completed! Final loss: ${loss.toFixed(4)}`);
          }
          
          return newStep;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [phase, currentDataset.name, estimatedSteps, step, loss, samplesPerSec, tokensPerBatch]);

  // Progress animation
  useEffect(() => {
    if (phase === 'idle' || phase === 'completed') return;

    const interval = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const startTraining = () => {
    setPhase('loading_data');
    setStep(0);
    setLoss(3.5 + Math.random());
    setElapsedTime(0);
    setLog(['Starting training...']);
  };

  const resetTraining = () => {
    setPhase('idle');
    setStatus('SYSTEM_READY');
    setStep(0);
    setEpoch(0);
    setLoss(0);
    setElapsedTime(0);
    setLog([]);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  // --- Canvas Animation ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Training Flow Visualization
      const centerY = height / 2;
      const leftX = 80;
      const rightX = width - 80;

      // Data Source (left)
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(leftX, centerY - 50, 100, 100, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Dataset', leftX + 50, centerY + 5);

      // GPU (middle)
      const gpuX = width / 2;
      ctx.fillStyle = phase === 'forward' ? '#10b981' : '#6366f1';
      ctx.beginPath();
      ctx.roundRect(gpuX - 60, centerY - 60, 120, 120, 12);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('GPU', gpuX, centerY - 20);
      ctx.font = '10px sans-serif';
      ctx.fillText(currentGpu.name, gpuX, centerY + 5);
      ctx.fillText(`${currentGpu.vram}GB VRAM`, gpuX, centerY + 20);

      // Model Weights (right)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(rightX, centerY - 50, 100, 100, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Model', rightX + 50, centerY + 5);
      ctx.font = '10px sans-serif';
      ctx.fillText(`${currentModel.params}B params`, rightX + 50, centerY + 20);

      // Animated data flow
      if (phase === 'forward' || phase === 'backward') {
        const t = (Date.now() / 1000) % 1;
        
        // Data to GPU
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(leftX + 100, centerY);
        ctx.lineTo(gpuX - 60, centerY);
        ctx.stroke();
        
        // GPU to Model (gradients update)
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(gpuX + 60, centerY);
        ctx.lineTo(rightX, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Flowing particles
        for (let i = 0; i < 3; i++) {
          const offset = (t + i * 0.33) % 1;
          const x = leftX + 100 + (gpuX - 60 - leftX - 100) * offset;
          ctx.fillStyle = '#60a5fa';
          ctx.beginPath();
          ctx.arc(x, centerY, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Gradient particles
        for (let i = 0; i < 3; i++) {
          const offset = (t + i * 0.33) % 1;
          const x = gpuX + 60 + (rightX - gpuX - 60) * offset;
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(x, centerY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Status indicator
      ctx.fillStyle = phase === 'completed' ? '#10b981' : phase === 'idle' ? '#6b7280' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(width - 40, 40, 8, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [phase, currentGpu, currentModel, step]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">LLM Training Simulator</h1>
            <p className="text-gray-400 text-sm">Visualize training costs and resource usage</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition"
          >
            Inference
          </Link>
          <Link
            href="/training"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 transition"
          >
            Training
          </Link>
        </div>
        
        <div className="flex gap-3">
          {phase === 'idle' ? (
            <button
              onClick={startTraining}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
            >
              <Play className="w-4 h-4" /> Start Training
            </button>
          ) : phase === 'completed' ? (
            <button
              onClick={resetTraining}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          ) : (
            <button
              onClick={resetTraining}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Canvas */}
        <div className="col-span-8 bg-[#12121a] rounded-2xl p-4 border border-[#1f1f3a]">
          <canvas
            ref={canvasRef}
            width={800}
            height={300}
            className="w-full rounded-xl"
          />
          
          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${phase === 'completed' ? 'bg-green-500' : phase === 'idle' ? 'bg-gray-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-sm text-gray-400">{status.replace(/_/g, ' ')}</span>
            </div>
            <div className="text-sm text-gray-500">
              Elapsed: {formatTime(elapsedTime)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="col-span-4 space-y-4">
          {/* Model Selection */}
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
            <label className="text-sm text-gray-400 flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" /> Model
            </label>
            <select
              value={modelKey}
              onChange={(e) => setModelKey(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(MODELS).map(([k, v]) => (
                <option key={k} value={k}>{v.name} ({v.params}B)</option>
              ))}
            </select>
          </div>

          {/* GPU Selection */}
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
            <label className="text-sm text-gray-400 flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4" /> GPU
            </label>
            <select
              value={gpuKey}
              onChange={(e) => setGpuKey(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(GPUS).map(([k, v]) => (
                <option key={k} value={k}>{v.name} ({v.vram}GB)</option>
              ))}
            </select>
          </div>

          {/* Dataset Selection */}
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
            <label className="text-sm text-gray-400 flex items-center gap-2 mb-3">
              <Database className="w-4 h-4" /> Dataset
            </label>
            <select
              value={datasetKey}
              onChange={(e) => setDatasetKey(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(DATASETS).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Precision */}
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
            <label className="text-sm text-gray-400 flex items-center gap-2 mb-3">
              <Settings2 className="w-4 h-4" /> Precision (bit)
            </label>
            <div className="flex gap-2">
              {[16, 8, 4].map((p) => (
                <button
                  key={p}
                  onClick={() => setPrecision(p)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    precision === p ? 'bg-indigo-600' : 'bg-[#1a1a2e] hover:bg-[#2a2a4a]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="col-span-4 grid grid-cols-2 gap-4">
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
            <div className="text-gray-400 text-xs mb-1">Training Loss</div>
            <div className="text-2xl font-bold text-green-400">{loss.toFixed(4)}</div>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
            <div className="text-gray-400 text-xs mb-1">Step</div>
            <div className="text-2xl font-bold">{formatNumber(step)} / {formatNumber(estimatedSteps)}</div>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
            <div className="text-gray-400 text-xs mb-1">Samples/sec</div>
            <div className="text-2xl font-bold text-blue-400">{samplesPerSec.toFixed(1)}</div>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
            <div className="text-gray-400 text-xs mb-1">Grad Norm</div>
            <div className="text-2xl font-bold text-yellow-400">{gradNorm.toFixed(2)}</div>
          </div>
        </div>

        {/* Memory */}
        <div className="col-span-4 bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <HardDrive className="w-4 h-4" /> VRAM Usage
            </span>
            <span className="text-xs text-gray-500">{totalTrainingMemory.toFixed(1)}GB / {VRAM_CAPACITY}GB</span>
          </div>
          <div className="h-3 bg-[#1a1a2e] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${isOverflow ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
              style={{ width: `${Math.min(100, (totalTrainingMemory / VRAM_CAPACITY) * 100)}%` }}
            />
          </div>
          {isOverflow && (
            <div className="mt-2 text-red-400 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Not enough VRAM!
            </div>
          )}
        </div>

        {/* Log */}
        <div className="col-span-4 bg-[#12121a] rounded-xl p-4 border border-[#1f1f3a]">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Training Log</span>
          </div>
          <div ref={scrollRef} className="h-32 overflow-y-auto space-y-1">
            {log.map((msg, i) => (
              <div key={i} className="text-xs text-gray-300 font-mono">
                {i === 0 ? '>' : ' '} {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
