import React, { useState, useEffect } from 'react';
import { analyzeTransaction } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { DynamicRules, DynamicRulePattern, TransactionAnalysis } from '../types';

const STORAGE_KEY = 'specter_sentinel_rules';

const AnalysisResult: React.FC<{ result: TransactionAnalysis }> = ({ result }) => (
  <div className={`mt-6 border-2 p-4 rounded-lg ${result.final_decision ? 'border-red-500 bg-red-900/20' : 'border-green-500 bg-green-900/20'} transition-all duration-500`}>
    <h3 className={`text-2xl font-bold mb-4 ${result.final_decision ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
      Analysis Complete: {result.final_decision ? 'THREAT DETECTED' : 'NOMINAL ACTIVITY'}
    </h3>
    <p className="text-cyan-300 italic mb-4"> &gt; {result.summary}</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-cyan-200">
      <div className="bg-gray-900/50 p-3 rounded-md border border-cyan-800">
        <h4 className="text-purple-400">ML Fraud Probability</h4>
        <p className={`text-2xl font-bold ${result.ml_fraud_proba > 0.7 ? 'text-red-500' : 'text-green-500'}`}>
          {(result.ml_fraud_proba * 100).toFixed(2)}%
        </p>
      </div>
      
      <div className="bg-gray-900/50 p-3 rounded-md border border-cyan-800">
        <h4 className="text-purple-400">Anomaly Detected</h4>
        <p className={`text-2xl font-bold ${result.is_anomaly ? 'text-yellow-400' : 'text-green-500'}`}>
          {result.is_anomaly ? 'YES' : 'NO'}
        </p>
      </div>

      <div className="md:col-span-2 bg-gray-900/50 p-3 rounded-md border border-cyan-800">
        <h4 className="text-purple-400">Threat Intel Rules Triggered</h4>
        {result.rule_based_fraud && result.triggered_rules.length > 0 ? (
          <ul className="list-disc list-inside text-yellow-400 mt-2">
            {result.triggered_rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 mt-2">None</p>
        )}
      </div>
    </div>
  </div>
);

export const SpecterSentinel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TransactionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '6000',
    transaction_type: 'international_wire',
    location: 'RU',
    ip_address: '192.168.1.100',
    description: 'payment for services card_skimming_v2'
  });

  const [dynamicRules, setDynamicRules] = useState<DynamicRules>({ badIps: [], keywords: [], patterns: [] });
  const [newIp, setNewIp] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newPattern, setNewPattern] = useState({ transaction_type: '', min_amount: '', description_keywords: '' });
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  useEffect(() => {
    const savedRules = localStorage.getItem(STORAGE_KEY);
    if (savedRules) {
      try {
        const parsedRules = JSON.parse(savedRules);
        // Basic validation to prevent app crash on malformed storage
        if (parsedRules && Array.isArray(parsedRules.badIps) && Array.isArray(parsedRules.keywords) && Array.isArray(parsedRules.patterns)) {
          setDynamicRules(parsedRules);
        }
      } catch (e) {
        console.error("Failed to parse dynamic rules from localStorage", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dynamicRules));
  }, [dynamicRules]);

  const handleAddIp = () => {
    if (newIp && !dynamicRules.badIps.includes(newIp)) {
      setDynamicRules(prev => ({ ...prev, badIps: [...prev.badIps, newIp] }));
      setNewIp('');
    }
  };

  const handleRemoveIp = (ipToRemove: string) => {
    setDynamicRules(prev => ({ ...prev, badIps: prev.badIps.filter(ip => ip !== ipToRemove) }));
  };
  
  const handleAddKeyword = () => {
    if (newKeyword && !dynamicRules.keywords.includes(newKeyword)) {
      setDynamicRules(prev => ({ ...prev, keywords: [...prev.keywords, newKeyword] }));
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setDynamicRules(prev => ({ ...prev, keywords: prev.keywords.filter(kw => kw !== keywordToRemove) }));
  };

  const handleAddPattern = () => {
    if (newPattern.transaction_type && newPattern.min_amount && newPattern.description_keywords) {
      const patternToAdd: DynamicRulePattern = {
        id: crypto.randomUUID(),
        transaction_type: newPattern.transaction_type,
        min_amount: parseFloat(newPattern.min_amount),
        description_keywords: newPattern.description_keywords,
      };
      setDynamicRules(prev => ({ ...prev, patterns: [...prev.patterns, patternToAdd] }));
      setNewPattern({ transaction_type: '', min_amount: '', description_keywords: '' });
    }
  };

  const handleRemovePattern = (idToRemove: string) => {
    setDynamicRules(prev => ({ ...prev, patterns: prev.patterns.filter(p => p.id !== idToRemove) }));
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
    };
    
    // Pass the transaction data and the current dynamic rules to the analysis service.
    const result = await analyzeTransaction(transactionData, dynamicRules);
    
    if (typeof result === 'string') {
      setError(result);
    } else {
      setAnalysis(result);
    }
    
    setIsLoading(false);
  };
  
  const inputStyles = "w-full p-2 bg-gray-900 border-2 border-cyan-800 rounded-md text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-800/50 disabled:cursor-not-allowed";
  const ruleInputStyles = "flex-grow p-1 bg-gray-800 border border-cyan-900 rounded-md text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-600";
  const ruleButtonStyles = "px-2 py-1 bg-cyan-800 text-cyan-200 text-sm rounded-md border border-cyan-600 hover:bg-cyan-700 transition disabled:bg-gray-700 disabled:cursor-not-allowed";
  const removeButtonStyles = "text-red-500 hover:text-red-400 font-bold text-lg";

  return (
    <div>
      <h2 className="text-2xl text-purple-400 mb-4 tracking-widest">Protocol: Specter Sentinel</h2>
      <p className="mb-4 text-cyan-500">Analyze transaction data streams for anomalous or hostile patterns. Input target data below.</p>
      
      <div className="mb-6 p-4 bg-gray-900/40 border border-cyan-900 rounded-md text-cyan-500 text-sm">
        <h4 className="text-purple-400 font-bold mb-2">OPERATIONAL DIRECTIVE:</h4>
        <p>Specter Sentinel is a simulated threat analysis engine. It uses a hybrid model combining static threat intelligence, ML-based behavioral analysis, and anomaly detection to identify high-risk activity. Test the system's logic by inputting data designed to trigger specific rules or by crafting subtle anomalies. Use the Threat Intelligence Matrix to add your own dynamic rules for customized analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-cyan-500 mb-1">Amount</label>
          <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className={inputStyles} disabled={isLoading} />
        </div>
        <div>
          <label className="block text-cyan-500 mb-1">Transaction Type</label>
          <select name="transaction_type" value={formData.transaction_type} onChange={handleInputChange} className={inputStyles} disabled={isLoading}>
            <option>online_purchase</option>
            <option>pos_terminal</option>
            <option>atm_withdrawal</option>
            <option>wire_transfer</option>
            <option>international_wire</option>
            <option>crypto_purchase</option>
            <option>vpn_access</option>
          </select>
        </div>
        <div>
          <label className="block text-cyan-500 mb-1">Location</label>
          <input type="text" name="location" value={formData.location} onChange={handleInputChange} className={inputStyles} disabled={isLoading} />
        </div>
        <div>
          <label className="block text-cyan-500 mb-1">IP Address</label>
          <input type="text" name="ip_address" value={formData.ip_address} onChange={handleInputChange} className={inputStyles} disabled={isLoading} />
        </div>
        <div className="md:col-span-2">
           <label className="block text-cyan-500 mb-1">Description</label>
           <textarea name="description" value={formData.description} onChange={handleInputChange} className={`${inputStyles} h-20 scrollbar-thin-cyan`} disabled={isLoading} />
        </div>
      </div>
       
      {/* Dynamic Rule Management */}
      <div className="mt-6 border border-cyan-900 rounded-lg">
          <button onClick={() => setIsMatrixOpen(!isMatrixOpen)} className="w-full p-3 bg-gray-900/50 text-left text-purple-400 font-bold tracking-wider">
              {isMatrixOpen ? '▼' : '►'} Threat Intelligence Matrix
          </button>
          {isMatrixOpen && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/30">
                  {/* Bad IPs */}
                  <div className="space-y-2">
                      <h4 className="text-cyan-400">Known Bad IPs</h4>
                      <div className="flex gap-2">
                          <input type="text" value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="Add IP..." className={ruleInputStyles} />
                          <button onClick={handleAddIp} disabled={!newIp} className={ruleButtonStyles}>Add</button>
                      </div>
                      <ul className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin-cyan pr-2">
                          {dynamicRules.badIps.map(ip => <li key={ip} className="flex justify-between items-center text-sm bg-gray-900/50 p-1 rounded"><span>{ip}</span><button onClick={() => handleRemoveIp(ip)} aria-label="Remove IP" className={removeButtonStyles}>×</button></li>)}
                      </ul>
                  </div>
                  {/* Keywords */}
                  <div className="space-y-2">
                      <h4 className="text-cyan-400">Exploit Keywords</h4>
                      <div className="flex gap-2">
                          <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="Add keyword..." className={ruleInputStyles} />
                          <button onClick={handleAddKeyword} disabled={!newKeyword} className={ruleButtonStyles}>Add</button>
                      </div>
                      <ul className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin-cyan pr-2">
                          {dynamicRules.keywords.map(kw => <li key={kw} className="flex justify-between items-center text-sm bg-gray-900/50 p-1 rounded"><span>{kw}</span><button onClick={() => handleRemoveKeyword(kw)} aria-label="Remove keyword" className={removeButtonStyles}>×</button></li>)}
                      </ul>
                  </div>
                  {/* Patterns */}
                  <div className="space-y-2">
                      <h4 className="text-cyan-400">Suspicious Patterns</h4>
                      <div className="space-y-2 p-2 border border-cyan-900 rounded">
                          <input type="text" value={newPattern.transaction_type} onChange={(e) => setNewPattern(p => ({...p, transaction_type: e.target.value}))} placeholder="Transaction Type" className={ruleInputStyles} />
                          <input type="number" value={newPattern.min_amount} onChange={(e) => setNewPattern(p => ({...p, min_amount: e.target.value}))} placeholder="Min Amount" className={ruleInputStyles} />
                          <input type="text" value={newPattern.description_keywords} onChange={(e) => setNewPattern(p => ({...p, description_keywords: e.target.value}))} placeholder="Desc. Keywords" className={ruleInputStyles} />
                          <button onClick={handleAddPattern} disabled={!newPattern.transaction_type || !newPattern.min_amount || !newPattern.description_keywords} className={`${ruleButtonStyles} w-full mt-2`}>Add Pattern</button>
                      </div>
                      <ul className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin-cyan pr-2">
                          {dynamicRules.patterns.map(p => <li key={p.id} className="relative text-xs bg-gray-900/50 p-2 rounded">
                              <button onClick={() => handleRemovePattern(p.id)} aria-label="Remove pattern" className={`${removeButtonStyles} absolute top-0 right-1`}>×</button>
                              <p>Type: <span className="text-cyan-300">{p.transaction_type}</span></p>
                              <p>Amount &gt;: <span className="text-cyan-300">{p.min_amount}</span></p>
                              <p>Keywords: <span className="text-cyan-300">{p.description_keywords}</span></p>
                          </li>)}
                      </ul>
                  </div>
              </div>
          )}
      </div>


      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="mt-4 px-6 py-2 bg-cyan-800 text-cyan-200 rounded-md border border-cyan-600 hover:bg-cyan-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-900/50"
      >
        {isLoading ? 'Analyzing...' : 'Execute Analysis'}
      </button>

      <div className="mt-6">
        {isLoading && (
          <LoadingSpinner message="Sentinel is probing the digital echoes..." className="p-8" />
        )}
        {error && 
          <div className="p-4 bg-red-900/30 border border-red-500 rounded-md text-red-400">
              <p className="font-bold">Analysis Anomaly Detected:</p>
              <p>{error}</p>
          </div>
        }
        {analysis && <AnalysisResult result={analysis} />}
      </div>
    </div>
  );
};