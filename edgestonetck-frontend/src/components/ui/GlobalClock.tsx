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
        <div className="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-2 sm:gap-3 bg-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl sm:rounded-full border-2 border-gray-200 shadow-sm text-xs sm:text-sm font-bold text-gray-700 w-max max-w-full overflow-x-auto scrollbar-hide">
            <Globe size={16} className="text-brand-red flex-shrink-0" />
            
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <span className="text-[10px] sm:text-[11px] text-gray-500 font-bold uppercase tracking-widest">IST</span>
                <span className="text-gray-900">{formatTime('Asia/Kolkata')}</span>
            </div>

            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mx-1 sm:mx-2 flex-shrink-0"></div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <span className="text-[10px] sm:text-[11px] text-gray-500 font-bold uppercase tracking-widest">UTC</span>
                <span className="text-gray-900">{formatTime('UTC')}</span>
            </div>

            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mx-1 sm:mx-2 flex-shrink-0"></div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <span className="text-[10px] sm:text-[11px] text-gray-500 font-bold uppercase tracking-widest">GMT</span>
                <span className="text-gray-900">{formatTime('GMT')}</span>
            </div>
        </div>
    );
};
