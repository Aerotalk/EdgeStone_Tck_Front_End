import React, { useState, useEffect } from 'react';
import { ChevronUp, Ticket as TicketIcon, X, Send, Trash2, CheckCircle, Plus, Calendar, Clock } from 'lucide-react';
import { useParams } from 'react-router-dom';

const SUPPORT_AGENTS = [
    { id: 'agent-1', name: 'Soumyajit' },
    { id: 'agent-2', name: 'Priyanshu' }
];

interface Note {
    text: string;
    time: string;
    author: string;
}

interface TicketInfoSidebarProps {
    ticket: {
        id: string;
        name: string;
        ticketId: string;
        email: string;
        header: string;
        status: string;
        date?: string;
    };
    priority?: string;
    circuit?: string;
    status?: string;
    closedAt?: string;
}

export const TicketInfoSidebar: React.FC<TicketInfoSidebarProps> = ({ ticket, priority, circuit, status, closedAt }) => {
    const { id } = useParams();
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');

    // SLA Close states
    const [slaCloseDate, setSlaCloseDate] = useState(() => localStorage.getItem(`sla_close_date_${ticket.id}`) || '');
    const [slaCloseTime, setSlaCloseTime] = useState(() => localStorage.getItem(`sla_close_time_${ticket.id}`) || '');

    // Modal states
    const [showDateModal, setShowDateModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [tempDate, setTempDate] = useState('');
    const [tempTime, setTempTime] = useState('');

    const currentAgentName = SUPPORT_AGENTS.find(a => a.id === id)?.name || 'Agent';

    useEffect(() => {
        const savedNotes = localStorage.getItem(`ticket_notes_${ticket.id}`);
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        } else {
            setNotes([]);
        }
    }, [ticket.id]);

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hrs`;
        const updatedNotes: Note[] = [...notes, { text: newNote.trim(), time: timeStr, author: currentAgentName }];
        setNotes(updatedNotes);
        localStorage.setItem(`ticket_notes_${ticket.id}`, JSON.stringify(updatedNotes));
        setNewNote('');
    };

    const handleDeleteNote = (index: number) => {
        const updatedNotes = notes.filter((_, i) => i !== index);
        setNotes(updatedNotes);
        localStorage.setItem(`ticket_notes_${ticket.id}`, JSON.stringify(updatedNotes));
    };

    const handleSaveDate = () => {
        setSlaCloseDate(tempDate);
        localStorage.setItem(`sla_close_date_${ticket.id}`, tempDate);
        setShowDateModal(false);
    };

    const handleSaveTime = () => {
        setSlaCloseTime(tempTime);
        localStorage.setItem(`sla_close_time_${ticket.id}`, tempTime);
        setShowTimeModal(false);
    };

    return (
        <div className="w-92 border-l border-gray-100 bg-white hidden lg:flex flex-col h-full font-sans shrink-0 relative">
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {/* Profile Section */}
                <div className="p-8 border-b border-gray-50">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-16 h-16 rounded-full bg-[#E5DCC3] flex items-center justify-center text-[#5C5648] font-bold text-2xl shadow-sm">
                            {ticket.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <h3 className="text-[20px] font-bold text-gray-900 leading-tight">{ticket.name}</h3>
                    </div>

                    <div className="space-y-5">
                        <div className="flex justify-between items-center text-[14px]">
                            <span className="text-gray-400 font-medium">Profile</span>
                            <span className="text-gray-600 font-bold">Customer</span>
                        </div>
                        <div className="flex justify-between items-center text-[14px]">
                            <span className="text-gray-400 font-medium">Date</span>
                            <span className="text-gray-600 font-bold">{ticket.date || '6th Jun, 2025'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[14px]">
                            <span className="text-gray-400 font-medium">Time</span>
                            <span className="text-gray-600 font-bold">19:00hrs</span>
                        </div>
                        <div className="flex justify-between items-center text-[14px]">
                            <span className="text-gray-400 font-medium">Priority</span>
                            <span className={`font-bold ${priority ? 'text-gray-900' : 'text-gray-600'}`}>
                                {priority || '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* SLA Calculator Section */}
                <div className="p-8 border-b border-gray-50">
                    <h4 className="text-[14px] font-bold text-gray-900 mb-6 tracking-tight">SLA calculator</h4>
                    <div className="space-y-4">
                        <div className={`text-[14px] font-medium pb-1 cursor-pointer transition-colors ${circuit ? 'text-gray-900 font-bold' : 'text-gray-700 hover:text-gray-900'}`}>
                            {circuit || 'Select circuit'}
                        </div>
                        <div className="flex justify-between items-center text-[14px]">
                            <span className="text-gray-400 font-medium">SLA starts at</span>
                            <span className="text-gray-600 font-bold">19:01 hrs</span>
                        </div>
                        <div className="flex justify-between items-center text-[14px]">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 font-medium">SLA close at</span>
                                <button
                                    onClick={() => { setTempTime(slaCloseTime); setShowTimeModal(true); }}
                                    className="p-1 hover:bg-orange-50 rounded-full text-orange-400 hover:text-orange-600 transition-all border border-transparent hover:border-orange-100 shadow-sm hover:shadow active:scale-90"
                                >
                                    <Plus size={12} strokeWidth={3} />
                                </button>
                            </div>
                            <span className={`text-[14px] font-bold ${slaCloseTime ? 'text-gray-900' : 'text-gray-600'}`}>
                                {slaCloseTime ? `${slaCloseTime} hrs` : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[14px]">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 font-medium">SLA close date</span>
                                <button
                                    onClick={() => { setTempDate(slaCloseDate); setShowDateModal(true); }}
                                    className="p-1 hover:bg-orange-50 rounded-full text-orange-400 hover:text-orange-600 transition-all border border-transparent hover:border-orange-100 shadow-sm hover:shadow active:scale-90"
                                >
                                    <Plus size={12} strokeWidth={3} />
                                </button>
                            </div>
                            <span className={`text-[14px] font-bold ${slaCloseDate ? 'text-gray-900' : 'text-gray-600'}`}>
                                {slaCloseDate || '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Activity Log Section */}
                <div className="p-8 space-y-8">
                    <h4 className="text-[14px] font-bold text-gray-900 mb-6 tracking-tight">Activity log</h4>

                    {status?.toLowerCase() === 'closed' && (
                        <div className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-500">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 flex-shrink-0">
                                <CheckCircle size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-[13px] font-bold text-gray-900">Ticket closed</span>
                                    <span className="text-[12px] font-medium text-gray-400">{closedAt || 'Current hrs'}</span>
                                </div>
                                <p className="text-[11px] text-green-500 font-bold">Ticket resolution confirmed</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F5F2F9] flex items-center justify-center text-[#A688C4] flex-shrink-0">
                            <TicketIcon size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[13px] font-bold text-gray-900">Ticket raise</span>
                                <span className="text-[12px] font-medium text-gray-400">19:00 hrs</span>
                            </div>
                            <p className="text-[11px] text-[#A688C4] font-bold">Ticket #{ticket.ticketId} created</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Notes Footer */}
            <div className="px-6 pb-6 relative">
                {/* Notes Container */}
                {isNotesOpen && (
                    <div className="absolute bottom-full left-6 right-6 mb-3 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col z-50 animate-in slide-in-from-bottom-2 duration-300">
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between bg-white">
                            <h5 className="text-[13px] font-bold text-gray-900">Notes</h5>
                            <button
                                onClick={() => setIsNotesOpen(false)}
                                className="p-1 hover:bg-gray-50 rounded-lg transition-colors text-gray-400"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* List - "Different Box" 1 */}
                        <div className="max-h-[220px] overflow-y-auto p-4 space-y-3 bg-[#FCFCFD]">
                            {notes.length > 0 ? (
                                notes.map((note, i) => (
                                    <div key={i} className="group relative">
                                        <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-red-100 transition-colors">
                                            <p className="text-[12px] text-gray-600 font-medium leading-relaxed break-words whitespace-pre-wrap pr-4">{note.text}</p>
                                            <div className="mt-2 flex justify-between items-center">
                                                <button
                                                    onClick={() => handleDeleteNote(i)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete note"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-orange-500/70">{note.author || 'Agent'}</span>
                                                    <span className="text-[10px] font-bold text-gray-400">{note.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 flex flex-col items-center justify-center text-center opacity-40">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-2">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">No notes yet</p>
                                </div>
                            )}
                        </div>

                        {/* Input Area - "Different Box" 2 */}
                        <div className="p-4 bg-white border-t border-gray-50">
                            <div className="relative group">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Add a private note..."
                                    className="w-full min-h-[80px] p-3 bg-gray-50/50 border border-gray-100 rounded-xl text-[12px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-orange-200 focus:bg-white transition-all resize-none scrollbar-hide break-words"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddNote();
                                        }
                                    }}
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!newNote.trim()}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all shadow-sm ${newNote.trim() ? 'bg-orange-500 text-white hover:bg-orange-600 scale-100' : 'bg-gray-100 text-gray-300 scale-95 cursor-not-allowed'}`}
                                    >
                                        <span className="text-[11px] font-bold">Add note</span>
                                        <Send size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setIsNotesOpen(!isNotesOpen)}
                    className={`w-full flex items-center justify-between px-5 py-4 bg-[#FFF9F1] text-[#B87C3D] rounded-xl font-bold text-[14px] hover:bg-[#FFF4E4] transition-all border border-transparent active:scale-[0.98] outline-none group ${isNotesOpen ? 'border-orange-200 shadow-sm' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 flex items-center justify-center opacity-80 relative">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </div>
                        <span className="relative">
                            Create notes
                            {notes.length > 0 && (
                                <span className="absolute -right-7 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full shadow-sm ring-2 ring-[#FFF9F1] animate-in zoom-in duration-300">
                                    {notes.length}
                                </span>
                            )}
                        </span>
                    </div>
                    <ChevronUp size={16} className={`opacity-60 transition-transform duration-300 ${isNotesOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Set Time Modal */}
            {showTimeModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0F172A]/20 backdrop-blur-[6px] animate-in fade-in duration-500">
                    <div className="bg-white rounded-[32px] w-full max-w-[400px] shadow-[0_32px_128px_-12px_rgba(15,23,42,0.25)] border border-gray-100/50 p-10 animate-in zoom-in-95 duration-300 relative">
                        <button onClick={() => setShowTimeModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all">
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                                <Clock size={32} />
                            </div>
                            <h3 className="text-[24px] font-bold text-gray-900 mb-2 tracking-tight">Set SLA Time</h3>
                            <p className="text-[14px] text-gray-500 mb-8 font-medium">Please enter the closure time</p>

                            <div className="w-full mb-8 group">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-left px-1">Time (24h format)</label>
                                <input
                                    type="time"
                                    value={tempTime}
                                    onChange={(e) => setTempTime(e.target.value)}
                                    className="w-full h-[56px] border border-gray-100 bg-gray-50/50 rounded-2xl px-6 text-[16px] font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all"
                                />
                            </div>

                            <button
                                onClick={handleSaveTime}
                                className="w-full h-[56px] bg-[#0F172A] text-white font-bold rounded-2xl text-[15px] shadow-[0_8px_32px_rgba(15,23,42,0.2)] hover:bg-[#1E293B] hover:-translate-y-0.5 transition-all active:scale-95"
                            >
                                Confirm Time
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Set Date Modal */}
            {showDateModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0F172A]/20 backdrop-blur-[6px] animate-in fade-in duration-500">
                    <div className="bg-white rounded-[32px] w-full max-w-[400px] shadow-[0_32px_128px_-12px_rgba(15,23,42,0.25)] border border-gray-100/50 p-10 animate-in zoom-in-95 duration-300 relative">
                        <button onClick={() => setShowDateModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all">
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-[24px] font-bold text-gray-900 mb-2 tracking-tight">Set SLA Date</h3>
                            <p className="text-[14px] text-gray-500 mb-8 font-medium">Please select the closure date</p>

                            <div className="w-full mb-8 group">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-left px-1">Select Date</label>
                                <input
                                    type="date"
                                    value={tempDate}
                                    onChange={(e) => setTempDate(e.target.value)}
                                    className="w-full h-[56px] border border-gray-100 bg-gray-50/50 rounded-2xl px-6 text-[16px] font-bold text-gray-900 outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 focus:bg-white transition-all"
                                />
                            </div>

                            <button
                                onClick={handleSaveDate}
                                className="w-full h-[56px] bg-[#0F172A] text-white font-bold rounded-2xl text-[15px] shadow-[0_8px_32px_rgba(15,23,42,0.2)] hover:bg-[#1E293B] hover:-translate-y-0.5 transition-all active:scale-95"
                            >
                                Confirm Date
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
