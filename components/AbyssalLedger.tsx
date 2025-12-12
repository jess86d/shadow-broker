import React, { useState, useEffect } from 'react';
import { recordPayment, fetchPaymentMethods } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import type { PaymentResult, PaymentDetails, StoredPaymentMethod } from '../types';

const LEDGER_STORAGE_KEY = 'abyssal_ledger_transactions';

interface LedgerEntry {
    id: string;
    amount: number;
    customerId: string;
    status: 'success' | 'error';
    timestamp: string;
    note?: string;
    hash?: string;
}

const ResultCard: React.FC<{ result: PaymentResult }> = ({ result }) => {
    // A generic error message for network/API failures.
    const isConnectionError = result.details?.includes('API Error:') || result.details?.includes('The ledger connection was severed');
    const displayMessage = isConnectionError ? "The connection to the ledger was interrupted. The digital ether is unstable. Please try again." : result.details;

    return (
        <div className={`mt-6 border-2 p-4 rounded-lg ${result.status === 'error' ? 'border-red-500 bg-red-900/20' : 'border-green-500 bg-green-900/20'} transition-all duration-500`}>
            <h3 className={`text-2xl font-bold mb-4 ${result.status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {result.status === 'success' ? 'Transaction Committed' : 'Transaction Failed'}
            </h3>
            <p className="text-cyan-300 italic mb-4"> &gt; {result.message}</p>
            
            {result.details && (
                <div className="bg-gray-900/50 p-3 rounded-md border border-cyan-800 mb-4">
                    <h4 className="text-purple-400">Details</h4>
                    <p className="text-red-400">{displayMessage}</p>
                </div>
            )}

            {result.payment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-cyan-200">
                    <div className="bg-gray-900/50 p-3 rounded-md border border-cyan-800">
                        <h4 className="text-purple-400">Payment ID</h4>
                        <p className="text-xl font-bold text-green-300 break-all">{result.payment.id}</p>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-md border border-cyan-800">
                        <h4 className="text-purple-400">Amount</h4>
                        <p className="text-xl font-bold text-green-300">${result.payment.amount.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-md border border-cyan-800">
                        <h4 className="text-purple-400">Customer ID</h4>
                        <p className="text-xl font-bold text-green-300 break-all">{result.payment.customerId}</p>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-md border border-cyan-800">
                        <h4 className="text-purple-400">Timestamp</h4>
                        <p className="text-xl font-bold text-green-300">{new Date(result.payment.created_at).toLocaleString()}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export const AbyssalLedger: React.FC = () => {
    const [isCommitting, setIsCommitting] = useState(false);
    const [isFetchingMethods, setIsFetchingMethods] = useState(false);
    const [result, setResult] = useState<PaymentResult | null>(null);
    const [formData, setFormData] = useState({
        customerId: 'cust_phantom_001',
        amount: '199.99',
        invoiceId: '',
        privateNote: ''
    });

    const [storedMethods, setStoredMethods] = useState<StoredPaymentMethod[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ customerId?: string; amount?: string; method?: string }>({});
    const [ledgerHistory, setLedgerHistory] = useState<LedgerEntry[]>([]);

    // Load History
    useEffect(() => {
        const saved = localStorage.getItem(LEDGER_STORAGE_KEY);
        if (saved) {
            try {
                setLedgerHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse ledger history");
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(ledgerHistory));
    }, [ledgerHistory]);

    useEffect(() => {
        const newErrors: { customerId?: string; amount?: string; method?: string } = {};
        if (!formData.customerId.trim()) {
            newErrors.customerId = "Customer ID cannot be empty.";
        }
        const amountNum = parseFloat(formData.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            newErrors.amount = "Amount must be a positive number.";
        }
        if (storedMethods.length > 0 && !selectedMethodId) {
            newErrors.method = "A payment method must be selected.";
        }
        setErrors(newErrors);
    }, [formData, selectedMethodId, storedMethods]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'customerId') {
            setStoredMethods([]);
            setSelectedMethodId(null);
            setFetchError(null);
        }
    };

    const handleFetchMethods = async () => {
        if (!formData.customerId.trim() || isFetchingMethods) return;
        setIsFetchingMethods(true);
        setFetchError(null);
        setStoredMethods([]);
        setSelectedMethodId(null);

        try {
            const methods = await fetchPaymentMethods(formData.customerId.trim());
            setStoredMethods(methods);
            if (methods.length > 0) {
                const defaultMethod = methods.find(m => m.default);
                if (defaultMethod) {
                    setSelectedMethodId(defaultMethod.id);
                } else {
                    setSelectedMethodId(methods[0].id);
                }
            } else {
                 setFetchError("No valid payment profiles found in the void for this ID.");
            }
        } catch (error) {
            setFetchError("Connection failure while retrieving payment profiles.");
        } finally {
            setIsFetchingMethods(false);
        }
    };

    const handleSubmit = async () => {
        if (Object.keys(errors).length > 0 || !selectedMethodId) return;
        setIsCommitting(true);
        setResult(null);
        
        const paymentDetails: PaymentDetails = {
            customerId: formData.customerId,
            amount: parseFloat(formData.amount),
            paymentMethodId: selectedMethodId,
            invoiceId: formData.invoiceId || undefined,
            privateNote: formData.privateNote || undefined,
        };
        
        const apiResult = await recordPayment(paymentDetails);
        setResult(apiResult);

        // Add to history
        const newEntry: LedgerEntry = {
            id: crypto.randomUUID(),
            amount: paymentDetails.amount,
            customerId: paymentDetails.customerId,
            status: apiResult.status,
            timestamp: new Date().toISOString(),
            note: paymentDetails.privateNote,
            hash: apiResult.payment?.id || 'FAILED_TX_HASH'
        };
        
        setLedgerHistory(prev => [newEntry, ...prev]);
        setIsCommitting(false);
    };

    const clearHistory = () => {
        if (confirm("Irreversibly wipe ledger history?")) {
            setLedgerHistory([]);
        }
    };

    const isLoading = isCommitting || isFetchingMethods;
    const isFormInvalid = Object.keys(errors).length > 0 || (storedMethods.length > 0 && !selectedMethodId);
    const inputStyles = (hasError: boolean) => 
        `w-full p-2 bg-gray-900 border-2 rounded-md text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-800/50 disabled:cursor-not-allowed transition ${hasError ? 'border-red-500' : 'border-cyan-800'}`;

    return (
        <div>
            <h2 className="text-2xl text-purple-400 mb-4 tracking-widest">Protocol: Abyssal Ledger</h2>
            <p className="mb-4 text-cyan-500">Active Financial Core. Record transactions into the immutable blockchain.</p>
            
            <div className="mb-6 p-4 bg-gray-900/40 border border-cyan-900 rounded-md text-cyan-500 text-sm">
                <h4 className="text-purple-400 font-bold mb-2">OPERATIONAL DIRECTIVE:</h4>
                <p>Abyssal Ledger connects to the decentralized financial grid. Enter a target Customer ID to retrieve their active payment profiles via the neural network. Authorize transactions to commit them to the ledger. All operations are logged permanently.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-cyan-500 mb-1">Customer ID <span className="text-red-500">*</span></label>
                    <div className="flex space-x-2">
                        <input type="text" name="customerId" value={formData.customerId} onChange={handleInputChange} className={inputStyles(!!errors.customerId)} disabled={isLoading} required />
                        <button onClick={handleFetchMethods} disabled={!formData.customerId.trim() || isLoading} className="px-4 py-2 bg-purple-800 text-purple-200 rounded-md border border-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition whitespace-nowrap">
                            {isFetchingMethods ? 'Scanning...' : 'Scan Profile'}
                        </button>
                    </div>
                    {errors.customerId && <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>}
                </div>
                
                {/* Dynamic Payment Methods Section */}
                <div className="p-4 bg-gray-900/30 border border-cyan-900 rounded-md min-h-[80px]">
                    <h4 className="text-purple-400 font-bold mb-2">Active Payment Profiles</h4>
                    {isFetchingMethods && <LoadingSpinner message="Decrypting wallet data..." />}
                    {fetchError && <p className="text-red-400">{fetchError}</p>}
                    {!isFetchingMethods && !fetchError && storedMethods.length === 0 && <p className="text-cyan-700 italic">No signal. Scan a profile to retrieve methods.</p>}
                    {storedMethods.length > 0 && (
                        <div className="space-y-2">
                            {storedMethods.map(method => (
                                <label key={method.id} className={`flex items-center p-3 rounded-md border-2 cursor-pointer transition ${selectedMethodId === method.id ? 'bg-cyan-900/50 border-cyan-600' : 'bg-gray-900 border-gray-700 hover:border-cyan-800'}`}>
                                    <input type="radio" name="paymentMethod" value={method.id} checked={selectedMethodId === method.id} onChange={(e) => setSelectedMethodId(e.target.value)} className="hidden" />
                                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mr-4 flex items-center justify-center ${selectedMethodId === method.id ? 'border-cyan-400' : 'border-gray-500'}`}>
                                        {selectedMethodId === method.id && <div className="w-2 h-2 rounded-full bg-cyan-400"></div>}
                                    </div>
                                    <div className="text-cyan-300">
                                        <span className="font-bold">{method.accountType.replace(/_/g, ' ')} ({method.accountNumber})</span>
                                        <div className="text-sm text-cyan-500 flex items-center mt-1">
                                            <span>{method.name}</span>
                                            {method.default && (
                                                <span className="ml-2 text-xs font-bold text-purple-300 bg-purple-900/70 px-2 py-0.5 rounded-full border border-purple-600">
                                                    PRIMARY
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                    {errors.method && <p className="text-red-500 text-sm mt-2">{errors.method}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-cyan-500 mb-1">Amount <span className="text-red-500">*</span></label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className={inputStyles(!!errors.amount)} disabled={isLoading} required />
                        {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                    </div>
                    <div className="relative group">
                        <label className="block text-cyan-500 mb-1">Invoice ID (Optional)</label>
                        <input type="text" name="invoiceId" value={formData.invoiceId} onChange={handleInputChange} className={inputStyles(false)} disabled={isLoading} />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-cyan-500 mb-1">Private Note (Optional)</label>
                       <textarea name="privateNote" value={formData.privateNote} onChange={handleInputChange} className={`${inputStyles(false)} h-20 scrollbar-thin-cyan`} disabled={isLoading} placeholder="Internal transaction notes..." />
                    </div>
                </div>
            </div>
            
            <button
                onClick={handleSubmit}
                disabled={isLoading || isFormInvalid}
                className="mt-4 px-6 py-2 bg-cyan-800 text-cyan-200 rounded-md border border-cyan-600 hover:bg-cyan-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-900/50"
            >
                {isCommitting ? 'Committing...' : 'Commit Transaction'}
            </button>

            <div className="mt-6">
                {isCommitting && (
                    <LoadingSpinner message="Writing block to the chain..." className="p-8" />
                )}
                {result && <ResultCard result={result} />}
            </div>

            {/* Persistent History Table */}
            <div className="mt-12 pt-6 border-t border-cyan-900/50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl text-purple-400 font-bold">Immutable Ledger History</h3>
                    {ledgerHistory.length > 0 && (
                        <button onClick={clearHistory} className="text-xs text-red-400 border border-red-900/50 px-3 py-1 rounded bg-red-900/10 hover:bg-red-900/20">Wipe Ledger</button>
                    )}
                </div>
                
                <div className="overflow-x-auto border border-cyan-900 rounded-md">
                    <table className="w-full text-sm text-left text-cyan-300">
                        <thead className="text-xs text-cyan-500 uppercase bg-gray-900/50 border-b border-cyan-900">
                            <tr>
                                <th className="px-4 py-3">Timestamp</th>
                                <th className="px-4 py-3">Hash / ID</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-900/30 bg-black/40">
                            {ledgerHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 italic">No blocks found in the chain.</td>
                                </tr>
                            ) : (
                                ledgerHistory.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-cyan-900/10 transition">
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-400 font-mono text-xs">{new Date(entry.timestamp).toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-cyan-600 truncate max-w-[150px]" title={entry.hash}>{entry.hash}</td>
                                        <td className="px-4 py-3">{entry.customerId}</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-400">${entry.amount.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.status === 'success' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                                                {entry.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};