import React from 'react';
import { Search } from 'lucide-react';

interface TopbarProps {
    title: string;
    showSearch?: boolean;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
    title,
    showSearch = true,
    searchPlaceholder = "Search",
    onSearch
}) => {
    return (
        <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-4 sm:px-8 py-4 sm:py-6 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <h1 className="text-lg sm:text-xl font-bold text-gray-700 truncate sm:min-w-[120px]">{title}</h1>

            {showSearch && (
                <div className="relative flex-1 w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        onChange={(e) => onSearch?.(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-brand-red/30 focus:ring-4 focus:ring-brand-red/5 transition-all"
                    />
                </div>
            )}
        </div>
    );
};
