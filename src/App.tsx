/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { 
  Play, 
  Square, 
  Clock, 
  Bell, 
  Coffee, 
  Maximize2, 
  RotateCcw,
  AlertTriangle,
  Pause,
  Sun,
  Moon,
  TrendingUp,
  History,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

type TimerStatus = 'stopped' | 'running' | 'paused' | 'buffer';

export default function App() {
  // --- Settings State ---
  const savedSettings = (() => {
    try {
      const saved = localStorage.getItem('timer_last_settings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })();

  const [totalHours, setTotalHours] = useState(savedSettings.totalHours ?? 1);
  const [totalMinutes, setTotalMinutes] = useState(savedSettings.totalMinutes ?? 0);
  const [totalSeconds, setTotalSeconds] = useState(savedSettings.totalSeconds ?? 0);

  const [intervalMinutes, setIntervalMinutes] = useState(savedSettings.intervalMinutes ?? 15);
  const [intervalSeconds, setIntervalSeconds] = useState(savedSettings.intervalSeconds ?? 0);

  const [bufferMinutes, setBufferMinutes] = useState(savedSettings.bufferMinutes ?? 1);
  const [bufferSeconds, setBufferSeconds] = useState(savedSettings.bufferSeconds ?? 0);

  // --- Theme State ---
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('timer_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('timer_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  // --- Sound Settings ---
  const [soundEnabled, setSoundEnabled] = useState(savedSettings.soundEnabled ?? true);
  const [soundVolume, setSoundVolume] = useState(savedSettings.soundVolume ?? 50); // 0-100
  const [intervalTone, setIntervalTone] = useState<'mellow' | 'clear' | 'sharp'>(savedSettings.intervalTone ?? 'clear');
  const [finishTone, setFinishTone] = useState<'mellow' | 'clear' | 'sharp'>(savedSettings.finishTone ?? 'sharp');

  useEffect(() => {
    const settings = {
      totalHours, totalMinutes, totalSeconds,
      intervalMinutes, intervalSeconds,
      bufferMinutes, bufferSeconds,
      soundEnabled, soundVolume, intervalTone, finishTone
    };
    localStorage.setItem('timer_last_settings', JSON.stringify(settings));
  }, [totalHours, totalMinutes, totalSeconds, intervalMinutes, intervalSeconds, bufferMinutes, bufferSeconds, soundEnabled, soundVolume, intervalTone, finishTone]);

  // --- Presets State ---
  interface Preset {
    name: string;
    total: { h: number; m: number; s: number };
    interval: { m: number; s: number };
    buffer: { m: number; s: number };
  }

  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('timer_presets');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Preset Editor State ---
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [editorName, setEditorName] = useState('');
  const [editorTotal, setEditorTotal] = useState({ h: 1, m: 0, s: 0 });
  const [editorInterval, setEditorInterval] = useState({ m: 15, s: 0 });
  const [editorBuffer, setEditorBuffer] = useState({ m: 1, s: 0 });

  // --- Statistics State ---
  interface SessionRecord {
    id: string;
    timestamp: string;
    duration: number;
    name: string;
  }

  const [history, setHistory] = useState<SessionRecord[]>(() => {
    const saved = localStorage.getItem('timer_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    localStorage.setItem('timer_history', JSON.stringify(history));
  }, [history]);

  const recordSession = (duration: number) => {
    if (duration < 10) return; // Don't record very short sessions
    const activePreset = presets.find(p => 
      p.total.h === totalHours && 
      p.total.m === totalMinutes && 
      p.total.s === totalSeconds
    );
    
    const newRecord: SessionRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      duration,
      name: activePreset?.name || 'Custom Session'
    };
    setHistory(prev => [newRecord, ...prev].slice(0, 100)); // Keep last 100
  };

  const clearHistory = () => {
    if (confirm('Clear all session history?')) {
      setHistory([]);
    }
  };

  useEffect(() => {
    localStorage.setItem('timer_presets', JSON.stringify(presets));
  }, [presets]);

  const applyPreset = (p: Preset) => {
    setTotalHours(p.total.h);
    setTotalMinutes(p.total.m);
    setTotalSeconds(p.total.s);
    setIntervalMinutes(p.interval.m);
    setIntervalSeconds(p.interval.s);
    setBufferMinutes(p.buffer.m);
    setBufferSeconds(p.buffer.s);
  };

  const savePreset = () => {
    if (!editorName.trim()) return;
    const newPreset: Preset = {
      name: editorName.trim(),
      total: { ...editorTotal },
      interval: { ...editorInterval },
      buffer: { ...editorBuffer },
    };

    if (editingPreset) {
      setPresets(presets.map(p => p.name === editingPreset.name ? newPreset : p));
    } else {
      setPresets([...presets, newPreset]);
    }
    resetEditor();
  };

  const resetEditor = () => {
    setEditingPreset(null);
    setEditorName('');
    setEditorTotal({ h: 1, m: 0, s: 0 });
    setEditorInterval({ m: 15, s: 0 });
    setEditorBuffer({ m: 1, s: 0 });
  };

  const startEdit = (p: Preset) => {
    setEditingPreset(p);
    setEditorName(p.name);
    setEditorTotal(p.total);
    setEditorInterval(p.interval);
    setEditorBuffer(p.buffer);
  };

  const deletePreset = (name: string) => {
    setPresets(presets.filter(p => p.name !== name));
  };

  // --- Runtime State ---
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [currentIntervalLeft, setCurrentIntervalLeft] = useState(0);
  const [status, setStatus] = useState<TimerStatus>('stopped');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const wakeLockRef = useRef<any>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const nextIntervalTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // --- Wake Lock Management ---
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err: any) {
        console.warn(`Wake Lock error: ${err.message}`);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (status === 'running' || status === 'buffer')) {
        // Sync timer immediately on return
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [status]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const getTotalInitialSeconds = useCallback(() => {
    return (totalHours * 3600) + (totalMinutes * 60) + totalSeconds;
  }, [totalHours, totalMinutes, totalSeconds]);

  const getIntervalDuration = useCallback(() => {
    return (intervalMinutes * 60) + intervalSeconds;
  }, [intervalMinutes, intervalSeconds]);

  const getBufferDuration = useCallback(() => {
    return (bufferMinutes * 60) + bufferSeconds;
  }, [bufferMinutes, bufferSeconds]);

  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Controls ---
  const handleStart = () => {
    if (status === 'stopped') {
      const initial = getTotalInitialSeconds();
      const interval = getIntervalDuration();
      
      if (initial <= 0) return;
      
      const now = Date.now();
      targetEndTimeRef.current = now + (initial * 1000);
      nextIntervalTimeRef.current = now + ((interval > 0 ? interval : initial) * 1000);

      setTimeLeft(initial);
      setSessionProgress(1);
      setCurrentIntervalLeft(interval > 0 ? interval : initial);
      setStatus('running');
      requestWakeLock();
    } else if (status === 'paused') {
      const now = Date.now();
      targetEndTimeRef.current = now + (timeLeft * 1000);
      nextIntervalTimeRef.current = now + (currentIntervalLeft * 1000);
      setStatus('running');
      requestWakeLock();
    }
  };

  const resetTimer = useCallback(() => {
    setStatus('stopped');
    if (timerRef.current) clearInterval(timerRef.current);
    targetEndTimeRef.current = null;
    nextIntervalTimeRef.current = null;
    setTimeLeft(0);
    setSessionProgress(0);
    setCurrentIntervalLeft(0);
    releaseWakeLock();
    setShowStopConfirmation(false);
  }, []);

  const handleStop = useCallback(() => {
    if (status === 'stopped') {
      resetTimer();
    } else {
      setShowStopConfirmation(true);
    }
  }, [status, resetTimer]);

  const handlePause = () => {
    if (status === 'running' || status === 'buffer') {
      setStatus('paused');
      releaseWakeLock();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const playPattern = (pattern: 'finish' | 'interval' | 'resume') => {
    if (!soundEnabled) return;

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const vol = soundVolume / 100;

      const playNote = (freq: number, start: number, duration: number, patternType: 'finish' | 'interval' | 'resume') => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // Apply tone character based on pattern
        let actualFreq = freq;
        let actualType: OscillatorType = 'sine';
        const toneSetting = patternType === 'finish' ? finishTone : intervalTone;

        if (toneSetting === 'mellow') {
          actualType = 'sine';
          actualFreq = freq * 0.8;
        } else if (toneSetting === 'sharp') {
          actualType = 'triangle';
          actualFreq = freq * 1.2;
        } else {
          actualType = 'sine';
        }

        oscillator.type = actualType;
        oscillator.frequency.setValueAtTime(actualFreq, audioCtx.currentTime + start);
        
        gainNode.gain.setValueAtTime(vol * 0.2, audioCtx.currentTime + start);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start(audioCtx.currentTime + start);
        oscillator.stop(audioCtx.currentTime + start + duration);
      };

      if (pattern === 'finish') {
        // Triumphant finish melody
        playNote(440, 0, 0.3, 'finish');     // A4
        playNote(554.37, 0.15, 0.3, 'finish'); // C#5
        playNote(659.25, 0.3, 0.8, 'finish');  // E5
      } else if (pattern === 'interval') {
        // Clear interval chime
        playNote(523.25, 0, 0.2, 'interval');    // C5
        playNote(392.00, 0.2, 0.4, 'interval');  // G4
      } else if (pattern === 'resume') {
        // Short focus alert
        playNote(880, 0, 0.1, 'interval');       // A5
      }
    } catch (e) {
      console.warn("Audio system error", e);
    }
  };

  // --- Timer Loop ---
  const tick = useCallback(() => {
    if (!targetEndTimeRef.current || !nextIntervalTimeRef.current) return;

    const now = Date.now();
    const totalRemainingRaw = Math.max(0, (targetEndTimeRef.current - now) / 1000);
    const totalRemaining = Math.ceil(totalRemainingRaw);
    const intervalRemainingRaw = Math.max(0, (nextIntervalTimeRef.current - now) / 1000);
    const intervalRemaining = Math.ceil(intervalRemainingRaw);

    // Update session progress for smooth animation
    const totalInitial = getTotalInitialSeconds();
    if (totalInitial > 0) {
      setSessionProgress(totalRemainingRaw / totalInitial);
    }

    // Update session time
    if (status === 'running') {
      if (totalRemainingRaw <= 0) {
        playPattern('finish');
        recordSession(getTotalInitialSeconds());
        resetTimer();
        return;
      }
      setTimeLeft(totalRemaining);

      // Handle Interval/Buffer transitions
      if (intervalRemainingRaw <= 0) {
        const buffer = getBufferDuration();
        playPattern('interval');
        if (buffer > 0) {
          setStatus('buffer');
          nextIntervalTimeRef.current = now + (buffer * 1000);
          setCurrentIntervalLeft(buffer);
        } else {
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 500);
          const interval = getIntervalDuration() || totalRemainingRaw;
          nextIntervalTimeRef.current = now + (interval * 1000);
          setCurrentIntervalLeft(Math.ceil(interval));
        }
      } else {
        setCurrentIntervalLeft(intervalRemaining);
      }
    } else if (status === 'buffer') {
      if (intervalRemainingRaw <= 0) {
        playPattern('resume');
        setStatus('running');
        const interval = getIntervalDuration() || totalRemainingRaw;
        nextIntervalTimeRef.current = now + (interval * 1000);
        setCurrentIntervalLeft(Math.ceil(interval));
      } else {
        setCurrentIntervalLeft(intervalRemaining);
      }
    }
  }, [status, getBufferDuration, getIntervalDuration, resetTimer, getTotalInitialSeconds]);

  useEffect(() => {
    if (status === 'running' || status === 'buffer') {
      // Fast interval for smooth UI (approx 60fps logic update would be 16ms, but 50ms is plenty for smooth SVG)
      timerRef.current = setInterval(tick, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, tick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (status === 'running' || status === 'buffer') {
            handlePause();
          } else {
            handleStart();
          }
          break;
        case 'KeyS':
          if (status !== 'running' && status !== 'buffer') {
            handleStart();
          }
          break;
        case 'KeyP':
          if (status === 'running' || status === 'buffer') {
            handlePause();
          }
          break;
        case 'Escape':
          handleStop();
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleStart, handlePause, handleStop, toggleFullscreen]);

  return (
    <div className={`min-h-screen p-2 md:p-8 flex items-center justify-center transition-colors duration-1000 ${darkMode ? 'bg-[#222c31]' : 'bg-[#FDFCF8]'}`} 
         ref={containerRef}
         style={{ backgroundColor: showFlash ? (darkMode ? '#3a4a51' : '#f1f1e6') : undefined }}>
      
      {/* Stop Confirmation Modal */}
      <AnimatePresence>
        {showStopConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowStopConfirmation(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-sm p-8 rounded-[32px] shadow-2xl transition-colors duration-500 ${darkMode ? 'bg-[#2a363d] text-[#cad2c5]' : 'bg-white text-[#354F52]'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? 'bg-red-400/10 text-red-400' : 'bg-red-50 text-red-500'}`}>
                  <AlertTriangle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold uppercase tracking-tight">End Session?</h3>
                  <p className="text-xs opacity-60 font-medium">Your current focus progress will be lost. Are you sure you want to stop now?</p>
                </div>
                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={resetTimer}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                  >
                    Yes, End Session
                  </button>
                  <button 
                    onClick={() => setShowStopConfirmation(false)}
                    className={`w-full py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-colors ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    Keep Focusing
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isFullscreen ? (
          <motion.div 
            key="fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 md:p-12 transition-colors duration-700 ${darkMode ? 'bg-[#000000] text-white' : 'bg-white text-black'}`}
          >
            <button 
              onClick={toggleFullscreen}
              className="absolute top-6 right-6 md:top-8 md:right-8 p-3 rounded-full hover:bg-gray-500/10 transition-colors opacity-40 hover:opacity-100"
            >
              <Maximize2 size={24} />
            </button>

            <div className="w-full text-center px-4">
              <span className={`block text-[10px] md:text-[14px] uppercase tracking-[0.4em] font-bold mb-4 md:mb-8 opacity-40 ${status === 'buffer' ? 'text-[#D4A373]' : ''}`}>
                {status === 'buffer' ? 'Intermission' : 'Remaining Time'}
              </span>

              <motion.h1 
                key={timeLeft}
                className="text-[18vw] md:text-[20rem] font-light tracking-tighter leading-none font-sans"
              >
                {status === 'stopped' ? formatTime(getTotalInitialSeconds()) : formatTime(timeLeft)}
              </motion.h1>

              <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 md:h-3 md:w-3 rounded-full ${status === 'running' ? 'bg-[#8B9A82] animate-pulse' : status === 'buffer' ? 'bg-[#D4A373] animate-pulse' : 'bg-gray-400'}`} />
                  <p className="text-[10px] md:text-[12px] uppercase tracking-widest font-bold opacity-60">
                    {status === 'buffer' ? `Rest: ${formatTime(currentIntervalLeft)}` : status}
                  </p>
                </div>
                
                <div className="flex gap-4">
                   {status === 'running' || status === 'buffer' ? (
                     <button onClick={handlePause} className="p-3 md:p-4 rounded-full border border-current hover:bg-current hover:text-inherit transition-all"><Pause size={20} md:size={24} /></button>
                   ) : (
                     <button onClick={handleStart} className="p-3 md:p-4 rounded-full border border-current hover:bg-current hover:text-inherit transition-all"><Play size={20} md:size={24} fill="currentColor" /></button>
                   )}
                   <button onClick={handleStop} className="p-3 md:p-4 rounded-full border border-current hover:bg-current hover:text-inherit transition-all"><Square size={20} md:size={24} fill="currentColor" /></button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`w-full max-w-lg border rounded-[30px] md:rounded-[40px] shadow-2xl overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-[#2a363d] border-[#354F52] shadow-black/20' : 'bg-white/80 backdrop-blur-md border-[#E9EED9] shadow-[#354f520a]'}`}
          >
        {/* Main Display */}
        <div className="p-8 md:p-12 pb-6 md:pb-8 text-center relative flex flex-col items-center justify-center min-h-[280px] md:min-h-[320px]">
          {/* Progress Ring Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg className="w-56 h-56 md:w-80 md:h-80 -rotate-90">
              <circle 
                cx="50%" cy="50%" r="48%" 
                fill="none" 
                stroke={darkMode ? "#cad2c5" : "#8B9A82"} 
                strokeWidth="2" 
              />
            </svg>
          </div>

          {/* Active Progress Ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-56 h-56 md:w-80 md:h-80 -rotate-90 overflow-visible">
              <motion.circle 
                cx="50%" cy="50%" r="48%" 
                fill="none" 
                stroke={status === 'buffer' ? '#D4A373' : (darkMode ? '#cad2c5' : '#8B9A82')} 
                strokeWidth="6" 
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ 
                  pathLength: status === 'stopped' ? 0 : sessionProgress
                }}
                transition={{ duration: 0.05, ease: "linear" }}
                style={{ 
                  filter: darkMode ? "none" : `drop-shadow(0px 0px 8px ${status === 'buffer' ? 'rgba(212, 163, 115, 0.4)' : 'rgba(139, 154, 130, 0.4)'})`
                }}
              />
            </svg>
          </div>

          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3 z-20">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-1 text-[#8B9A82] hover:text-[#354F52] dark:hover:text-[#cad2c5] transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-1 text-[#8B9A82] hover:text-[#354F52] dark:hover:text-[#cad2c5] transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          <div className="relative z-10">
            <span className="block text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-[#8B9A82] font-bold mb-3 md:mb-4">
              {status === 'buffer' ? 'Intermission' : 'Remaining Time'}
            </span>

            <motion.h1 
              key={timeLeft}
              initial={status === 'running' ? { scale: 1.01, opacity: 0.95 } : {}}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-5xl md:text-7xl font-light tracking-tighter mb-3 md:mb-4 font-sans ${status === 'buffer' ? 'text-[#D4A373]' : (darkMode ? 'text-[#cad2c5]' : 'text-[#354F52]')}`}
            >
              {status === 'stopped' ? formatTime(getTotalInitialSeconds()) : formatTime(timeLeft)}
            </motion.h1>
            
            <div className="flex items-center justify-center gap-3">
              <span className={`h-1.5 w-1.5 rounded-full ${status === 'running' ? (darkMode ? 'bg-[#cad2c5]' : 'bg-[#8B9A82]') + ' animate-pulse' : status === 'buffer' ? 'bg-[#D4A373] animate-pulse' : (darkMode ? 'bg-[#354F52]' : 'bg-[#E9EED9]')}`} />
              <p className={`text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-70 ${darkMode ? 'text-[#cad2c5]' : 'text-[#5A5A40]'}`}>
                {status === 'buffer' ? `Rest: ${formatTime(currentIntervalLeft)}` : status} session
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 pb-8 space-y-4 md:space-y-5">
          {/* Preset Manager Section */}
          <Section 
            title="Preset Manager" 
            icon={<RotateCcw size={14} className="text-[#8B9A82]" />}
            disabled={status !== 'stopped'}
          >
            <div className="space-y-4">
              {/* Editor Form */}
              <div className={`border p-3 md:p-4 rounded-xl md:rounded-2xl space-y-3 shadow-inner transition-colors duration-500 ${darkMode ? 'bg-[#222c31] border-[#313d44]' : 'bg-[#fcfcf7] border-[#E9EED9]'}`}>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Preset Name..."
                    value={editorName}
                    onChange={(e) => setEditorName(e.target.value)}
                    className={`flex-1 border rounded-lg md:rounded-xl py-2 px-3 text-[10px] font-bold uppercase focus:ring-1 focus:ring-[#8B9A82] transition-all ${darkMode ? 'bg-[#2a363d] border-[#354F52] text-[#cad2c5]' : 'bg-white border-[#E9EED9] text-[#354F52]'}`}
                  />
                  {editingPreset && (
                    <button onClick={resetEditor} className={`px-2 md:px-3 text-[9px] font-bold uppercase transition-colors ${darkMode ? 'text-[#8B9A82] hover:text-[#cad2c5]' : 'text-[#5A5A40] hover:text-[#354F52]'}`}>Cancel</button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1 md:gap-2">
                   <div className="space-y-1">
                      <span className="text-[7px] md:text-[8px] text-[#8B9A82] font-bold uppercase pl-1">Total Time</span>
                      <div className="flex gap-1">
                         <input type="number" placeholder="H" value={editorTotal.h} onChange={(e) => setEditorTotal({...editorTotal, h: Math.max(0, parseInt(e.target.value) || 0)})} className={`w-full border rounded-md md:rounded-lg py-1 px-1 text-[9px] md:text-[10px] text-center transition-colors ${darkMode ? 'bg-[#2a363d] border-[#354F52] text-[#cad2c5]' : 'bg-white border-[#E9EED9]'}`} />
                         <input type="number" placeholder="M" value={editorTotal.m} onChange={(e) => setEditorTotal({...editorTotal, m: Math.max(0, parseInt(e.target.value) || 0)})} className={`w-full border rounded-md md:rounded-lg py-1 px-1 text-[9px] md:text-[10px] text-center transition-colors ${darkMode ? 'bg-[#2a363d] border-[#354F52] text-[#cad2c5]' : 'bg-white border-[#E9EED9]'}`} />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[7px] md:text-[8px] text-[#8B9A82] font-bold uppercase pl-1">Interval</span>
                      <div className="flex gap-1">
                         <input type="number" placeholder="M" value={editorInterval.m} onChange={(e) => setEditorInterval({...editorInterval, m: Math.max(0, parseInt(e.target.value) || 0)})} className={`w-full border rounded-md md:rounded-lg py-1 px-1 text-[9px] md:text-[10px] text-center transition-colors ${darkMode ? 'bg-[#2a363d] border-[#354F52] text-[#cad2c5]' : 'bg-white border-[#E9EED9]'}`} />
                         <input type="number" placeholder="S" value={editorInterval.s} onChange={(e) => setEditorInterval({...editorInterval, s: Math.max(0, parseInt(e.target.value) || 0)})} className={`w-full border rounded-md md:rounded-lg py-1 px-1 text-[9px] md:text-[10px] text-center transition-colors ${darkMode ? 'bg-[#2a363d] border-[#354F52] text-[#cad2c5]' : 'bg-white border-[#E9EED9]'}`} />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[7px] md:text-[8px] text-[#D4A373] font-bold uppercase pl-1">Buffer</span>
                      <div className="flex gap-1">
                         <input type="number" placeholder="M" value={editorBuffer.m} onChange={(e) => setEditorBuffer({...editorBuffer, m: Math.max(0, parseInt(e.target.value) || 0)})} className={`w-full border rounded-md md:rounded-lg py-1 px-1 text-[9px] md:text-[10px] text-center transition-colors ${darkMode ? 'bg-[#2a363d] border-[#354F52] text-[#cad2c5]' : 'bg-white border-[#E9EED9]'}`} />
                         <input type="number" placeholder="S" value={editorBuffer.s} onChange={(e) => setEditorBuffer({...editorBuffer, s: Math.max(0, parseInt(e.target.value) || 0)})} className={`w-full border rounded-md md:rounded-lg py-1 px-1 text-[9px] md:text-[10px] text-center transition-colors ${darkMode ? 'bg-[#2a363d] border-[#354F52] text-[#cad2c5]' : 'bg-white border-[#E9EED9]'}`} />
                      </div>
                   </div>
                </div>

                <button 
                  onClick={savePreset}
                  disabled={!editorName.trim()}
                  className="w-full py-2 bg-[#8B9A82] text-white rounded-lg md:rounded-xl text-[10px] font-bold uppercase transition-all hover:bg-[#7a8b71] disabled:opacity-30 shadow-md shadow-[#8b9a8222]"
                >
                  {editingPreset ? 'Update Preset' : 'Add New Preset'}
                </button>
              </div>

              {/* Preset List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 thin-scrollbar">
                {presets.length === 0 && (
                  <p className={`col-span-full text-[9px] italic text-center py-4 rounded-xl ${darkMode ? 'text-[#8B9A82]/40 bg-black/10' : 'text-[#5A5A40]/40 bg-[#F5F5F0]/30'}`}>No custom presets yet.</p>
                )}
                {presets.map((p) => (
                  <div key={p.name} className={`group relative flex items-center rounded-xl transition-all ${darkMode ? 'bg-black/20 hover:bg-black/30' : 'bg-[#F5F5F0] hover:bg-[#E9EED9]'}`}>
                    <button
                      onClick={() => applyPreset(p)}
                      disabled={status !== 'stopped'}
                      className={`flex-1 py-3 px-4 text-[10px] font-bold uppercase text-left truncate pr-16 disabled:opacity-30 ${darkMode ? 'text-[#cad2c5]' : 'text-[#354F52]'}`}
                    >
                      {p.name}
                      <span className="block text-[8px] font-normal opacity-60 normal-case">{p.total.h}h {p.total.m}m | {p.interval.m}m alert</span>
                    </button>
                    <div className="absolute right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(p)}
                        className={`p-1.5 transition-colors ${darkMode ? 'text-[#8B9A82] hover:text-[#cad2c5]' : 'text-[#8B9A82] hover:text-[#5A5A40]'}`}
                      >
                        <RotateCcw size={10} />
                      </button>
                      <button 
                        onClick={() => deletePreset(p.name)}
                        className="text-red-400 hover:text-red-600 p-1.5"
                      >
                        <Square size={10} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Focus Statistics Section */}
          <Section 
            title="Focus Statistics" 
            icon={<TrendingUp size={14} className="text-[#8B9A82]" />}
            disabled={false}
          >
            <div className="space-y-4">
              <button 
                onClick={() => setShowStats(!showStats)}
                className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${showStats ? 'bg-[#8B9A82] text-white shadow-md' : (darkMode ? 'bg-black/20 text-[#8B9A82] hover:bg-black/30' : 'bg-[#F5F5F0] text-[#354F52] hover:bg-[#E9EED9]')}`}
              >
                <History size={14} />
                {showStats ? 'Hide Statistics' : 'View Focus Insights'}
              </button>

              <AnimatePresence>
                {showStats && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-6"
                  >
                    {history.length > 0 ? (
                      <>
                        {/* Stats Overview */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className={`p-3 rounded-xl text-center transition-colors ${darkMode ? 'bg-black/20' : 'bg-[#F5F5F0]'}`}>
                            <span className="block text-[8px] uppercase font-bold text-[#8B9A82] mb-1">Total Time</span>
                            <span className={`text-xs font-bold ${darkMode ? 'text-[#cad2c5]' : 'text-[#354F52]'}`}>
                              {Math.floor(history.reduce((acc, curr) => acc + curr.duration, 0) / 60)}m
                            </span>
                          </div>
                          <div className={`p-3 rounded-xl text-center transition-colors ${darkMode ? 'bg-black/20' : 'bg-[#F5F5F0]'}`}>
                            <span className="block text-[8px] uppercase font-bold text-[#8B9A82] mb-1">Sessions</span>
                            <span className={`text-xs font-bold ${darkMode ? 'text-[#cad2c5]' : 'text-[#354F52]'}`}>{history.length}</span>
                          </div>
                          <div className={`p-3 rounded-xl text-center transition-colors ${darkMode ? 'bg-black/20' : 'bg-[#F5F5F0]'}`}>
                            <span className="block text-[8px] uppercase font-bold text-[#8B9A82] mb-1">Avg. Split</span>
                            <span className={`text-xs font-bold ${darkMode ? 'text-[#cad2c5]' : 'text-[#354F52]'}`}>
                              {Math.round(history.reduce((acc, curr) => acc + curr.duration, 0) / history.length / 60)}m
                            </span>
                          </div>
                        </div>

                        {/* Chart */}
                        <div className={`h-48 w-full p-4 rounded-2xl transition-colors ${darkMode ? 'bg-black/20' : 'bg-[#F5F5F0]'}`}>
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={history.slice(0, 7).reverse().map(h => ({
                                name: new Date(h.timestamp).toLocaleDateString(undefined, { weekday: 'short' }),
                                minutes: Math.round(h.duration / 60)
                              }))}>
                                <XAxis 
                                  dataKey="name" 
                                  fontSize={8} 
                                  tickLine={false} 
                                  axisLine={false} 
                                  tick={{ fill: darkMode ? '#8B9A82' : '#5A5A40' }}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: darkMode ? '#2a363d' : '#fcfcf7',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                  }}
                                  itemStyle={{ color: '#8B9A82' }}
                                  cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                                  {history.slice(0, 7).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={darkMode ? '#8B9A82' : '#8B9A82'} />
                                  ))}
                                </Bar>
                              </BarChart>
                           </ResponsiveContainer>
                        </div>

                        <div className="flex justify-between items-center px-1">
                          <h3 className="text-[9px] font-bold uppercase tracking-wider text-[#8B9A82]">Recent Sessions</h3>
                          <button 
                            onClick={clearHistory}
                            className="text-[8px] uppercase font-bold text-red-400 hover:text-red-500 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={10} />
                            Clear
                          </button>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 thin-scrollbar">
                          {history.slice(0, 10).map((record) => (
                            <div key={record.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${darkMode ? 'bg-black/10' : 'bg-white/40'}`}>
                              <div className="flex flex-col">
                                <span className={`text-[10px] font-bold ${darkMode ? 'text-[#cad2c5]' : 'text-[#354F52]'}`}>{record.name}</span>
                                <span className="text-[8px] opacity-50 font-medium">
                                  {new Date(record.timestamp).toLocaleDateString()} at {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-[#8B9A82] bg-[#8B9A82]/10 px-2 py-0.5 rounded-full">
                                {Math.floor(record.duration / 60)}m
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className={`p-8 text-center rounded-2xl border-2 border-dashed transition-colors ${darkMode ? 'border-[#354F52] text-[#8B9A82]/40' : 'border-[#E9EED9] text-[#5A5A40]/40'}`}>
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Complete a session to see insights</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Section>

          {/* Settings Sections */}
          <Section 
            title="Total Duration" 
            icon={<Clock size={14} className="text-[#8B9A82]" />}
            disabled={status !== 'stopped'}
          >
            <div className="grid grid-cols-3 gap-4">
              <Input label="Hours" value={totalHours} onChange={setTotalHours} disabled={status !== 'stopped'} />
              <Input label="Minutes" value={totalMinutes} onChange={setTotalMinutes} disabled={status !== 'stopped'} />
              <Input label="Seconds" value={totalSeconds} onChange={setTotalSeconds} disabled={status !== 'stopped'} />
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Section 
              title="Intervals" 
              icon={<Bell size={14} className="text-[#8B9A82]" />}
              disabled={status !== 'stopped'}
            >
              <div className="grid grid-cols-2 gap-3">
                <Input label="Mins" value={intervalMinutes} onChange={setIntervalMinutes} disabled={status !== 'stopped'} />
                <Input label="Secs" value={intervalSeconds} onChange={setIntervalSeconds} disabled={status !== 'stopped'} />
              </div>
            </Section>

            <Section 
              title="Buffer" 
              icon={<Coffee size={14} className="text-[#D4A373]" />}
              disabled={status !== 'stopped'}
            >
              <div className="grid grid-cols-2 gap-3">
                <Input label="Mins" value={bufferMinutes} onChange={setBufferMinutes} disabled={status !== 'stopped'} />
                <Input label="Secs" value={bufferSeconds} onChange={setBufferSeconds} disabled={status !== 'stopped'} />
              </div>
            </Section>
          </div>

          <Section 
            title="Audio Alerts" 
            icon={soundEnabled ? <Bell size={14} className="text-[#8B9A82]" /> : <AlertTriangle size={14} className="text-red-400" />}
            disabled={status !== 'stopped'}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-[#8B9A82] font-bold uppercase tracking-wider">Alerts</label>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  disabled={status !== 'stopped'}
                  className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${soundEnabled ? 'bg-[#8B9A82] text-white shadow-sm' : (darkMode ? 'bg-black/20 text-[#8B9A82]' : 'bg-[#F5F5F0] text-[#5A5A40]')}`}
                >
                  {soundEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-[#8B9A82] font-bold uppercase tracking-wider">Vol: {soundVolume}%</label>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseInt(e.target.value))}
                  disabled={status !== 'stopped' || !soundEnabled}
                  className={`w-full accent-[#8B9A82] h-1 rounded-lg appearance-none cursor-pointer disabled:opacity-30 ${darkMode ? 'bg-black/20' : 'bg-[#F5F5F0]'}`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-[#8B9A82] font-bold uppercase tracking-wider">Interval Tone</label>
                <select 
                  value={intervalTone}
                  onChange={(e) => {
                    const val = (e.target.value as "mellow" | "clear" | "sharp");
                    setIntervalTone(val);
                    setTimeout(() => playPattern("interval"), 10);
                  }}
                  disabled={status !== 'stopped' || !soundEnabled}
                  className={`w-full border-none rounded-xl py-2 px-2 text-[10px] font-bold uppercase focus:ring-1 focus:ring-[#8B9A82] appearance-none text-center cursor-pointer disabled:opacity-30 ${darkMode ? 'bg-black/20 text-[#cad2c5]' : 'bg-[#F5F5F0] text-[#354F52]'}`}
                >
                  <option value="mellow">Mellow</option>
                  <option value="clear">Clear</option>
                  <option value="sharp">Sharp</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-[#D4A373] font-bold uppercase tracking-wider">Finish Tone</label>
                <select 
                  value={finishTone}
                  onChange={(e) => {
                    const val = (e.target.value as "mellow" | "clear" | "sharp");
                    setFinishTone(val);
                    setTimeout(() => playPattern("finish"), 10);
                  }}
                  disabled={status !== 'stopped' || !soundEnabled}
                  className={`w-full border-none rounded-xl py-2 px-2 text-[10px] font-bold uppercase focus:ring-1 focus:ring-[#D4A373] appearance-none text-center cursor-pointer disabled:opacity-30 ${darkMode ? 'bg-black/20 text-[#cad2c5]' : 'bg-[#F5F5F0] text-[#354F52]'}`}
                >
                  <option value="mellow">Mellow</option>
                  <option value="clear">Clear</option>
                  <option value="sharp">Sharp</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Controls */}
          <div className="flex gap-4 pt-6">
            {status === 'running' || status === 'buffer' ? (
              <button
                onClick={handlePause}
                className="flex-3 flex items-center justify-center gap-3 py-4 bg-[#D4A373] hover:bg-[#c19262] transition-all rounded-full font-bold text-white shadow-xl shadow-[#d4a37322] uppercase tracking-widest text-xs"
              >
                <Pause size={16} fill="currentColor" />
                Pause
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={status === 'running' || status === 'buffer'}
                className="flex-3 flex items-center justify-center gap-3 py-4 bg-[#8B9A82] hover:bg-[#7a8b71] disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-full font-bold text-white shadow-xl shadow-[#8b9a8222] uppercase tracking-widest text-xs"
              >
                <Play size={16} fill="currentColor" />
                {status === 'paused' ? 'Resume' : 'Begin Session'}
              </button>
            )}
            
            <button
              onClick={handleStop}
              className={`flex-1 flex items-center justify-center gap-3 py-4 border transition-all rounded-full font-bold shadow-sm uppercase tracking-widest text-xs ${darkMode ? 'bg-black/20 border-[#354F52] text-[#cad2c5] hover:bg-black/30' : 'bg-white border-[#E9EED9] text-[#354F52] hover:bg-[#FDFCF8]'}`}
            >
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Footer/Progress Indicator */}
        <div className={`px-6 md:px-10 py-4 md:py-6 border-t flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-500 ${darkMode ? 'border-[#354F52] bg-black/10' : 'border-[#E9EED9] bg-[#FDFCF8]/50'}`}>
            <div className="flex flex-col gap-1 w-full md:w-auto items-center md:items-start">
                <span className="text-[8px] md:text-[9px] uppercase font-bold text-[#8B9A82] tracking-[0.1em]">Overall Completion</span>
                <div className={`w-full md:w-32 h-1 rounded-full overflow-hidden ${darkMode ? 'bg-[#354F52]' : 'bg-[#E9EED9]'}`}>
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${status === 'stopped' ? 0 : Math.round(((getTotalInitialSeconds() - timeLeft) / getTotalInitialSeconds()) * 100)}%` }}
                        className="h-full bg-[#8B9A82]" 
                    />
                </div>
            </div>
            <button 
                onClick={handleStop}
                className="text-[8px] md:text-[9px] uppercase font-bold text-[#D4A373] tracking-[0.2em] hover:text-[#C16E4E] transition-colors"
            >
                End Early →
            </button>
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, subtitle, icon, children, disabled }: { title: string, subtitle?: string, icon: ReactNode, children: ReactNode, disabled: boolean }) {
  const isDark = document.documentElement.classList.contains('dark');
  return (
    <div className={`p-4 transition-opacity ${disabled ? 'opacity-40' : 'opacity-100'}`}>
      <div className="flex items-center gap-2 mb-4">
        <span>{icon}</span>
        <h2 className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${isDark ? 'text-[#cad2c5]' : 'text-[#354F52]'}`}>{title}</h2>
        {subtitle && <span className={`text-[9px] italic opacity-60 transition-colors ${isDark ? 'text-[#8B9A82]' : 'text-[#5A5A40]'}`}>{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, disabled }: { label: string, value: number, onChange: (v: number) => void, disabled: boolean }) {
  const isDark = document.documentElement.classList.contains('dark');
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[9px] text-[#8B9A82] font-bold uppercase tracking-wider">{label}</label>
      <input 
        type="number"
        value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        disabled={disabled}
        className={`w-full border-none rounded-xl py-2 px-3 text-sm font-medium transition-all cursor-pointer disabled:cursor-not-allowed text-center focus:ring-1 focus:ring-[#8B9A82] ${isDark ? 'bg-black/20 text-[#cad2c5]' : 'bg-[#F5F5F0] text-[#354F52]'}`}
      />
    </div>
  );
}
