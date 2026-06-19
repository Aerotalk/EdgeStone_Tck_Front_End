import { useEffect, useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const AIInsightPanel = () => {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const token = localStorage.getItem('token');
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : 'http://localhost:5000/api';
                const response = await axios.post(`${API_BASE_URL}/roadmap/analyze`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setInsight(response.data.insight);
            } catch (err) {
                console.error("Failed to fetch AI insights", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
        // Refresh insights every 5 minutes
        const interval = setInterval(fetchInsights, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute top-24 right-6 w-96 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-5 z-50">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-inner">
                    <Sparkles size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 font-outfit text-lg">Keery AI Insights</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Live Network Health Analysis</p>
                </div>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-300">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                        <Loader2 className="animate-spin text-purple-500" size={24} />
                        <span className="text-slate-500 animate-pulse text-xs">Keery is analyzing the roadmap...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800/30">
                        <AlertCircle size={16} />
                        <span>Analysis currently unavailable.</span>
                    </div>
                ) : insight ? (
                    <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-li:my-0.5">
                        <ReactMarkdown>{insight}</ReactMarkdown>
                    </div>
                ) : (
                    <span className="text-slate-500">No current insights. System appears idle.</span>
                )}
            </div>
        </div>
    );
};

export default AIInsightPanel;
