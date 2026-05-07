import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

export const GlobalClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const [gmtOffsetMs, setGmtOffsetMs] = useState(0);

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

    const getOffsetTime = (offsetMs: number) => {
        const t = new Date(time.getTime() + offsetMs);
        return new Intl.DateTimeFormat('en-US', {
            timeZone: 'UTC',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(t).toUpperCase();
    };

    const getInputValue = (offsetMs: number) => {
        const t = new Date(time.getTime() + offsetMs);
        return `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`;
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTimeStr = e.target.value;
        if (!newTimeStr) return;
        
        const [hours, minutes] = newTimeStr.split(':').map(Number);
        
        const now = new Date();
        const currentUtcSeconds = now.getUTCSeconds();
        
        const newTime = new Date(now.getTime());
        newTime.setUTCHours(hours, minutes, currentUtcSeconds, 0);
        
        setGmtOffsetMs(newTime.getTime() - now.getTime());
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
                <div className="relative flex items-center bg-gray-100 hover:bg-gray-200 transition-colors rounded-md px-1.5 py-0.5 cursor-pointer">
                    <span className="text-gray-900">{getOffsetTime(gmtOffsetMs)}</span>
                    <ChevronDown size={12} className="text-gray-500 ml-1.5 pointer-events-none" />
                    <input
                        type="time"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        value={getInputValue(gmtOffsetMs)}
                        onChange={handleTimeChange}
                        onClick={(e) => {
                            try {
                                if ('showPicker' in HTMLInputElement.prototype) {
                                    (e.target as HTMLInputElement).showPicker();
                                }
                            } catch (err) {}
                        }}
                    />
                </div>
            </div>
        </div>

    );
};
