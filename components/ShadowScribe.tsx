import React, { useState, useEffect } from 'react';
import { generateText } from '../services/geminiService';
import { TerminalOutput } from './TerminalOutput';
import { LoadingSpinner } from './LoadingSpinner';

interface HistoryItem {
  id: string;
  timestamp: string; // ISO string
  prompt: string;
  response: string;
  format: 'plain' | 'markdown';
}

const STORAGE_KEY = 'shadow_scribe_history';
const DRAFT_STORAGE_KEY = 'shadow_scribe_draft';

export const ShadowScribe: React.FC = () => {
  const [prompt, setPrompt] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      return saved ? JSON.parse(saved).prompt || '' : '';
    } catch (e) {
      return '';
    }
  });

  const [format, setFormat] = useState<'plain' | 'markdown'>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      return saved ? JSON.parse(saved).format || 'plain' : 'plain';
    } catch (e) {
      return 'plain';
    }
  });

  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse shadow scribe history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  // Save draft to localStorage whenever prompt or format changes
  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ prompt, format }));
  }, [prompt, format]);

  const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = async () => {
    if (!prompt || isLoading) return;
    setIsLoading(true);
    setResponse('');
    
    const currentPrompt = prompt;
    const currentFormat = format;

    const result = await generateText(currentPrompt, currentFormat);
    setResponse(result);
    
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      prompt: currentPrompt,
      response: result,
      format: currentFormat
    };

    setHistory(prev => [newItem, ...prev]);
    setIsLoading(false);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setFormat(item.format);
    setResponse(item.response);
    // Optionally scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to purge all archives? This action cannot be undone.")) {
      setHistory([]);
    }
  };

  return (
    <div>
      <h2 className="text-2xl text-purple-400 mb-4 tracking-widest">Protocol: Shadow Scribe</h2>
      <p className="mb-4 text-cyan-500">Weave words from the void. Enter your incantation below.</p>
      
      <div className="mb-6 p-4 bg-gray-900/40 border border-cyan-900 rounded-md text-cyan-500 text-sm">
        <h4 className="text-purple-400 font-bold mb-2">OPERATIONAL DIRECTIVE:</h4>
        <p>Shadow Scribe is a linguistic infiltration tool. It generates text for reports, simulates communication styles, or crafts complex narratives. It now maintains an active neural link to the global network, allowing it to retrieve lyrics, news, and live data from the surface web.</p>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-end">
            <span className="text-cyan-700 text-xs tracking-widest">INPUT STREAM //</span>
            <span className={`text-xs font-mono transition-colors ${wordCount > 0 ? 'text-cyan-400' : 'text-gray-600'}`}>
                WORD_COUNT: {wordCount}
            </span>
        </div>

        <textarea
          className="w-full h-32 p-3 bg-gray-900 border-2 border-cyan-800 rounded-md text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition scrollbar-thin-cyan"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Incantation here... e.g., 'Retrieve lyrics for Neon Nights by The Midnight.'"
          disabled={isLoading}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/30 p-3 rounded border border-cyan-900/50">
             <div className="flex items-center space-x-6">
                <span className="text-purple-400 text-xs font-bold tracking-wider">OUTPUT FORMAT:</span>
                <label className="flex items-center space-x-2 cursor-pointer group">
                    <input 
                        type="radio" 
                        name="format"
                        value="plain" 
                        checked={format === 'plain'} 
                        onChange={() => setFormat('plain')} 
                        className="appearance-none w-4 h-4 border border-cyan-600 rounded-full bg-black checked:bg-cyan-500 transition cursor-pointer" 
                        disabled={isLoading}
                    />
                    <span className={`text-sm group-hover:text-cyan-200 transition ${format === 'plain' ? "text-cyan-300 font-bold" : "text-gray-500"}`}>Plain Text</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                    <input 
                        type="radio" 
                        name="format"
                        value="markdown" 
                        checked={format === 'markdown'} 
                        onChange={() => setFormat('markdown')} 
                        className="appearance-none w-4 h-4 border border-cyan-600 rounded-full bg-black checked:bg-cyan-500 transition cursor-pointer"
                        disabled={isLoading}
                    />
                    <span className={`text-sm group-hover:text-cyan-200 transition ${format === 'markdown' ? "text-cyan-300 font-bold" : "text-gray-500"}`}>Markdown</span>
                </label>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isLoading || !prompt}
                className="px-6 py-2 bg-cyan-800 text-cyan-200 rounded-md border border-cyan-600 hover:bg-cyan-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-900/50"
            >
                {isLoading ? 'Summoning...' : 'Execute Ritual'}
            </button>
        </div>
      </div>

      {(isLoading || response) && (
         <div className="mt-6">
            <h3 className="text-xl text-purple-400 mb-2">Abyssal Transmission:</h3>
            {isLoading && !response && (
                <LoadingSpinner message="Connecting to the void..." className="p-8" />
            )}
            {response && <TerminalOutput text={response} />}
        </div>
      )}

      {/* History Logs Section */}
      <div className="mt-12 border-t border-cyan-900/50 pt-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg text-purple-400 tracking-widest font-bold">ARCHIVES // LOGS</h3>
            {history.length > 0 && (
                <button 
                    onClick={clearHistory}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-3 py-1 rounded bg-red-900/10 hover:bg-red-900/20 transition"
                >
                    PURGE ALL
                </button>
            )}
        </div>
        
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin-cyan pr-2">
            {history.length === 0 ? (
                <div className="p-4 bg-gray-900/20 border border-dashed border-gray-800 rounded text-gray-500 text-sm italic text-center">
                    No transmissions recorded in the local buffer.
                </div>
            ) : (
                history.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => loadHistoryItem(item)}
                        className="group flex items-center justify-between p-3 bg-black/40 border border-cyan-900/30 rounded cursor-pointer hover:bg-cyan-900/10 hover:border-cyan-700 transition duration-200"
                    >
                        <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center text-xs text-gray-500 mb-1">
                                <span className="mr-3 text-cyan-700 font-mono">[{new Date(item.timestamp).toLocaleTimeString()}]</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase border tracking-wider ${
                                    item.format === 'markdown' 
                                        ? 'border-purple-800 text-purple-400 bg-purple-900/10' 
                                        : 'border-green-800 text-green-400 bg-green-900/10'
                                }`}>
                                    {item.format}
                                </span>
                            </div>
                            <p className="text-cyan-300/80 text-sm truncate font-mono group-hover:text-cyan-200 transition">
                                {item.prompt}
                            </p>
                        </div>
                        <button 
                            onClick={(e) => deleteHistoryItem(e, item.id)}
                            className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-2 py-1"
                            title="Delete Log"
                            aria-label="Delete Log"
                        >
                            ✕
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};