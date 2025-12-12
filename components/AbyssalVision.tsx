import React, { useState, useEffect } from 'react';
import { generateImage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface VisionHistoryItem {
  id: string;
  timestamp: string; // ISO string
  prompt: string;
  imageUrl: string;
}

const STORAGE_KEY = 'abyssal_vision_history';
const MAX_PROMPT_LENGTH = 1000;

export const AbyssalVision: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [history, setHistory] = useState<VisionHistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse abyssal vision history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = async () => {
    const trimmedPrompt = prompt.trim();
    
    if (!trimmedPrompt) {
      setValidationError("Input Error: The void requires a non-empty directive.");
      return;
    }

    if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
      setValidationError(`Input Error: Directive too complex. Limit: ${MAX_PROMPT_LENGTH} chars.`);
      return;
    }

    if (isLoading) return;
    
    setIsLoading(true);
    setImageUrl(null);
    setError(null);
    setValidationError(null);
    
    const result = await generateImage(trimmedPrompt);
    
    // Accept any valid base64 image string
    if (result.startsWith('data:image/')) {
      setImageUrl(result);
      
      const newItem: VisionHistoryItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        prompt: trimmedPrompt,
        imageUrl: result
      };
      
      setHistory(prev => [newItem, ...prev]);
    } else {
      setError(result); // result is the error message string
    }
    setIsLoading(false);
  };

  const loadHistoryItem = (item: VisionHistoryItem) => {
    setPrompt(item.prompt);
    setImageUrl(item.imageUrl);
    setError(null);
    setValidationError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to purge all visual archives? This action cannot be undone.")) {
      setHistory([]);
    }
  };

  return (
    <div>
      <h2 className="text-2xl text-purple-400 mb-4 tracking-widest">Protocol: Abyssal Vision</h2>
      <p className="mb-4 text-cyan-500">Forge a vision from the ether. Describe the image to create.</p>
      
      <div className="mb-6 p-4 bg-gray-900/40 border border-cyan-900 rounded-md text-cyan-500 text-sm">
        <h4 className="text-purple-400 font-bold mb-2">OPERATIONAL DIRECTIVE:</h4>
        <p>Abyssal Vision materializes imagery for reconnaissance, asset creation, or psychological operations. Precision is key. For superior results, use detailed prompts specifying subject, environment, artistic style (e.g., 'photorealistic', 'glitch art'), lighting ('cinematic', 'noir'), and composition ('wide angle', 'macro shot').</p>
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
            <input
            type="text"
            className={`w-full p-3 bg-gray-900 border-2 rounded-md text-cyan-300 focus:outline-none focus:ring-2 transition ${validationError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-cyan-800 focus:ring-cyan-500 focus:border-cyan-500'}`}
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Vision description... e.g., 'A neon-drenched city in the rain, seen from a high-tech drone.'"
            disabled={isLoading}
            />
            <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-cyan-800 text-cyan-200 rounded-md border border-cyan-600 hover:bg-cyan-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-900/50 whitespace-nowrap"
            >
            {isLoading ? 'Forging...' : 'Forge Vision'}
            </button>
        </div>
        <div className="flex justify-between items-start px-1">
             <span className="text-red-400 text-xs font-mono h-4 block">{validationError}</span>
             <span className={`text-xs font-mono transition-colors ${prompt.length > MAX_PROMPT_LENGTH ? 'text-red-500 font-bold' : 'text-gray-600'}`}>
                CHARS: {prompt.length}/{MAX_PROMPT_LENGTH}
             </span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl text-purple-400 mb-2">Forged Reality:</h3>
        <div className="w-full min-h-[300px] bg-gray-900/50 border-2 border-dashed border-cyan-800 rounded-md flex items-center justify-center p-4">
          {isLoading && (
            <LoadingSpinner message="The abyss is contemplating your vision..." />
          )}
          {error && <p className="text-red-500">{error}</p>}
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="Generated vision" 
              className="max-w-full max-h-[512px] object-contain rounded-md shadow-lg shadow-cyan-500/20"
            />
          )}
          {!isLoading && !error && !imageUrl && (
            <p className="text-cyan-700">The canvas is empty. Awaiting your command.</p>
          )}
        </div>
      </div>

      {/* History Logs Section */}
      <div className="mt-12 border-t border-cyan-900/50 pt-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg text-purple-400 tracking-widest font-bold">ARCHIVES // VISIONS</h3>
            {history.length > 0 && (
                <button 
                    onClick={clearHistory}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-3 py-1 rounded bg-red-900/10 hover:bg-red-900/20 transition"
                >
                    PURGE ALL
                </button>
            )}
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin-cyan pr-2">
            {history.length === 0 ? (
                <div className="p-4 bg-gray-900/20 border border-dashed border-gray-800 rounded text-gray-500 text-sm italic text-center">
                    No visual artifacts recorded in the local buffer.
                </div>
            ) : (
                history.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => loadHistoryItem(item)}
                        className="group flex items-start p-3 bg-black/40 border border-cyan-900/30 rounded cursor-pointer hover:bg-cyan-900/10 hover:border-cyan-700 transition duration-200"
                    >
                        <div className="flex-shrink-0 mr-4 border border-cyan-900/50 rounded overflow-hidden w-16 h-16 bg-gray-900">
                             <img src={item.imageUrl} alt="Thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span className="text-cyan-700 font-mono">[{new Date(item.timestamp).toLocaleTimeString()}]</span>
                                <button 
                                    onClick={(e) => deleteHistoryItem(e, item.id)}
                                    className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-2"
                                    title="Delete Vision"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-cyan-300/80 text-sm line-clamp-2 font-mono group-hover:text-cyan-200 transition">
                                {item.prompt}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};