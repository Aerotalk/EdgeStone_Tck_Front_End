import React from 'react';
import { Mail, MessageSquare, Calendar } from 'lucide-react';

interface TicketCardProps {
    name: string;
    ticketId: string;
    email: string;
    header: string;
    date: string;
    onReply?: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
    name,
    ticketId,
    email,
    header,
    date,
    onReply
}) => {
    // Extract initials from name
    const getInitials = (fullName: string) => {
        const names = fullName.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return fullName.slice(0, 2).toUpperCase();
    };

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#E5DCC3] flex items-center justify-center text-[#5C5648] font-bold text-lg">
                    {getInitials(name)}
                </div>
                <h3 className="text-[17px] font-bold text-gray-900">{name}</h3>
            </div>

            <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                    <span className="inline-block bg-[#F5F2F9] text-[#A688C4] text-[12px] font-bold px-2 py-1 rounded-md">
                        #{ticketId}
                    </span>
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-400 uppercase">
                        <Calendar size={14} className="text-gray-300" />
                        {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <Mail size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-[14px] text-gray-700 underline decoration-gray-300 underline-offset-4 font-medium truncate">
                            {email}
                        </span>
                    </div>
                    <div className="flex items-start gap-3">
                        <MessageSquare size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-[14px] text-gray-400 font-medium line-clamp-1">
                            {header}
                        </span>
                    </div>
                </div>
            </div>

            <button
                onClick={onReply}
                className="w-full mt-2 py-2.5 border border-gray-900 rounded-xl flex items-center justify-center gap-2 text-[14px] font-bold text-gray-900 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
                <Mail size={16} strokeWidth={2.5} />
                Reply
            </button>
        </div>
    );
};
