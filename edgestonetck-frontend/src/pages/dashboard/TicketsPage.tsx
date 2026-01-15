import React, { useState } from 'react';
import { TicketReplyView } from './TicketReplyView';
import { Topbar } from '../../components/ui/Topbar';
import { SubHeader } from '../../components/ui/SubHeader';
import { type FilterType } from '../../components/ui/DatePickerDropdown';
import {
    Rows2,
    Columns2,
    CheckSquare,
    Filter
} from 'lucide-react';

import { TicketCard } from '../../components/ui/TicketCard';

const mockTickets = [
    {
        id: 'tk1_v2',
        name: 'CmF L2 Airtel',
        ticketId: '5656',
        email: 'Cmf.L2@airtel.com',
        header: '37622099 || BA/SNG - TY2/ESPL-003',
        status: 'open',
        date: '2026-01-15'
    },
    {
        id: 'tk2',
        name: 'John Doe',
        ticketId: '5657',
        email: 'john.doe@example.com',
        header: '12345678 || NY/JFK - LDN/EXP-001',
        status: 'open',
        date: '2026-01-15'
    },
    {
        id: 'tk3',
        name: 'Sarah Smith',
        ticketId: '5658',
        email: 'sarah.s@techcorp.io',
        header: '98765432 || SF/SFO - TOK/HND-002',
        status: 'open',
        date: '2026-01-14'
    },
    {
        id: 'tk4',
        name: 'Robert Brown',
        ticketId: '5659',
        email: 'r.brown@global.net',
        header: '45678912 || CH/ORD - PAR/CDG-003',
        status: 'open',
        date: '2026-01-13'
    },
    {
        id: 'tk5',
        name: 'Alice Cooper',
        ticketId: '5660',
        email: 'alice.c@mediasolutions.com',
        header: '54321678 || LA/LAX - SYD/SYD-004',
        status: 'open',
        date: '2026-01-10'
    },
    {
        id: 'tk6',
        name: 'Michael Jordan',
        ticketId: '5661',
        email: 'm.jordan@bulls.com',
        header: '11223344 || CH/ORD - MIA/MIA-005',
        status: 'open',
        date: '2025-12-25'
    },
    {
        id: 'tk7',
        name: 'Emma Watson',
        ticketId: '5662',
        email: 'emma.w@books.co.uk',
        header: '99887766 || LD/LHR - EDI/EDI-006',
        status: 'open',
        date: '2025-12-20'
    }
];

const TicketsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('open');
    const [appliedFilter, setAppliedFilter] = useState<FilterType>('all');
    const [appliedCustomRange, setAppliedCustomRange] = useState({ start: '', end: '' });

    const handleDateApply = (type: FilterType, range: { start: string; end: string }) => {
        setAppliedFilter(type);
        setAppliedCustomRange(range);
    };

    const tabs = [
        { id: 'open', label: 'Open', icon: Rows2 },
        { id: 'in-progress', label: 'In Progress', icon: Columns2 },
        { id: 'closed', label: 'Closed', icon: CheckSquare },
    ];

    const [selectedTicket, setSelectedTicket] = useState<(typeof mockTickets)[0] | null>(null);

    const filteredTickets = mockTickets.filter(t => {
        // Status filter
        const persistedStatus = localStorage.getItem(`ticket_status_${t.id}`);
        const currentStatus = persistedStatus ? persistedStatus.toLowerCase().replace(' ', '-') : t.status;
        if (currentStatus !== activeTab) return false;

        // Date filter
        const ticketDate = new Date(t.date);
        const today = new Date('2026-01-15'); // Current system date
        today.setHours(0, 0, 0, 0);

        if (appliedFilter === 'all') return true;

        if (appliedFilter === 'today') {
            return t.date === '2026-01-15';
        }

        if (appliedFilter === 'yesterday') {
            return t.date === '2026-01-14';
        }

        if (appliedFilter === 'last7') {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            return ticketDate >= sevenDaysAgo && ticketDate <= today;
        }

        if (appliedFilter === 'custom') {
            if (!appliedCustomRange.start || !appliedCustomRange.end) return true;
            const start = new Date(appliedCustomRange.start);
            const end = new Date(appliedCustomRange.end);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return ticketDate >= start && ticketDate <= end;
        }

        return true;
    });

    if (selectedTicket) {
        return (
            <div className="flex flex-col h-full overflow-hidden bg-white">
                <TicketReplyView
                    ticket={selectedTicket}
                    onBack={() => setSelectedTicket(null)}
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
                {filteredTickets.length > 0 ? (
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
