import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right animate-in slide-in-from-bottom-2 fade-in">
                    {/* Header */}
                    <div className="bg-brand-red p-4 flex items-center justify-between text-white">
                        <div className="flex items-center space-x-2">
                            <Bot className="w-6 h-6" />
                            <span className="font-medium">AI Assistant</span>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-brand-red-hover rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="h-80 p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
                        {/* Initial Message */}
                        <div className="flex space-x-2">
                            <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700 max-w-[80%] border border-gray-100">
                                Hello! I'm your AI assistant. How can I help you today?
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <form 
                            onSubmit={(e) => { e.preventDefault(); setMessage(''); }}
                            className="flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red transition-all"
                        >
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm py-1"
                            />
                            <button
                                type="submit"
                                disabled={!message.trim()}
                                className="p-1.5 bg-brand-red text-white rounded-full hover:bg-brand-red-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-center w-14 h-14 bg-brand-red text-white rounded-full shadow-lg hover:bg-brand-red-hover hover:scale-105 transition-all duration-300 z-50 ${isOpen ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100'}`}
                style={{
                    boxShadow: '0 10px 25px -5px rgba(242, 68, 68, 0.4), 0 8px 10px -6px rgba(242, 68, 68, 0.1)'
                }}
            >
                <MessageSquare className="w-6 h-6" />
            </button>
        </div>
    );
};
