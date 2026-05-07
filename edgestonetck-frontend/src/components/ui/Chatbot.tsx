import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// Keery Avatar — used in header and message bubbles
const KeerySvg: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
    <img
        src="/assets/keery.png"
        alt="Keery"
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        onError={(e) => {
            // Fallback to initials if image fails
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = 'none';
        }}
    />
);

export const Chatbot: React.FC = () => {
    const { user } = useAuth();
    const token = user?.token;
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello! I'm Keery, your personal EdgeStone AI assistant. I can analyze tickets, compose emails, draft handover notes, and help you manage your tasks. How can I help you today?" }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || loading) return;

        const userMessage = message.trim();
        setMessage('');
        
        const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const response = await fetch(`${apiBase}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: newMessages.filter(m => m.role !== 'system'),
                    timezone: userTimezone
                })
            });

            if (!response.ok) {
                 throw new Error('Failed to connect to AI');
            }

            const data = await response.json();
            
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (err: any) {
            toast.error(err.message || 'AI service unavailable.');
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am currently unavailable. Please check your connection or API key.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right animate-in slide-in-from-bottom-2 fade-in">
                    {/* Header */}
                    <div className="bg-brand-red p-4 flex items-center justify-between text-white shadow-sm z-10">
                        <div className="flex items-center space-x-2.5">
                            <div className="w-9 h-9 rounded-full bg-white/20 ring-2 ring-white/40 overflow-hidden flex items-center justify-center flex-shrink-0">
                                <KeerySvg size={36} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-[15px] tracking-wide leading-tight">Keery</span>
                                <span className="text-[11px] text-white/70 font-medium leading-tight">EdgeStone AI Assistant</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Online indicator */}
                            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[11px] font-medium">Online</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-[#F9FAFB] flex flex-col space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex space-x-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0 mt-1 shadow-sm overflow-hidden ring-2 ring-brand-red/20">
                                        <KeerySvg size={32} />
                                    </div>
                                )}
                                <div 
                                    className={`p-3.5 rounded-2xl text-[14px] leading-relaxed max-w-[85%] shadow-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-gray-900 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                                    }`}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex space-x-2 justify-start">
                                <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0 mt-1 shadow-sm overflow-hidden ring-2 ring-brand-red/20">
                                    <KeerySvg size={32} />
                                </div>
                                <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm text-gray-500 border border-gray-100 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-brand-red" />
                                    <span className="text-[13px] font-medium">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <form
                            onSubmit={handleSubmit}
                            className="flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-brand-red focus-within:ring-2 focus-within:ring-brand-red/20 transition-all"
                        >
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ask Keery anything..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-[14px] py-1.5 placeholder-gray-400 font-medium text-gray-700"
                            />
                            <button
                                type="submit"
                                disabled={!message.trim() || loading}
                                className="p-2 bg-brand-red text-white rounded-full hover:bg-brand-red-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <Send className="w-4 h-4 translate-x-px translate-y-[-0.5px]" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Button — shows Keery avatar */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                title="Chat with Keery"
                className={`flex items-center justify-center w-14 h-14 bg-brand-red text-white rounded-full shadow-lg hover:scale-105 transition-all duration-300 z-50 overflow-hidden ring-4 ring-brand-red/30 ${isOpen ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100'}`}
                style={{
                    boxShadow: '0 10px 25px -5px rgba(242, 68, 68, 0.4), 0 8px 10px -6px rgba(242, 68, 68, 0.1)'
                }}
            >
                <KeerySvg size={56} className="w-full h-full" />
            </button>
        </div>
    );
};
