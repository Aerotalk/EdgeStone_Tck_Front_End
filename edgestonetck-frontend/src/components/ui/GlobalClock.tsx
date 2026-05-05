import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

export const GlobalClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const [selectedTimeZone, setSelectedTimeZone] = useState('GMT');

    const timeZones = [
        { label: 'GMT', value: 'GMT' },
        { label: 'EST', value: 'America/New_York' },
        { label: 'PST', value: 'America/Los_Angeles' },
        { label: 'CET', value: 'Europe/Paris' },
        { label: 'GST', value: 'Asia/Dubai' },
        { label: 'SGT', value: 'Asia/Singapore' },
        { label: 'AEST', value: 'Australia/Sydney' },
    ];

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
                <div className="relative flex items-center bg-gray-100 hover:bg-gray-200 transition-colors rounded-md px-1.5 py-0.5 cursor-pointer">
                    <select
                        className="text-[10px] sm:text-[11px] text-gray-500 font-bold uppercase tracking-widest bg-transparent border-none outline-none cursor-pointer appearance-none pr-3 z-10"
                        value={selectedTimeZone}
                        onChange={(e) => setSelectedTimeZone(e.target.value)}
                    >
                        {timeZones.map(tz => (
                            <option key={tz.value} value={tz.value} className="text-gray-900">{tz.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={10} className="text-gray-500 absolute right-1.5 pointer-events-none" />
                </div>
                <span className="text-gray-900">{formatTime(selectedTimeZone)}</span>
            </div>
        </div>

    );
};
