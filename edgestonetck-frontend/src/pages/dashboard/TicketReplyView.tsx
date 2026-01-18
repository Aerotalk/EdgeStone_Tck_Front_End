import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    Mail,
    ChevronDown,
    CornerUpLeft,
    Reply as ReplyIcon,
    MoreVertical,
    User,
    X
} from 'lucide-react';
import { TicketInfoSidebar } from './TicketInfoSidebar';

interface Ticket {
    id: string;
    name: string;
    ticketId: string;
    email: string;
    header: string;
    status: string;
    date?: string;
}

interface TicketReplyViewProps {
    ticket: Ticket;
    onBack: () => void;
}

export const TicketReplyView: React.FC<TicketReplyViewProps> = ({ ticket, onBack }) => {
    const [activeTab, setActiveTab] = useState<'client' | 'vendor'>('client');
    const [showCircuitModal, setShowCircuitModal] = useState(false);
    const [selectedCircuit, setSelectedCircuit] = useState('BA/SNG-TY2/ESPL-003');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [openDropdown, setOpenDropdown] = useState<'circuit' | 'priority' | null>(null);

    const [confirmedCircuit, setConfirmedCircuit] = useState(() => {
        return localStorage.getItem(`confirmed_circuit_id_${ticket.id}`) || '';
    });
    const [confirmedPriority, setConfirmedPriority] = useState(() => {
        return localStorage.getItem(`confirmed_priority_${ticket.id}`) || '';
    });

    const [ticketStatus, setTicketStatus] = useState(() => {
        return localStorage.getItem(`ticket_status_${ticket.id}`) || 'Open';
    });
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [closedAt, setClosedAt] = useState(() => {
        return localStorage.getItem(`ticket_closed_at_${ticket.id}`) || '';
    });

    // Check if circuit has been confirmed for this specific ticket
    // This is now implicitly handled by checking if status is 'Open'

    useEffect(() => {
        if (ticketStatus.toLowerCase() === 'open') {
            setShowCircuitModal(true);
        } else {
            setShowCircuitModal(false);
        }
    }, [ticketStatus]);

    const handleConfirm = () => {
        localStorage.setItem(`confirmed_circuit_${ticket.id}`, 'true');
        localStorage.setItem(`confirmed_circuit_id_${ticket.id}`, selectedCircuit);
        localStorage.setItem(`confirmed_priority_${ticket.id}`, selectedPriority);

        // Move to In Progress automatically on circuit confirmation
        const newStatus = 'In progress';
        localStorage.setItem(`ticket_status_${ticket.id}`, newStatus);
        setTicketStatus(newStatus);

        setConfirmedCircuit(selectedCircuit);
        setConfirmedPriority(selectedPriority);
        setShowCircuitModal(false);
    };

    const handleStatusChange = (newStatus: string) => {
        if (ticketStatus.toLowerCase() === 'closed') return;
        setTicketStatus(newStatus);
        localStorage.setItem(`ticket_status_${ticket.id}`, newStatus);

        if (newStatus.toLowerCase() === 'closed') {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hrs`;
            const fullStr = `${dateStr} • ${timeStr}`;
            setClosedAt(fullStr);
            localStorage.setItem(`ticket_closed_at_${ticket.id}`, fullStr);
        } else {
            setClosedAt('');
            localStorage.removeItem(`ticket_closed_at_${ticket.id}`);
        }

        setShowStatusDropdown(false);
    };

    const circuitOptions = [
        'BA/SNG-TY2/ESPL-003',
        'BA/SNG-CHK/ESPL-002',
        'BA/SNG-CHK/ESPL-004',
        'FPT/TY2-EquinixLA1/ESPL-005',
        'N1/LON-MUM/ESPL-006'
    ];

    const priorityOptions = [
        { label: 'High', color: 'text-red-500', bars: [true, true, true] },
        { label: 'Medium', color: 'text-orange-500', bars: [true, true, false] },
        { label: 'Low', color: 'text-green-500', bars: [true, false, false] }
    ];

    const PriorityIcon = ({ bars, type }: { bars: boolean[], type: 'High' | 'Medium' | 'Low' }) => (
        <div className="flex items-end gap-[2px] h-3.5 flex-shrink-0">
            {bars.map((active, i) => {
                let colorClass = 'bg-gray-100';
                if (active) {
                    if (type === 'High') colorClass = 'bg-[#EF4444]';
                    if (type === 'Medium') colorClass = 'bg-[#F59E0B]';
                    if (type === 'Low') colorClass = 'bg-[#22C55E]';
                }
                return (
                    <div
                        key={i}
                        className={`w-[3.5px] rounded-full transition-all duration-300 ${colorClass} ${i === 0 ? 'h-1.5' : i === 1 ? 'h-2.5' : 'h-3.5'}`}
                    />
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white relative font-sans">
            {/* Header Area */}
            <div className="flex flex-col border-b border-gray-100">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4 text-[18px] text-gray-500 font-medium whitespace-nowrap">
                        <button
                            onClick={onBack}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200"
                            title="Back to Tickets"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </button>
                        <div className="flex items-center gap-2">
                            <button onClick={onBack} className="hover:text-gray-900 transition-colors flex-shrink-0">Tickets</button>
                            <span className="flex-shrink-0">/</span>
                            <span className="text-gray-900 font-bold whitespace-nowrap">{ticket.header}</span>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => ticketStatus.toLowerCase() !== 'closed' && setShowStatusDropdown(!showStatusDropdown)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-bold border transition-all ${ticketStatus.toLowerCase() === 'closed'
                                ? 'bg-green-100/50 text-green-600 border-green-200/30 cursor-not-allowed'
                                : 'bg-orange-100/50 text-orange-600 border-orange-200/30 hover:bg-orange-100'
                                }`}
                        >
                            {ticketStatus}
                            {ticketStatus.toLowerCase() !== 'closed' && <ChevronDown size={14} />}
                        </button>

                        {showStatusDropdown && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => handleStatusChange('Closed')}
                                    className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-green-600 hover:bg-green-50 transition-colors flex items-center justify-between"
                                >
                                    Closed
                                </button>
                            </div>
                        )}

                        {/* Overlay to close dropdown */}
                        {showStatusDropdown && <div className="fixed inset-0 z-[105]" onClick={() => setShowStatusDropdown(false)} />}
                    </div>
                </div>

                <div className="flex items-center justify-between px-6">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => setActiveTab('client')}
                            className={`flex items-center gap-2 py-4 text-[14px] font-bold transition-all border-b-2 ${activeTab === 'client' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <User size={18} />
                            Client
                        </button>
                        <button
                            onClick={() => setActiveTab('vendor')}
                            className={`flex items-center gap-2 py-4 text-[14px] font-bold transition-all border-b-2 ${activeTab === 'vendor' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <User size={18} />
                            Vendor
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-[#F5F2F9] text-[#A688C4] text-[11px] font-bold px-2 py-1 rounded-md">
                        #{ticket.ticketId}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Conversation Area */}
                <div className="flex-1 flex flex-col p-8 space-y-6 overflow-y-auto bg-gray-50/30 scrollbar-hide">

                    {/* Message 1: Client Email */}
                    <div className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-[#E5DCC3] flex items-center justify-center text-[#5C5648] font-bold text-sm shadow-sm flex-shrink-0">
                            CL
                        </div>
                        <div className="flex-1">
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm relative">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[15px] font-bold text-gray-900">{ticket.name}</span>
                                            <span className="text-[14px] text-gray-400 font-medium">&lt;{ticket.email}&gt;</span>
                                        </div>
                                        <p className="text-[13px] text-gray-400 font-medium">To: support@edgestone.in</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-400">
                                        <span className="text-[13px] font-medium">19:00 hrs</span>
                                        <div className="flex items-center gap-2.5">
                                            <button className="hover:text-gray-600"><CornerUpLeft size={16} /></button>
                                            <button className="hover:text-gray-600"><ReplyIcon size={16} className="-scale-x-100" /></button>
                                            <button className="hover:text-gray-600"><MoreVertical size={16} /></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-[14px] text-gray-600 leading-relaxed font-medium space-y-4">
                                    <p>Dear Team,</p>
                                    <p>Kindly raise a TT for Link down issue. And share your observation.</p>
                                    <p>We observed the link to be down around 8:53 UTC today.</p>
                                    <p>{ticket.header.split('||')[1]?.trim() || 'Circuit ID Missing'}</p>
                                </div>
                                <div className="absolute left-[-17px] top-5 w-4 h-4 bg-white border-l border-b border-gray-100 rotate-45"></div>
                            </div>
                        </div>
                    </div>

                    <div className="ml-5 border-l-2 border-gray-100 py-1"></div>

                    {/* Message 2: Auto Reply */}
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#E5DCC3] flex items-center justify-center text-[#5C5648] font-bold text-sm shadow-sm flex-shrink-0">
                            N
                        </div>
                        <div className="flex-1">
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm relative">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[15px] font-bold text-gray-900">No-reply Edgestone</span>
                                            <span className="text-[14px] text-gray-400 font-medium">&lt;support@edgestone.in&gt;</span>
                                        </div>
                                        <p className="text-[13px] text-gray-400 font-medium">To: {ticket.email}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-400">
                                        <div className="flex items-center gap-2.5">
                                            <button className="hover:text-gray-600 rotate-180"><ReplyIcon size={16} /></button>
                                            <button className="hover:text-gray-600"><MoreVertical size={16} /></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-[14px] text-gray-600 leading-relaxed font-medium opacity-80">
                                    <p>Thank you for reaching out to us. We have received your ticket and our team will get back to you as soon as possible. Please note that this is an automated response and this email box is not be monitored.</p>
                                </div>
                                <div className="absolute left-[-17px] top-5 w-4 h-4 bg-white border-l border-b border-gray-100 rotate-45"></div>
                            </div>
                        </div>
                    </div>

                    {/* Lower Reply Button */}
                    <div className="pt-8">
                        <button className="flex items-center gap-2 px-6 py-2.5 border border-gray-900 rounded-lg text-[14px] font-bold text-gray-900 hover:bg-gray-50 transition-all active:scale-95">
                            <Mail size={16} />
                            Reply
                        </button>
                    </div>
                </div>

                <TicketInfoSidebar
                    ticket={ticket}
                    priority={confirmedPriority}
                    circuit={confirmedCircuit}
                    status={ticketStatus}
                    closedAt={closedAt}
                />
            </div>

            {showCircuitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0F172A]/20 backdrop-blur-[6px] animate-in fade-in duration-500">
                    <div className="bg-white rounded-[32px] w-full max-w-[480px] shadow-[0_32px_128px_-12px_rgba(15,23,42,0.25)] border border-gray-100/50 animate-in zoom-in-95 duration-300 relative">
                        <button
                            onClick={onBack}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all active:scale-90 z-20"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-10 pb-12">
                            <h3 className="text-[24px] font-bold text-gray-900 mb-8 tracking-tight">Select circuit id</h3>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                {/* Circuit Dropdown */}
                                <div className="relative group">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Circuit ID</label>
                                    <button
                                        onClick={() => setOpenDropdown(openDropdown === 'circuit' ? null : 'circuit')}
                                        className={`w-full h-[56px] border rounded-2xl px-4 flex items-center justify-between transition-all active:scale-[0.98] ${openDropdown === 'circuit' ? 'bg-white border-[#0F172A] ring-4 ring-[#0F172A]/5' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <span className={`text-[14px] font-bold truncate ${selectedCircuit ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {selectedCircuit || 'Select id'}
                                        </span>
                                        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${openDropdown === 'circuit' ? 'rotate-180 text-gray-900' : ''}`} />
                                    </button>

                                    {openDropdown === 'circuit' && (
                                        <>
                                            <div className="fixed inset-0 z-[110]" onClick={() => setOpenDropdown(null)} />
                                            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_60px_-12px_rgba(15,23,42,0.15)] z-[120] max-h-[320px] overflow-y-auto scrollbar-hide animate-in slide-in-from-top-2 duration-300">
                                                <div className="p-1.5">
                                                    {circuitOptions.map((opt) => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => { setSelectedCircuit(opt); setOpenDropdown(null); }}
                                                            className={`w-full px-3.5 py-3 text-left text-[13px] font-semibold rounded-xl transition-all flex items-center justify-between mb-0.5 last:mb-0 ${selectedCircuit === opt ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'}`}
                                                        >
                                                            <span className="truncate">{opt}</span>
                                                            {selectedCircuit === opt && <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />}
                                                        </button>
                                                    ))}
                                                    <div className="my-1.5 border-t border-gray-50" />
                                                    <button
                                                        onClick={() => { setSelectedCircuit('SPAM'); setOpenDropdown(null); }}
                                                        className={`w-full px-3.5 py-3 text-left text-[13px] font-bold rounded-xl transition-all ${selectedCircuit === 'SPAM' ? 'bg-red-50 text-red-600' : 'text-red-500 hover:bg-red-50'}`}
                                                    >
                                                        REPORT SPAM
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Priority Dropdown */}
                                <div className="relative group">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Priority</label>
                                    <button
                                        onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
                                        className={`w-full h-[56px] border rounded-2xl px-4 flex items-center justify-between transition-all active:scale-[0.98] ${openDropdown === 'priority' ? 'bg-white border-[#0F172A] ring-4 ring-[#0F172A]/5' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            {selectedPriority && (
                                                <PriorityIcon
                                                    bars={priorityOptions.find(o => o.label === selectedPriority)?.bars || []}
                                                    type={selectedPriority as any}
                                                />
                                            )}
                                            <span className={`text-[14px] font-bold truncate ${selectedPriority ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {selectedPriority || 'Set'}
                                            </span>
                                        </div>
                                        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ${openDropdown === 'priority' ? 'rotate-180 text-gray-900' : ''}`} />
                                    </button>

                                    {openDropdown === 'priority' && (
                                        <>
                                            <div className="fixed inset-0 z-[110]" onClick={() => setOpenDropdown(null)} />
                                            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_60px_-12px_rgba(15,23,42,0.15)] z-[120] animate-in slide-in-from-top-2 duration-300">
                                                <div className="p-1.5">
                                                    {priorityOptions.map((opt) => (
                                                        <button
                                                            key={opt.label}
                                                            onClick={() => { setSelectedPriority(opt.label); setOpenDropdown(null); }}
                                                            className={`w-full px-3.5 py-3 text-left text-[13.5px] font-bold rounded-xl flex items-center justify-between mb-0.5 last:mb-0 transition-all ${selectedPriority === opt.label ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <PriorityIcon bars={opt.bars} type={opt.label as any} />
                                                                {opt.label}
                                                            </div>
                                                            {selectedPriority === opt.label && <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleConfirm}
                                disabled={!selectedPriority}
                                className={`w-full h-[56px] bg-[#0F172A] text-white font-bold rounded-2xl text-[15px] shadow-[0_8px_32px_rgba(15,23,42,0.2)] transition-all active:scale-[0.97] ${!selectedPriority ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:bg-[#1E293B] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(15,23,42,0.3)]'}`}
                            >
                                Confirm and Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
