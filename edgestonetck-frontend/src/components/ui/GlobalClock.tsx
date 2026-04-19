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
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border-2 border-gray-200 shadow-md text-sm font-bold text-gray-700">
            <Globe size={16} className="text-brand-red" />
            
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">IST</span>
                <span className="text-gray-900">{formatTime('Asia/Kolkata')}</span>
            </div>

            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mx-2"></div>

            <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">UTC</span>
                <span className="text-gray-900">{formatTime('UTC')}</span>
            </div>

            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mx-2"></div>

            <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">GMT</span>
                <span className="text-gray-900">{formatTime('GMT')}</span>
            </div>
        </div>
    );
};
