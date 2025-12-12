import React, { useState } from 'react';
import { generateCode } from '../services/geminiService';
import { CopyIcon, CheckIcon, FileIcon, DownloadIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import type { CodeFile } from '../types';

export const CodeWeaver: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<'standard' | 'minified'>('standard');
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  // Real Build/Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  const handleSubmit = async () => {
    if (!prompt || isLoading) return;
    setIsLoading(true);
    setFiles([]);
    setPreviewUrl(null);
    setActiveTab('code');
    setSelectedFileIndex(0);
    
    const resultFiles = await generateCode(prompt, style);
    setFiles(resultFiles);
    setIsLoading(false);
  };
  
  const handleCopy = () => {
    const content = files[selectedFileIndex]?.content;
    if(!content) return;
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = (file: CodeFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBuildAndRun = () => {
      if (files.length === 0) return;

      // 1. Identify Entry Point (index.html) or create a wrapper
      const htmlFile = files.find(f => f.name.toLowerCase().endsWith('index.html')) || files.find(f => f.name.toLowerCase().endsWith('.html'));
      const cssFiles = files.filter(f => f.name.toLowerCase().endsWith('.css'));
      const jsFiles = files.filter(f => f.name.toLowerCase().endsWith('.js'));

      let finalHtml = htmlFile ? htmlFile.content : `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Preview</title>
    <style>body { font-family: sans-serif; padding: 20px; color: #333; background: #fff; }</style>
</head>
<body>
    <div id="root"></div>
    <div id="app"></div>
    <!-- No index.html found. Injecting scripts/styles into a generic container. -->
</body>
</html>`;

      // 2. Inject CSS
      // Remove existing link tags to these files to avoid 404s in the blob
      // Simple heuristic: remove <link rel="stylesheet" href="style.css">
      cssFiles.forEach(css => {
          const regex = new RegExp(`<link[^>]+href=["']${css.name}["'][^>]*>`, 'gi');
          finalHtml = finalHtml.replace(regex, '');
          
          const styleTag = `<style>\n/* Source: ${css.name} */\n${css.content}\n</style>`;
          if (finalHtml.includes('</head>')) {
              finalHtml = finalHtml.replace('</head>', `${styleTag}\n</head>`);
          } else {
              finalHtml += styleTag;
          }
      });

      // 3. Inject JS
      jsFiles.forEach(js => {
           const regex = new RegExp(`<script[^>]+src=["']${js.name}["'][^>]*>.*?</script>`, 'gi');
           finalHtml = finalHtml.replace(regex, '');
           
           // Also handle self-closing or empty script tags more robustly if needed, 
           // but keeping it simple for now. 
           // Attempt to inject at end of body
           const scriptTag = `<script>\n/* Source: ${js.name} */\n${js.content}\n</script>`;
           if (finalHtml.includes('</body>')) {
               finalHtml = finalHtml.replace('</body>', `${scriptTag}\n</body>`);
           } else {
               finalHtml += scriptTag;
           }
      });

      // 4. Create Blob and set Preview
      const blob = new Blob([finalHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setActiveTab('preview');
  };

  return (
    <div>
      <h2 className="text-2xl text-purple-400 mb-4 tracking-widest">Protocol: Code Weaver</h2>
      <p className="mb-4 text-cyan-500">Construct digital artifacts with forbidden logic. Specify the code to weave.</p>
      
      <div className="mb-6 p-4 bg-gray-900/40 border border-cyan-900 rounded-md text-cyan-500 text-sm">
        <h4 className="text-purple-400 font-bold mb-2">OPERATIONAL DIRECTIVE:</h4>
        <p>Code Weaver is a rapid-prototyping engine. It can generate full multi-file application structures. Select 'Standard' for readable code, or 'Minified' for compact payloads. Click <strong>EXECUTE BUILD</strong> to compile the generated files into a live, running preview within the secure sandbox.</p>
      </div>

      <div className="flex flex-col space-y-4">
        <textarea
          className="w-full h-24 p-3 bg-gray-900 border-2 border-cyan-800 rounded-md text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition scrollbar-thin-cyan"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Blueprint here... e.g., 'Create a Snake game in a single HTML file.'"
          disabled={isLoading}
        />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/30 p-3 rounded border border-cyan-900/50">
            <div className="flex items-center space-x-6">
                <span className="text-purple-400 text-xs font-bold tracking-wider">WEAVE STYLE:</span>
                <label className="flex items-center space-x-2 cursor-pointer group">
                    <input 
                        type="radio" 
                        name="style"
                        value="standard" 
                        checked={style === 'standard'} 
                        onChange={() => setStyle('standard')} 
                        className="appearance-none w-4 h-4 border border-cyan-600 rounded-full bg-black checked:bg-cyan-500 transition cursor-pointer" 
                        disabled={isLoading}
                    />
                    <span className={`text-sm group-hover:text-cyan-200 transition ${style === 'standard' ? "text-cyan-300 font-bold" : "text-gray-500"}`}>Standard</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                    <input 
                        type="radio" 
                        name="style"
                        value="minified" 
                        checked={style === 'minified'} 
                        onChange={() => setStyle('minified')} 
                        className="appearance-none w-4 h-4 border border-cyan-600 rounded-full bg-black checked:bg-cyan-500 transition cursor-pointer"
                        disabled={isLoading}
                    />
                    <span className={`text-sm group-hover:text-cyan-200 transition ${style === 'minified' ? "text-cyan-300 font-bold" : "text-gray-500"}`}>Minified</span>
                </label>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isLoading || !prompt}
                className="px-6 py-2 bg-cyan-800 text-cyan-200 rounded-md border border-cyan-600 hover:bg-cyan-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-900/50"
            >
                {isLoading ? 'Weaving...' : 'Generate Project'}
            </button>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl text-purple-400 mb-2">Project Construct:</h3>
        
        {isLoading && (
            <LoadingSpinner message="Assembling digital scaffold..." className="p-8" />
        )}

        {!isLoading && files.length > 0 && (
            <div className="space-y-4">
                {/* Build / Run Control Bar */}
                <div className="flex items-center justify-between p-3 bg-gray-900/30 border border-cyan-900/30 rounded">
                    <div className="flex space-x-2">
                        <button
                             onClick={() => setActiveTab('code')}
                             className={`px-4 py-1.5 rounded text-sm font-bold tracking-wide transition uppercase ${activeTab === 'code' ? 'bg-cyan-900 text-cyan-200 border border-cyan-600' : 'bg-transparent text-gray-500 hover:text-cyan-400'}`}
                        >
                            Source Code
                        </button>
                        <button
                             onClick={() => {
                                 if (previewUrl) {
                                     setActiveTab('preview');
                                 } else {
                                     handleBuildAndRun();
                                 }
                             }}
                             className={`px-4 py-1.5 rounded text-sm font-bold tracking-wide transition uppercase ${activeTab === 'preview' ? 'bg-cyan-900 text-cyan-200 border border-cyan-600' : 'bg-transparent text-gray-500 hover:text-cyan-400'}`}
                        >
                            Live Preview
                        </button>
                    </div>
                    <button
                        onClick={handleBuildAndRun}
                        className="px-4 py-1.5 rounded border text-sm font-bold tracking-wide transition uppercase shadow-lg bg-green-900/20 border-green-700 text-green-400 hover:bg-green-900/40 shadow-green-900/20 flex items-center gap-2"
                    >
                        <span>▶</span> EXECUTE BUILD
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-[600px] border border-cyan-900 rounded-md overflow-hidden bg-gray-900/50 shadow-inner shadow-cyan-900/30">
                    {/* File Explorer Sidebar */}
                    <div className="w-full md:w-56 bg-black/40 border-r border-cyan-900/30 flex flex-col">
                        <div className="p-3 bg-cyan-900/20 text-cyan-300 font-bold text-sm tracking-widest border-b border-cyan-900/30">
                            FILES ({files.length})
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-thin-cyan p-2 space-y-1">
                            {files.map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setSelectedFileIndex(index);
                                        setActiveTab('code'); // Switch back to code view when a file is selected
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition ${
                                        selectedFileIndex === index && activeTab === 'code'
                                        ? 'bg-cyan-900/40 text-cyan-200 border border-cyan-800' 
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-cyan-400'
                                    }`}
                                >
                                    <FileIcon />
                                    <span className="truncate">{file.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area (Switchable) */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
                        {activeTab === 'code' && (
                            <>
                                 <div className="flex items-center justify-between p-2 border-b border-cyan-900/30 bg-black/20">
                                     <span className="text-cyan-500 font-mono text-sm ml-2">
                                         {files[selectedFileIndex]?.name}
                                     </span>
                                     <div className="flex items-center space-x-2">
                                         <button
                                            onClick={() => handleDownload(files[selectedFileIndex])}
                                            className="p-1.5 text-cyan-600 hover:text-cyan-300 transition rounded hover:bg-cyan-900/20"
                                            title="Download File"
                                         >
                                             <DownloadIcon />
                                         </button>
                                         <button
                                            onClick={handleCopy}
                                            className="p-1.5 text-cyan-600 hover:text-cyan-300 transition rounded hover:bg-cyan-900/20"
                                            title="Copy Content"
                                         >
                                             {isCopied ? <CheckIcon /> : <CopyIcon />}
                                         </button>
                                     </div>
                                 </div>
                                 <div className="flex-1 overflow-auto scrollbar-thin-cyan p-4">
                                    <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap break-words">
                                        <code>{files[selectedFileIndex]?.content}</code>
                                    </pre>
                                 </div>
                            </>
                        )}

                        {activeTab === 'preview' && (
                            <div className="flex-1 flex flex-col h-full">
                                {previewUrl ? (
                                    <iframe 
                                        src={previewUrl} 
                                        className="w-full h-full bg-white"
                                        title="Live Preview"
                                        sandbox="allow-scripts" // Allow scripts to run for the preview
                                    />
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-500 italic">
                                        Click 'EXECUTE BUILD' to initialize the runtime environment.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {!isLoading && files.length === 0 && (
            <div className="p-8 border-2 border-dashed border-cyan-900/30 rounded-md text-center text-gray-600 italic">
                No constructs materialized. Initiate a weave to begin.
            </div>
        )}
      </div>
    </div>
  );
};