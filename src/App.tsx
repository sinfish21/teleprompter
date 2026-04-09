/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Maximize2, 
  Minimize2, 
  Type, 
  Zap, 
  FlipHorizontal,
  ChevronLeft,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Segment {
  id: string;
  title: string;
  content: string;
}

interface PrompterSettings {
  fontSize: number;
  speed: number;
  fontFamily: 'sans' | 'serif' | 'mono';
  textColor: string;
  backgroundColor: string;
  isMirrored: boolean;
  lineHeight: number;
  maxWidth: number;
}

// --- Constants ---

const FONT_FAMILIES = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
};

const DEFAULT_SETTINGS: PrompterSettings = {
  fontSize: 64,
  speed: 5, // 1-10 scale
  fontFamily: 'sans',
  textColor: '#ffffff',
  backgroundColor: '#000000',
  isMirrored: false,
  lineHeight: 1.5,
  maxWidth: 80, // percentage
};

// --- Components ---

export default function App() {
  const [segments, setSegments] = useState<Segment[]>([
    { id: '1', title: '開場白', content: '歡迎使用專業網頁提詞機。' },
    { id: '2', title: '操作說明', content: '您可以點擊下方的「新增段落」來增加內容。' },
    { id: '3', title: '結語', content: '調整字體大小與速度，讓您的演講更加流暢。' }
  ]);
  const [settings, setSettings] = useState<PrompterSettings>(DEFAULT_SETTINGS);
  const [isPrompterActive, setIsPrompterActive] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  // --- Handlers ---

  const addSegment = () => {
    setSegments([...segments, { id: Math.random().toString(36).substr(2, 9), title: `段落 ${segments.length + 1}`, content: '' }]);
  };

  const removeSegment = (id: string) => {
    if (segments.length > 1) {
      setSegments(segments.filter(s => s.id !== id));
    }
  };

  const updateSegment = (id: string, field: 'title' | 'content', value: string) => {
    setSegments(segments.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleInputFocus = (id: string, field: 'title' | 'content', value: string) => {
    const defaultTitles = ['開場白', '操作說明', '結語'];
    const defaultContents = [
      '歡迎使用專業網頁提詞機。',
      '您可以點擊下方的「新增段落」來增加內容。',
      '調整字體大小與速度，讓您的演講更加流暢。'
    ];

    if (field === 'title') {
      if (defaultTitles.includes(value) || value.startsWith('段落 ')) {
        updateSegment(id, 'title', '');
      }
    } else {
      if (defaultContents.includes(value)) {
        updateSegment(id, 'content', '');
      }
    }
  };

  const moveSegment = (index: number, direction: 'up' | 'down') => {
    const newSegments = [...segments];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < segments.length) {
      [newSegments[index], newSegments[targetIndex]] = [newSegments[targetIndex], newSegments[index]];
      setSegments(newSegments);
    }
  };

  const startPrompter = () => {
    setIsPrompterActive(true);
    setCurrentSegmentIndex(0);
    setScrollPosition(0); 
    setIsPlaying(false);
    setShowControls(true);
  };

  const stopPrompter = () => {
    setIsPrompterActive(false);
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error enabling full-screen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // --- Animation Loop ---

  const animate = useCallback(() => {
    if (isPlaying && scrollRef.current) {
      setScrollPosition(prev => {
        const delta = settings.speed * 0.5;
        const next = prev + delta;
        
        // Bounds check
        if (next < 0) return 0;
        if (scrollRef.current && next > scrollRef.current.scrollHeight) return scrollRef.current.scrollHeight;
        
        return next;
      });
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying, settings.speed]);

  useEffect(() => {
    if (isPrompterActive) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPrompterActive, animate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPrompterActive) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowLeft') {
        setCurrentSegmentIndex(prev => Math.max(0, prev - 1));
        setScrollPosition(0);
        setIsPlaying(false);
      } else if (e.code === 'ArrowRight') {
        setCurrentSegmentIndex(prev => Math.min(segments.length - 1, prev + 1));
        setScrollPosition(0);
        setIsPlaying(false);
      } else if (e.code === 'ArrowUp') {
        setScrollPosition(prev => Math.max(0, prev - 50));
      } else if (e.code === 'ArrowDown') {
        setScrollPosition(prev => prev + 50);
      } else if (e.code === 'Escape') {
        stopPrompter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrompterActive, segments.length]);

  // --- Render Helpers ---

  if (isPrompterActive) {
    return (
      <div 
        className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
        style={{ backgroundColor: settings.backgroundColor }}
        onClick={() => setShowControls(!showControls)}
      >
        {/* Top Control Bar */}
        <div 
          className={`absolute top-0 left-0 right-0 p-4 flex items-start justify-between bg-black/60 backdrop-blur-md z-20 transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2 items-start">
            <button 
              onClick={stopPrompter}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors"
              title="退出"
            >
              <ChevronLeft size={20} />
              <span className="font-semibold">退出</span>
            </button>
            <div className="text-white/70 text-xs font-mono bg-white/5 px-2 py-1 rounded-lg border border-white/10 flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="opacity-50 text-[10px] uppercase tracking-wider">Progress</span>
                <span>{currentSegmentIndex + 1} / {segments.length}</span>
              </div>
              {segments[currentSegmentIndex]?.title && (
                <div className="text-blue-400 font-sans font-medium truncate max-w-[120px]">
                  {segments[currentSegmentIndex].title}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
              <Zap size={20} className="text-yellow-400 shrink-0" />
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={settings.speed} 
                onChange={(e) => setSettings({ ...settings, speed: parseInt(e.target.value) })}
                className="w-28 md:w-32 accent-yellow-400 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white font-mono text-sm w-4">{settings.speed}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
              <Type size={20} className="text-blue-400 shrink-0" />
              <input 
                type="range" 
                min="24" 
                max="120" 
                value={settings.fontSize} 
                onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                className="w-28 md:w-32 accent-blue-400 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white font-mono text-sm w-10">{settings.fontSize}px</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
              <ChevronUp size={20} className="text-green-400 shrink-0" />
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.1"
                value={settings.lineHeight} 
                onChange={(e) => setSettings({ ...settings, lineHeight: parseFloat(e.target.value) })}
                className="w-28 md:w-32 accent-green-400 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white font-mono text-sm w-8">{settings.lineHeight}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
              <Maximize2 size={20} className="text-purple-400 shrink-0" />
              <input 
                type="range" 
                min="30" 
                max="100" 
                value={settings.maxWidth} 
                onChange={(e) => setSettings({ ...settings, maxWidth: parseInt(e.target.value) })}
                className="w-28 md:w-32 accent-purple-400 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white font-mono text-sm w-10">{settings.maxWidth}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all"
              title={isFullscreen ? "退出全螢幕" : "全螢幕"}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
             <button 
              onClick={() => setSettings(s => ({ ...s, isMirrored: !s.isMirrored }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${settings.isMirrored ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
              title="鏡像模式"
            >
              <FlipHorizontal size={20} />
              <span className="text-sm font-medium">鏡像</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div 
          ref={scrollRef}
          className={`flex-1 overflow-y-auto scrollbar-hide py-[30vh] transition-all duration-300 ${settings.isMirrored ? '-scale-x-100' : ''}`}
          style={{ 
            color: settings.textColor,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            fontFamily: settings.fontFamily === 'sans' ? 'Inter, sans-serif' : settings.fontFamily === 'serif' ? 'Georgia, serif' : 'monospace',
            paddingLeft: `${(100 - settings.maxWidth) / 2}%`,
            paddingRight: `${(100 - settings.maxWidth) / 2}%`,
          }}
        >
          <div className="max-w-full mx-auto whitespace-pre-wrap text-center">
            {segments[currentSegmentIndex]?.content || ''}
            <div className="h-[80vh]" />
          </div>
        </div>

        {/* Bottom Navigation */}
        <div 
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/70 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white/10 shadow-2xl transition-all duration-500 z-20 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => {
              setCurrentSegmentIndex(prev => Math.max(0, prev - 1));
              setScrollPosition(0);
              setIsPlaying(false);
            }}
            disabled={currentSegmentIndex === 0}
            className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all active:scale-90"
            title="上一個段落"
          >
            <ChevronLeft size={32} />
          </button>

          <div className="w-px h-10 bg-white/10 mx-2" />

          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
            title={isPlaying ? "暫停" : "播放"}
          >
            {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
          </button>

          <button 
            onClick={() => setScrollPosition(0)}
            className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
            title="重置捲動"
          >
            <RotateCcw size={28} />
          </button>

          <div className="w-px h-10 bg-white/10 mx-2" />

          <button 
            onClick={() => {
              setCurrentSegmentIndex(prev => Math.min(segments.length - 1, prev + 1));
              setScrollPosition(0);
              setIsPlaying(false);
            }}
            disabled={currentSegmentIndex === segments.length - 1}
            className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all active:scale-90"
            title="下一個段落"
          >
            <ChevronRight size={32} />
          </button>
        </div>

        {/* Center Guide Line */}
        <div className={`absolute top-1/2 left-0 right-0 h-px bg-red-500/40 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-20'}`} />
        <div className={`absolute top-1/2 left-0 w-6 h-6 -translate-y-1/2 border-t-[12px] border-b-[12px] border-l-[12px] border-t-transparent border-b-transparent border-l-red-500/60 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-20'}`} />
        <div className={`absolute top-1/2 right-0 w-6 h-6 -translate-y-1/2 border-t-[12px] border-b-[12px] border-r-[12px] border-t-transparent border-b-transparent border-r-red-500/60 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-20'}`} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-gray-100 font-sans selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
              <Monitor className="text-blue-500" />
              提詞機
            </h1>
          </div>
          <button 
            onClick={startPrompter}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <Play size={20} fill="currentColor" />
            開始提詞
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Segments */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                內容段落
                <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                  {segments.length} 段
                </span>
              </h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    const text = segments.map(s => s.content).join('\n\n');
                    navigator.clipboard.writeText(text);
                  }}
                  className="text-sm flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                  複製全文
                </button>
                <button 
                  onClick={() => {
                    if (confirm('確定要清除所有段落嗎？')) {
                      setSegments([{ id: '1', content: '' }]);
                    }
                  }}
                  className="text-sm flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  清除全部
                </button>
                <button 
                  onClick={addSegment}
                  className="text-sm flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus size={16} />
                  新增段落
                </button>
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {segments.map((segment, index) => (
                <motion.div 
                  key={segment.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-[#1A1D23] rounded-2xl border border-gray-800 p-4 transition-all hover:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-xs font-mono text-gray-400">
                        {index + 1}
                      </span>
                      <input 
                        type="text"
                        value={segment.title}
                        onChange={(e) => updateSegment(segment.id, 'title', e.target.value)}
                        onFocus={(e) => handleInputFocus(segment.id, 'title', e.target.value)}
                        placeholder="段落小標題..."
                        className="bg-transparent border-none focus:ring-0 text-blue-400 font-medium text-sm p-0 placeholder:text-gray-600 w-full"
                      />
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => moveSegment(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-white disabled:opacity-0 transition-colors"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button 
                          onClick={() => moveSegment(index, 'down')}
                          disabled={index === segments.length - 1}
                          className="p-1 text-gray-500 hover:text-white disabled:opacity-0 transition-colors"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeSegment(segment.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <textarea 
                    value={segment.content}
                    onChange={(e) => updateSegment(segment.id, 'content', e.target.value)}
                    onFocus={(e) => handleInputFocus(segment.id, 'content', e.target.value)}
                    placeholder="在此輸入提詞內容..."
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-200 placeholder:text-gray-600 resize-none min-h-[120px] text-lg leading-relaxed"
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <button 
              onClick={addSegment}
              className="w-full py-8 border-2 border-dashed border-gray-800 rounded-2xl text-gray-500 hover:text-gray-300 hover:border-gray-700 hover:bg-gray-800/20 transition-all flex flex-col items-center gap-2"
            >
              <Plus size={24} />
              <span>點擊新增更多段落</span>
            </button>
          </div>

          {/* Sidebar: Settings */}
          <div className="space-y-8">
            <div className="bg-[#1A1D23] rounded-3xl border border-gray-800 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Settings size={20} className="text-gray-400" />
                顯示設定
              </h2>

              <div className="space-y-6">
                {/* Font Family */}
                <div className="space-y-3">
                  <label className="text-sm text-gray-400">字體樣式</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['sans', 'serif', 'mono'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setSettings({ ...settings, fontFamily: f })}
                        className={`py-2 rounded-xl text-sm capitalize transition-all border ${
                          settings.fontFamily === f 
                            ? 'bg-blue-600 border-blue-500 text-white' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-sm text-gray-400">文字顏色</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={settings.textColor}
                        onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                        className="w-full h-10 rounded-lg bg-gray-800 border-none cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm text-gray-400">背景顏色</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={settings.backgroundColor}
                        onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                        className="w-full h-10 rounded-lg bg-gray-800 border-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Mirror Mode & Fullscreen removed from here as they are in prompter view */}
              </div>
            </div>

            {/* Tips */}
            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
              <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                <Zap size={16} />
                快速鍵提示
              </h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex justify-between"><span>空白鍵</span> <span className="text-gray-500">播放 / 暫停</span></li>
                <li className="flex justify-between"><span>左右方向鍵</span> <span className="text-gray-500">切換段落</span></li>
                <li className="flex justify-between"><span>上下方向鍵</span> <span className="text-gray-500">微調捲動</span></li>
                <li className="flex justify-between"><span>ESC</span> <span className="text-gray-500">退出提詞</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-gray-800 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <span>Created by</span>
          <span className="text-blue-400 font-bold tracking-wider">sinfish</span>
        </div>
        <p className="text-gray-600 text-xs">© 2026 Professional Web Teleprompter</p>
      </footer>
    </div>
  );
}
