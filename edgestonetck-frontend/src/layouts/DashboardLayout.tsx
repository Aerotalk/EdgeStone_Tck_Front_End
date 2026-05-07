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

    // Notifications Stream
    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const eventSource = new EventSource(`${apiBase}/api/notifications/stream`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'connected') return;

                // Show toast notification
                toast.success(data.message, {
                    duration: 5000,
                    icon: '🔔',
                    style: {
                        background: '#333',
                        color: '#fff',
                        borderRadius: '10px'
                    }
                });

                // Play Keery Voice (Male AI)
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(`Keery Notification: ${data.message}`);
                    
                    const setVoiceAndSpeak = () => {
                        const voices = window.speechSynthesis.getVoices();
                        // Try to find a male voice (often named Google UK English Male, David, etc.)
                        const maleVoice = voices.find(v => 
                            v.name.toLowerCase().includes('male') || 
                            v.name.toLowerCase().includes('david') || 
                            v.name.toLowerCase().includes('guy') ||
                            v.name.toLowerCase().includes('mark')
                        );
                        
                        if (maleVoice) {
                            utterance.voice = maleVoice;
                        }
                        
                        utterance.pitch = 0.8; // slightly deeper
                        utterance.rate = 1.0;
                        window.speechSynthesis.speak(utterance);
                    };

                    if (window.speechSynthesis.getVoices().length > 0) {
                        setVoiceAndSpeak();
                    } else {
                        window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
                    }
                }
            } catch (error) {
                console.error("Error parsing notification:", error);
            }
        };

        return () => {
            eventSource.close();
            if ('speechSynthesis' in window) {
                window.speechSynthesis.onvoiceschanged = null;
            }
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
