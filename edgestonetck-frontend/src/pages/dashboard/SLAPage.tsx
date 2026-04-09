import React, { useState, useMemo, useEffect } from 'react';
import { Topbar } from '../../components/ui/Topbar';
import {
    Calendar,
    Clock,
    Upload,
    User,
    Building2,
    Filter,
    Info,
    X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { DatePickerDropdown, type FilterType } from '../../components/ui/DatePickerDropdown';
import { SLARulesModal } from '../../components/ui/SLARulesModal';

import { slaRecordService, type SLARecord } from '../../services/slaRecordService';

const SLAPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Client' | 'Vendor'>('Client');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSLARulesModalOpen, setIsSLARulesModalOpen] = useState(false);

    // Status modal
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean; recordId: string | null; newStatus: 'Breached' | 'Safe' | null; reason: string }>({
        isOpen: false,
        recordId: null,
        newStatus: null,
        reason: ''
    });

    // Managed Records
    const [records, setRecords] = useState<SLARecord[]>([]);

    const fetchRecords = async () => {
        try {
            const data = await slaRecordService.getAllSLARecords();
            setRecords(data);
        } catch (error) {
            console.error('Failed to load SLA records:', error);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    // Applied states (used for filtering the actual data)
    const [appliedFilter, setAppliedFilter] = useState<FilterType>('all');
    const [appliedCustomRange, setAppliedCustomRange] = useState({ start: '', end: '' });

    const calculateDowntime = (record: SLARecord) => {
        const startDt = new Date(`${record.displayStartDate} ${record.startTime.replace(' hrs', '')}`);
        const endDt = new Date(`${record.closeDate} ${record.closedTime.replace(' hrs', '')}`);
        if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) return '-';
        const diffMins = Math.round((endDt.getTime() - startDt.getTime()) / 60000);
        return `${diffMins} mins`;
    };

    const handleSaveStatus = async () => {
        if (!statusModal.reason.trim() || !statusModal.recordId || !statusModal.newStatus) {
            toast.error("Please provide a reason.");
            return;
        }

        try {
            await slaRecordService.updateSLARecordStatus(statusModal.recordId, statusModal.newStatus, statusModal.reason);
            // Re-fetch or manually update state
            setRecords(prev => prev.map(r => {
                if (r.id === statusModal.recordId) {
                    const updatedComp = statusModal.newStatus === 'Safe' ? '-' : r.compensation;
                    return { ...r, status: statusModal.newStatus!, statusReason: statusModal.reason, compensation: updatedComp };
                }
                return r;
            }));
            setStatusModal({ isOpen: false, recordId: null, newStatus: null, reason: '' });
            toast.success("Status updated successfully.");
        } catch (error) {
            console.error('Failed to save status', error);
            toast.error("Failed to update status. Please try again.");
        }
    };

    const handleDateApply = (type: FilterType, range: { start: string; end: string }) => {
        setAppliedFilter(type);
        setAppliedCustomRange(range);
    };

    const filteredData = useMemo(() => {
        return records.filter(item => {
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
    }, [appliedFilter, appliedCustomRange, searchQuery, records]);

    const handleExport = () => {
        if (filteredData.length === 0) return;

        // Define headers
        const headers = [
            'Ticket ID',
            'SLA Start Date',
            'SLA Start Time',
            'SLA Closed Time',
            'SLA Close Date',
            'Downtime (mins)',
            'SLA Status',
            'Status Reason',
            'Compensation'
        ];

        // Format data rows
        const rows = filteredData.map(record => [
            record.ticketId,
            record.displayStartDate,
            record.startTime,
            record.closedTime,
            record.closeDate,
            calculateDowntime(record),
            record.status,
            record.statusReason || '',
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

            {/* SLA Rules Button Bar */}
            <div className="bg-white border-b border-gray-50 flex-shrink-0 z-10">
                <div className="px-4 sm:px-8 flex items-center h-14">
                    <button
                        onClick={() => setIsSLARulesModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-[#d41c34] text-white rounded-xl text-sm font-bold transition-all active:scale-95"
                    >
                        SLA Rules
                    </button>
                </div>
            </div>

            {/* SLA Rules Modal */}
            <SLARulesModal
                isOpen={isSLARulesModalOpen}
                onClose={() => setIsSLARulesModalOpen(false)}
            />

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
                                            Downtime
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
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                            {calculateDowntime(record)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`relative flex items-center gap-1.5 px-3 py-1 rounded-full shadow-sm text-[12px] font-bold ${
                                                    (statusModal.isOpen && statusModal.recordId === record.id ? statusModal.newStatus || record.status : record.status) === 'Breached' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${(statusModal.isOpen && statusModal.recordId === record.id ? statusModal.newStatus || record.status : record.status) === 'Breached' ? 'bg-red-500' : 'bg-green-500'}`} />
                                                    <select
                                                        value={statusModal.isOpen && statusModal.recordId === record.id ? statusModal.newStatus || record.status : record.status}
                                                        onChange={(e) => {
                                                            setStatusModal({ isOpen: true, recordId: record.id, newStatus: e.target.value as 'Safe' | 'Breached', reason: '' });
                                                        }}
                                                        className={`bg-transparent cursor-pointer outline-none border-none appearance-none font-bold pr-1`}
                                                    >
                                                        <option value="Safe" className="text-green-600">Safe</option>
                                                        <option value="Breached" className="text-red-600">Breached</option>
                                                    </select>
                                                </div>
                                                {record.statusReason && (
                                                    <div className="relative group flex items-center justify-center cursor-help text-gray-400 hover:text-gray-600 transition-colors">
                                                        <Info size={16} />
                                                        {/* Custom Styled Tooltip */}
                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2.5 bg-gray-900 text-white text-xs font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-50 pointer-events-none text-center">
                                                            {record.statusReason}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
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

            {/* Status Reason Modal */}
            {statusModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Change Status Reason</h3>
                            <button 
                                onClick={() => setStatusModal({ isOpen: false, recordId: null, newStatus: null, reason: '' })}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 text-sm flex flex-col gap-4">
                            <p className="text-gray-600">
                                You are changing the status to <span className={`font-bold px-2 py-0.5 rounded text-[12px] ` + (statusModal.newStatus === 'Breached' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600')}>{statusModal.newStatus}</span>. Please provide a reason for this change.
                            </p>
                            <textarea
                                autoFocus
                                value={statusModal.reason}
                                onChange={(e) => setStatusModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Enter reason for this change..."
                                className="w-full h-32 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                            />
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setStatusModal({ isOpen: false, recordId: null, newStatus: null, reason: '' })}
                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveStatus}
                                disabled={!statusModal.reason.trim()}
                                className="px-6 py-2 bg-gradient-to-r from-brand-red to-[#d41c34] hover:from-[#d41c34] hover:to-[#c01830] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-red/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SLAPage;
