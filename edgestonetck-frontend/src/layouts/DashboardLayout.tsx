import React, { useEffect } from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Sidebar } from '../components/ui/Sidebar';
import { Chatbot } from '../components/ui/Chatbot';
import { Calculator } from '../components/ui/Calculator';
import { GlobalStickyNote } from '../components/ui/GlobalStickyNote';
import { useAuth } from '../contexts/AuthContext';
import { DashboardDataProvider } from '../contexts/DashboardDataContext';

const DashboardLayout: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, isLoading } = useAuth();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    useEffect(() => {
        document.title = 'EdgeStone - Dashboard';
    }, []);

    // Notifications Stream — with auto-reconnect & chime sound
    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        let eventSource: EventSource | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let retryDelay = 3000;

        const playChime = () => {
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
                frequencies.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = freq;
                    osc.type = 'sine';
                    const startTime = ctx.currentTime + i * 0.15;
                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
                    osc.start(startTime);
                    osc.stop(startTime + 0.4);
                });
            } catch (_) { /* AudioContext may be blocked before user interaction */ }
        };

        const speakNotification = (message: string) => {
            if (!('speechSynthesis' in window)) return;
            const utterance = new SpeechSynthesisUtterance(`Keery says: ${message}`);
            const setVoiceAndSpeak = () => {
                const voices = window.speechSynthesis.getVoices();
                const maleVoice = voices.find(v =>
                    v.name.toLowerCase().includes('male') ||
                    v.name.toLowerCase().includes('david') ||
                    v.name.toLowerCase().includes('guy') ||
                    v.name.toLowerCase().includes('mark')
                );
                if (maleVoice) utterance.voice = maleVoice;
                utterance.pitch = 0.85;
                utterance.rate = 1.0;
                window.speechSynthesis.speak(utterance);
            };
            if (window.speechSynthesis.getVoices().length > 0) {
                setVoiceAndSpeak();
            } else {
                window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
            }
        };

        const connect = () => {
            eventSource = new EventSource(`${apiBase}/api/notifications/stream`);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'connected') {
                        retryDelay = 3000; // Reset backoff on successful connect
                        return;
                    }

                    // Toast notification
                    toast.success(data.message, {
                        duration: 6000,
                        icon: '🔔',
                        style: { background: '#1e1e2e', color: '#fff', borderRadius: '12px', fontWeight: '600' }
                    });

                    // Chime + Voice
                    playChime();
                    speakNotification(data.message);

                } catch (error) {
                    console.error('[Keery] Error parsing notification:', error);
                }
            };

            eventSource.onerror = () => {
                eventSource?.close();
                // Reconnect with backoff (max 30s)
                retryDelay = Math.min(retryDelay * 1.5, 30000);
                reconnectTimer = setTimeout(connect, retryDelay);
            };
        };

        connect();

        return () => {
            eventSource?.close();
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // Wait for auth state to be restored from localStorage before redirecting
    if (isLoading) {
        return null;
    }

    // Check if user is authenticated and the ID matches
    if (!user || user.id !== id) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="h-screen w-full bg-white flex flex-col lg:flex-row font-sans selection:bg-brand-red selection:text-white overflow-hidden relative">
            <Sidebar
                agentName={user.name}
                isMobileOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <DashboardDataProvider>
                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    {/* Mobile Header */}
                    <header className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-gray-100 bg-white flex-shrink-0">
                        <img src="/assets/logo.png" alt="EdgeStone" className="h-8 w-auto" />
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-gray-500 hover:text-brand-red"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                    </header>

                    <main className="flex-1 overflow-y-auto bg-[#F9FAFB]">
                        <Outlet />
                    </main>
                </div>
            </DashboardDataProvider>
            
            <Calculator />
            <Chatbot />
            <GlobalStickyNote />
        </div>
    );
};

export default DashboardLayout;
