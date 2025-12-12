import React, { useState } from 'react';
import { crawlUrl } from '../services/geminiService';
import { CrawlResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

const StatusBadge: React.FC<{ code: number }> = ({ code }) => {
    let colorClasses = 'bg-gray-700 text-gray-300';
    if (code >= 200 && code < 300) {
        colorClasses = 'bg-green-800 text-green-300';
    } else if (code >= 300 && code < 400) {
        colorClasses = 'bg-yellow-800 text-yellow-300';
    } else if (code >= 400 || code < 0) {
        colorClasses = 'bg-red-800 text-red-300';
    }
    return (
        <span className={`px-2 py-1 text-sm font-bold rounded-md ${colorClasses}`}>
            {code}
        </span>
    );
};

const CrawlResultCard: React.FC<{ result: CrawlResult }> = ({ result }) => {
    return (
        <div className="bg-gray-900/50 border border-cyan-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-purple-400 font-bold break-all">{result.original_url}</h4>
                <StatusBadge code={result.status_code} />
            </div>
            {result.error_message ? (
                 <p className="text-red-400"> &gt; Error: {result.error_message}</p>
            ) : (
                <div>
                    <div className="text-sm text-cyan-400 space-y-1">
                        {result.proxy_location && (
                             <p><span className="font-bold text-cyan-200 w-28 inline-block">Egress Point:</span> {result.proxy_location}</p>
                        )}
                        <p><span className="font-bold text-cyan-200 w-28 inline-block">Final URL:</span> <span className="break-all">{result.final_url}</span></p>
                        <p><span className="font-bold text-cyan-200 w-28 inline-block">Content Length:</span> {result.content_length} bytes</p>
                    </div>
                    <div className="mt-4">
                        <h5 className="text-purple-400 mb-1">Content Preview:</h5>
                        <pre className="bg-black/50 p-2 border border-gray-700 rounded-md text-gray-400 text-xs whitespace-pre-wrap break-words h-24 overflow-y-auto scrollbar-thin-cyan">
                            <code>{result.content_preview || "No content preview available."}</code>
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export const ShadowCrawler: React.FC = () => {
    const [urls, setUrls] = useState<string>("https://www.google.com, https://example.com\nhttps://www.github.com/microsoft");
    const [results, setResults] = useState<CrawlResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [country, setCountry] = useState<string>('');
    const [city, setCity] = useState<string>('');

    const handleSubmit = async () => {
        const targetUrls = urls.split(/[,\s]+/).map(u => u.trim()).filter(Boolean);
        if (targetUrls.length === 0 || isLoading) return;

        setIsLoading(true);
        setResults([]);
        
        const crawlPromises = targetUrls.map(url => crawlUrl(url, country, city));
        const settledResults = await Promise.allSettled(crawlPromises);

        const newResults: CrawlResult[] = settledResults.map((res, index) => {
            if (res.status === 'fulfilled') {
                return res.value;
            } else {
                return {
                    original_url: targetUrls[index],
                    final_url: targetUrls[index],
                    status_code: -1,
                    content_length: 0,
                    content_preview: `Critical failure during crawl operation: ${res.reason}`,
                    error_message: 'The crawler failed to execute the request.',
                    proxy_location: 'Unknown'
                };
            }
        });

        setResults(newResults);
        setIsLoading(false);
    };

    const inputStyles = "w-full p-2 bg-gray-900 border-2 border-cyan-800 rounded-md text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:bg-gray-800/50 disabled:cursor-not-allowed";

    return (
        <div>
            <h2 className="text-2xl text-purple-400 mb-4 tracking-widest">Protocol: Shadow Crawler</h2>
            <p className="mb-4 text-cyan-500">Deploy autonomous agents to gather intelligence from web targets.</p>
            
            <div className="mb-6 p-4 bg-gray-900/40 border border-cyan-900 rounded-md text-cyan-500 text-sm">
                <h4 className="text-purple-400 font-bold mb-2">OPERATIONAL DIRECTIVE:</h4>
                <p>Shadow Crawler initiates real-time network requests to target coordinates. It utilizes a dual-layer approach: Direct Uplink (Client-Side Fetch) for permissive targets, and Neural Search Grounding to bypass CORS restrictions and retrieve live intelligence from the global network. Input URLs to begin reconnaissance.</p>
            </div>

            <textarea
                className={`${inputStyles} h-32 scrollbar-thin-cyan`}
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="Enter target URLs, separated by new lines, commas, or spaces..."
                disabled={isLoading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label htmlFor="country" className="block text-cyan-500 mb-1 text-sm">Target Country (Optional)</label>
                    <input
                        id="country"
                        type="text"
                        className={inputStyles}
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g., Germany"
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label htmlFor="city" className="block text-cyan-500 mb-1 text-sm">Target City (Optional)</label>
                    <input
                        id="city"
                        type="text"
                        className={inputStyles}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g., Berlin"
                        disabled={isLoading}
                    />
                </div>
            </div>
            
            <button
                onClick={handleSubmit}
                disabled={isLoading || !urls.trim()}
                className="mt-4 px-6 py-2 bg-cyan-800 text-cyan-200 rounded-md border border-cyan-600 hover:bg-cyan-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-900/50"
            >
                {isLoading ? 'Crawling...' : 'Deploy Crawler'}
            </button>

            <div className="mt-6">
                <h3 className="text-xl text-purple-400 mb-2">Reconnaissance Report:</h3>
                {isLoading && (
                    <LoadingSpinner message="Agents deployed... gathering intel..." className="p-8" />
                )}
                {!isLoading && results.length === 0 && (
                     <div className="p-4 bg-gray-900/30 border border-cyan-900 rounded-md text-cyan-700">
                        <p>No active missions. Awaiting targets.</p>
                     </div>
                )}
                {!isLoading && results.length > 0 && (
                    <div>
                        {results.map((result, index) => (
                            <CrawlResultCard key={`${result.original_url}-${index}`} result={result} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};