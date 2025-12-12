import React, { useState } from 'react';
import { runOsintScan } from '../services/geminiService';
import type { OsintReport, SocialProfileResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ScanResult {
    target: string;
    report?: OsintReport;
    error?: string;
}

const SocialResult: React.FC<{ platform: string, result: SocialProfileResult }> = ({ platform, result }) => (
    <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
        <span className="text-cyan-400">{platform}</span>
        {result.found ? (
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                Profile Found
            </a>
        ) : (
            <span className="text-gray-500">Not Found</span>
        )}
    </div>
);

const ReportCard: React.FC<{ result: ScanResult }> = ({ result }) => {
    const { target, report, error } = result;
    return (
        <div className="bg-gray-900/50 border border-cyan-800 rounded-lg p-4">
            <h4 className="text-xl text-purple-400 font-bold mb-3 tracking-wider">Report for: <span className="text-cyan-300">{target}</span></h4>
            {error && (
                 <div className="p-2 bg-red-900/30 border border-red-500 rounded-md text-red-400">
                     <p className="font-bold">Scan Anomaly Detected:</p>
                     <p>{error}</p>
                 </div>
            )}
            {report && (
                <div className="space-y-4">
                    {/* Google Search */}
                    <div>
                        <h5 className="text-purple-400 font-semibold mb-2">Google Search Intel</h5>
                        <p className="text-cyan-300 text-sm"><span className="font-semibold text-cyan-100">Summary:</span> {report.google_search.summary}</p>
                    </div>
                    
                    {/* Domain Info */}
                    <div>
                        <h5 className="text-purple-400 font-semibold mb-2">Domain Intel</h5>
                        {report.domain_info.status.startsWith('skipped') ? (
                            <p className="text-gray-500 text-sm">{report.domain_info.status}</p>
                        ) : (
                            <div className="text-cyan-300 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <p><span className="font-semibold text-cyan-100">Organization:</span> {report.domain_info.whois_data?.organization || 'N/A'}</p>
                                <p><span className="font-semibold text-cyan-100">Created:</span> {report.domain_info.whois_data?.creation_date || 'N/A'}</p>
                                <p><span className="font-semibold text-cyan-100">Expires:</span> {report.domain_info.whois_data?.expiration_date || 'N/A'}</p>
                                <p className="md:col-span-2"><span className="font-semibold text-cyan-100">Name Servers:</span> {report.domain_info.whois_data?.name_servers?.join(', ') || 'N/A'}</p>
                            </div>
                        )}
                    </div>

                    {/* Social Media */}
                    <div>
                        <h5 className="text-purple-400 font-semibold mb-2">Social Media Presence</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(report.social_media_presence.profiles).map(([platform, socialResult]) => (
                                <SocialResult key={platform} platform={platform} result={socialResult} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export const OsintHarbinger: React.FC = () => {
    const [targetsInput, setTargetsInput] = useState<string>('example.com, johndoe');
    const [results, setResults] = useState<ScanResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async () => {
        // CONFIRMED: The following regex robustly handles targets separated by commas, spaces, or newlines.
        const targetArray = targetsInput.split(/[,\s]+/).map(t => t.trim()).filter(Boolean);
        if (targetArray.length === 0 || isLoading) return;

        setIsLoading(true);
        setResults([]);
        
        const scanPromises = targetArray.map(async (t): Promise<ScanResult> => {
            const scanResult = await runOsintScan(t);
            if (typeof scanResult === 'string') {
                return { target: t, error: scanResult };
            } else {
                return { target: t, report: scanResult };
            }
        });

        const newResults = await Promise.all(scanPromises);
        setResults(newResults);
        setIsLoading(false);
    };

    const handleExport = () => {
        const successfulReports = results
            .filter(result => result.report)
            .map(result => result.report);

        if (successfulReports.length === 0) return;

        const exportData = {
            export_timestamp: new Date().toISOString(),
            reports: successfulReports,
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `osint_harbinger_report_${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h2 className="text-2xl text-purple-400 mb-4 tracking-widest">Protocol: OSINT Harbinger</h2>
            <p className="mb-4 text-cyan-500">Deploy multi-vector intelligence agents to gather open-source data on targets.</p>
            
            <div className="mb-6 p-4 bg-gray-900/40 border border-cyan-900 rounded-md text-cyan-500 text-sm">
                <h4 className="text-purple-400 font-bold mb-2">OPERATIONAL DIRECTIVE:</h4>
                <p>OSINT Harbinger deploys active reconnaissance agents to gather real-time intelligence. Input targets (usernames, names, or domains). The system utilizes global search indexes to construct a live profile, identifying social footprints, domain registration data, and public summaries. Data is pulled from the live web, not a simulation.</p>
            </div>

            <div className="flex flex-col space-y-4">
                <textarea
                    className="w-full h-24 p-3 bg-gray-900 border-2 border-cyan-800 rounded-md text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition scrollbar-thin-cyan"
                    value={targetsInput}
                    onChange={(e) => setTargetsInput(e.target.value)}
                    placeholder="Enter targets (e.g., 'johndoe', 'example.com')..."
                    disabled={isLoading}
                />
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !targetsInput.trim()}
                        className="flex-grow px-6 py-2 bg-cyan-800 text-cyan-200 rounded-md border border-cyan-600 hover:bg-cyan-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-900/50"
                    >
                        {isLoading ? 'Scanning...' : 'Initiate Scan'}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isLoading || results.filter(r => r.report).length === 0}
                        className="px-6 py-2 bg-purple-800 text-purple-200 rounded-md border border-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        Export Report
                    </button>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-xl text-purple-400 mb-2">Intelligence Feed:</h3>
                {isLoading && (
                    <LoadingSpinner message="Agents are gathering intel across the digital plane..." className="p-8" />
                )}
                {!isLoading && results.length === 0 && (
                     <div className="p-4 bg-gray-900/30 border border-cyan-900 rounded-md text-cyan-700">
                        <p>Awaiting targets. The Harbinger is dormant.</p>
                     </div>
                )}
                {!isLoading && results.length > 0 && (
                    <div className="space-y-4">
                        {results.map((result) => (
                            <ReportCard key={result.target} result={result} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};