import React, { useState, useEffect } from 'react';
import { TicketReplyView } from './TicketReplyView';
import { Topbar } from '../../components/ui/Topbar';
import { SubHeader } from '../../components/ui/SubHeader';
import { type FilterType } from '../../components/ui/DatePickerDropdown';
import {
    Rows2,
    Columns2,
    CheckSquare,
    Filter,
    Loader2
} from 'lucide-react';
import { TicketCard } from '../../components/ui/TicketCard';
import { ticketService, type Ticket } from '../../services/ticketService';
import { useDashboardData } from '../../contexts/DashboardDataContext';

interface UITicket extends Ticket {
    name: string;
}

const TicketsPage: React.FC = () => {
    const { refresh: refreshDashboard } = useDashboardData();
    const [activeTab, setActiveTab] = useState('open');
    const [appliedFilter, setAppliedFilter] = useState<FilterType>('all');
    const [appliedCustomRange, setAppliedCustomRange] = useState({ start: '', end: '' });
    const [tickets, setTickets] = useState<UITicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const data = await ticketService.getAllTickets();

            // Map backend data to UI format if needed, but our Ticket interface matches closely enough
            // Backend returns 'header' as subject. TicketCard expects 'header'.
            // Backend returns 'ticketId' as friendly ID.
            // Backend 'date' is string.
            // We need to ensure 'name' exists. Backend ticket might not have name directly but from email parsing?
            // Wait, Backend Ticket model has email, but name?
            // In createTicketFromEmail, we didn't save name to Ticket model directly, only 'email'.
            // The 'name' in mock was 'CmF L2 Airtel'.
            // We might need to extract name or use email if name missing.
            // Let's check Ticket model again. It has 'email' and 'clientId' (relation).
            // For now, use email as name if name not available, or part of email.

            const formattedTickets = data.map(t => ({
                ...t,
                name: t.email.split('@')[0], // Fallback name
                status: t.status.toLowerCase(), // Ensure lowercase for tab matching
            }));

            setTickets(formattedTickets);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch tickets:', err);
            setError('Failed to load tickets. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("TicketsPage Mounted - Fetching tickets...");
        fetchTickets();

        // Optional: Poll for new tickets every 30s
        const interval = setInterval(fetchTickets, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleDateApply = (type: FilterType, range: { start: string; end: string }) => {
        setAppliedFilter(type);
        setAppliedCustomRange(range);
    };

    const tabs = [
        { id: 'open', label: 'Open', icon: Rows2 },
        { id: 'in-progress', label: 'In Progress', icon: Columns2 },
        { id: 'closed', label: 'Closed', icon: CheckSquare },
    ];

    const [selectedTicket, setSelectedTicket] = useState<UITicket | null>(null);

    const filteredTickets = tickets.filter(t => {
        // Status filter
        // Prefer locally-updated status (from reply view / dropdown) if present,
        // otherwise fall back to the backend-provided status.
        const persistedStatus = localStorage.getItem(`ticket_status_${t.id}`);
        const effectiveStatus = (persistedStatus || t.status || '').toLowerCase();

        const currentStatus = effectiveStatus.replace(' ', '-');
        // 'In Progress' / 'In progress' -> 'in-progress'
        // 'Open' -> 'open'

        if (!currentStatus || currentStatus !== activeTab) return false;

        // Date filter — all comparisons done in IST to avoid UTC midnight shift bugs.
        // We derive a comparable YYYY-MM-DD string in IST for both the ticket and today.
        const toISTDateString = (date: Date): string =>
            date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // 'en-CA' gives YYYY-MM-DD

        // Use createdAt ISO timestamp if available; fall back to t.date string
        const rawDate = t.createdAt || t.date;
        const ticketDateStr = toISTDateString(new Date(rawDate));
        const todayStr = toISTDateString(new Date());

        if (appliedFilter === 'all') return true;

        if (appliedFilter === 'today') {
            return ticketDateStr === todayStr;
        }

        if (appliedFilter === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return ticketDateStr === toISTDateString(yesterday);
        }

        if (appliedFilter === 'last7') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return ticketDateStr >= toISTDateString(sevenDaysAgo) && ticketDateStr <= todayStr;
        }

        if (appliedFilter === 'custom') {
            if (!appliedCustomRange.start || !appliedCustomRange.end) return true;
            return ticketDateStr >= appliedCustomRange.start && ticketDateStr <= appliedCustomRange.end;
        }

        return true;
    });

    if (selectedTicket) {
        return (
            <div className="flex flex-col h-full overflow-hidden bg-white">
                <TicketReplyView
                    ticket={selectedTicket}
                    onBack={() => {
                        setSelectedTicket(null);
                        fetchTickets(); // Refresh local list
                        refreshDashboard(); // Sync dashboard counts
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#F9FAFB]">
            <Topbar title="Tickets" searchPlaceholder="Search tickets..." />

            <SubHeader
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                appliedFilter={appliedFilter}
                appliedCustomRange={appliedCustomRange}
                onDateApply={handleDateApply}
            />

            <div className="px-4 sm:px-8 pb-8 flex-1 overflow-auto mt-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-red-500 font-medium mb-2">{error}</p>
                            <button
                                onClick={fetchTickets}
                                className="text-sm text-gray-600 hover:text-gray-900 underline"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : filteredTickets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTickets.map(ticket => (
                            <TicketCard
                                key={ticket.id}
                                name={ticket.name}
                                ticketId={ticket.ticketId}
                                email={ticket.email}
                                header={ticket.header}
                                date={ticket.date}
                                onReply={() => setSelectedTicket(ticket)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                            <Filter size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No tickets found</h3>
                        <p className="text-gray-500 max-w-xs"> There are no tickets in this category for the selected date range.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketsPage;
