import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

export const GlobalClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Formatters
    const formatTime = (timeZone: string) => {
        return new Intl.DateTimeFormat('en-US', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(time).toUpperCase();
    };

    return (
        <div className="flex items-center gap-3 bg-gray-50/80 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm text-xs font-bold text-gray-500">
            <Globe size={14} className="text-gray-400" />
            
            <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">IST</span>
                <span className="text-gray-700">{formatTime('Asia/Kolkata')}</span>
            </div>

            <div className="w-1 h-1 rounded-full bg-gray-300 mx-1"></div>

            <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">UTC</span>
                <span className="text-gray-700">{formatTime('UTC')}</span>
            </div>

            <div className="w-1 h-1 rounded-full bg-gray-300 mx-1"></div>

            <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">GMT</span>
                <span className="text-gray-700">{formatTime('GMT')}</span>
            </div>
        </div>
    );
};
