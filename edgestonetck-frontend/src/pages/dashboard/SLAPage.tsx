import React, { useState, useMemo } from 'react';
import { Topbar } from '../../components/ui/Topbar';
import {
    Calendar,
    Clock,
    Upload,
    User,
    Building2,
    Filter
} from 'lucide-react';

import { DatePickerDropdown, type FilterType } from '../../components/ui/DatePickerDropdown';

interface SLARecord {
    id: string;
    ticketId: string;
    startDate: string; // YYYY-MM-DD
    displayStartDate: string;
    startTime: string;
    closedTime: string;
    closeDate: string;
    status: 'Breached' | 'Safe';
    compensation: string;
}

const mockSLAData: SLARecord[] = [
    {
        id: '1',
        ticketId: '#3234',
        startDate: '2026-01-09',
        displayStartDate: '09 Jan 2026',
        startTime: '19:00 hrs',
        closedTime: '20:00 hrs',
        closeDate: '09 Jan 2026',
        status: 'Breached',
        compensation: '$2,543'
    },
    {
        id: '2',
        ticketId: '#3245',
        startDate: '2026-01-08',
        displayStartDate: '08 Jan 2026',
        startTime: '10:00 hrs',
        closedTime: '11:30 hrs',
        closeDate: '08 Jan 2026',
        status: 'Safe',
        compensation: '-'
    },
    {
        id: '3',
        ticketId: '#3256',
        startDate: '2026-01-05',
        displayStartDate: '05 Jan 2026',
        startTime: '14:00 hrs',
        closedTime: '18:00 hrs',
        closeDate: '05 Jan 2026',
        status: 'Breached',
        compensation: '$2,543'
    },
    {
        id: '4',
        ticketId: '#3190',
        startDate: '2025-12-20',
        displayStartDate: '20 Dec 2025',
        startTime: '09:00 hrs',
        closedTime: '10:00 hrs',
        closeDate: '20 Dec 2025',
        status: 'Breached',
        compensation: '$2,543'
    }
];

const SLAPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Client' | 'Vendor'>('Client');
    const [searchQuery, setSearchQuery] = useState('');

    // Applied states (used for filtering the actual data)
    const [appliedFilter, setAppliedFilter] = useState<FilterType>('all');
    const [appliedCustomRange, setAppliedCustomRange] = useState({ start: '', end: '' });

    const handleDateApply = (type: FilterType, range: { start: string; end: string }) => {
        setAppliedFilter(type);
        setAppliedCustomRange(range);
    };

    const filteredData = useMemo(() => {
        return mockSLAData.filter(item => {
            // Search filter
            if (searchQuery && !item.ticketId.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            const itemDate = new Date(item.startDate);
            const today = new Date('2026-01-09'); // Using mock "today"

            if (appliedFilter === 'all') return true;

            if (appliedFilter === 'today') {
                return item.startDate === '2026-01-09';
            }

            if (appliedFilter === 'yesterday') {
                return item.startDate === '2026-01-08';
            }

            if (appliedFilter === 'last7') {
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);
                return itemDate >= sevenDaysAgo && itemDate <= today;
            }

            if (appliedFilter === 'custom') {
                if (!appliedCustomRange.start || !appliedCustomRange.end) return true;
                const start = new Date(appliedCustomRange.start);
                const end = new Date(appliedCustomRange.end);
                return itemDate >= start && itemDate <= end;
            }

            return true;
        });
    }, [appliedFilter, appliedCustomRange, searchQuery]);

    const handleExport = () => {
        if (filteredData.length === 0) return;

        // Define headers
        const headers = [
            'Ticket ID',
            'SLA Start Date',
            'SLA Start Time',
            'SLA Closed Time',
            'SLA Close Date',
            'SLA Status',
            'Compensation'
        ];

        // Format data rows
        const rows = filteredData.map(record => [
            record.ticketId,
            record.displayStartDate,
            record.startTime,
            record.closedTime,
            record.closeDate,
            record.status,
            record.compensation
        ]);

        // Combine into CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `SLA_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#F9FAFB]">
            <Topbar title="SLA" showSearch={true} searchPlaceholder="Search by ticket id..." onSearch={(q) => setSearchQuery(q)} />

            {/* Custom Sub-Header */}
            <div className="bg-white border-b border-gray-100 flex-shrink-0 z-10">
                <div className="px-4 sm:px-8 flex items-center justify-between h-14 sm:h-16">
                    {/* Tabs */}
                    <div className="flex items-center gap-8 h-full">
                        <button
                            onClick={() => setActiveTab('Client')}
                            className={`flex items-center gap-2 h-full px-1 text-[14px] font-bold transition-all relative ${activeTab === 'Client'
                                ? 'text-gray-900 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-red'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <User size={18} strokeWidth={activeTab === 'Client' ? 2.5 : 2} />
                            Client
                        </button>
                        <button
                            onClick={() => setActiveTab('Vendor')}
                            className={`flex items-center gap-2 h-full px-1 text-[14px] font-bold transition-all relative ${activeTab === 'Vendor'
                                ? 'text-gray-900 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-red'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Building2 size={18} strokeWidth={activeTab === 'Vendor' ? 2.5 : 2} />
                            Vendor
                        </button>
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-3 relative">
                        <button
                            onClick={handleExport}
                            className="w-9 h-9 flex items-center justify-center bg-[#FFB347] hover:bg-[#FFA327] text-white rounded-lg transition-all shadow-md shadow-orange-100 active:scale-95"
                            title="Export to Excel"
                        >
                            <Upload size={18} strokeWidth={2.5} />
                        </button>

                        <DatePickerDropdown
                            appliedFilter={appliedFilter}
                            appliedCustomRange={appliedCustomRange}
                            onApply={handleDateApply}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto px-4 sm:px-8 py-6">
                {/* Table Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                                            Ticket id
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                                            SLA start date
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                                            SLA start time
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                                            SLA closed time
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                                            SLA close date
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                                            SLA Status
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">
                                        <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                                            Compensation
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? filteredData.map((record) => (
                                    <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <a href="#" className="text-sm font-bold text-gray-900 hover:text-brand-red underline decoration-gray-300 underline-offset-4">
                                                {record.ticketId}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <Calendar size={14} />
                                                </div>
                                                {record.displayStartDate}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <Clock size={14} />
                                                </div>
                                                {record.startTime}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <Clock size={14} />
                                                </div>
                                                {record.closedTime}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <Calendar size={14} />
                                                </div>
                                                {record.closeDate}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold shadow-sm ${record.status === 'Breached'
                                                ? 'bg-red-50 text-red-600'
                                                : 'bg-green-50 text-green-600'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${record.status === 'Breached' ? 'bg-red-500' : 'bg-green-500'
                                                    }`} />
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                            {record.compensation}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400 font-sans">
                                                <Filter size={48} strokeWidth={1} className="text-gray-200" />
                                                <p className="font-bold text-lg">No records matched your filter</p>
                                                <p className="text-sm">Try selecting a different date range or clearing the filter.</p>
                                                <button
                                                    onClick={() => {
                                                        setAppliedFilter('all');
                                                        setAppliedCustomRange({ start: '', end: '' });
                                                    }}
                                                    className="mt-2 px-6 py-2 bg-brand-red/10 text-brand-red text-sm font-bold rounded-xl hover:bg-brand-red/15 transition-all"
                                                >
                                                    Reset all filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SLAPage;
