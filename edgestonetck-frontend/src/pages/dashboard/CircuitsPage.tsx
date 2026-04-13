import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '../../components/ui/Topbar';
import { Plus, Check, X, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { circuitService } from '../../services/circuitService';
import type { Circuit } from '../../services/circuitService';
import { vendorService } from '../../services/vendorService';
import type { Vendor } from '../../services/vendorService';
import { clientService } from '../../services/clientService';
import type { Client } from '../../services/clientService';

const CircuitsPage: React.FC = () => {
    const navigate = useNavigate();
    const { isSuperAdmin } = useAuth();
    
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Circuit Added Successfully');
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Add form data
    const [customerCircuitId, setCustomerCircuitId] = useState('');
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [circuitType, setCircuitType] = useState<'PROTECTED' | 'UNPROTECTED'>('UNPROTECTED');

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [circuitsData, vendorsData, clientsData] = await Promise.all([
                circuitService.getAllCircuits(),
                vendorService.getAllVendors(),
                clientService.getAllClients()
            ]);
            setCircuits(circuitsData);
            setVendors(vendorsData);
            setClients(clientsData);
        } catch (error: any) {
            console.error('Failed to fetch data:', error);
            if (error.message === 'Unauthorized') {
                localStorage.removeItem('edgestone_user');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredCircuits = circuits.filter(circuit => {
        const query = searchQuery.toLowerCase();
        return (
            circuit.customerCircuitId.toLowerCase().includes(query) ||
            circuit.vendor?.name?.toLowerCase().includes(query) ||
            circuit.client?.name?.toLowerCase().includes(query)
        );
    });

    const handleAddCircuit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerCircuitId) return;

        try {
            setSubmitting(true);
            await circuitService.createCircuit({
                customerCircuitId,
                vendorId: selectedVendorId || null,
                clientId: selectedClientId || null,
                type: circuitType
            });
            await fetchData();
            setIsAddModalOpen(false);
            
            // reset form
            setCustomerCircuitId('');
            setSelectedVendorId('');
            setSelectedClientId('');
            setCircuitType('UNPROTECTED');

            setSuccessMessage('Circuit Added Successfully');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error: any) {
            console.error('Failed to create circuit:', error);
            if (error.message === 'Unauthorized') {
                localStorage.removeItem('edgestone_user');
                navigate('/login');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#F9FAFB] relative transition-all duration-500">
            <style>{`
                @keyframes gradual-fade {
                    0% { opacity: 0; transform: translate(-50%, -15px); }
                    15% { opacity: 1; transform: translate(-50%, 0); }
                    85% { opacity: 1; transform: translate(-50%, 0); }
                    100% { opacity: 0; transform: translate(-50%, -15px); }
                }
                .animate-gradual {
                    animation: gradual-fade 2s ease-in-out forwards;
                }
            `}</style>

            <Topbar
                title="Circuits"
                searchPlaceholder="Search circuits by ID, vendor or client..."
                onSearch={(query) => setSearchQuery(query)}
            />

            {showSuccess && (
                <div className="absolute top-[72px] left-1/2 -translate-x-[50%] z-50 animate-gradual">
                    <div className="bg-white px-8 py-3 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            <Check size={18} className="text-white" strokeWidth={3.5} />
                        </div>
                        <span className="text-sm font-bold text-gray-800 tracking-tight text-nowrap">{successMessage}</span>
                    </div>
                </div>
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Zap size={20} className="text-brand-red" />
                                Add New Circuit
                            </h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleAddCircuit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Circuit ID</label>
                                <input
                                    type="text"
                                    required
                                    value={customerCircuitId}
                                    onChange={e => setCustomerCircuitId(e.target.value)}
                                    placeholder="Enter Circuit ID"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Vendor Name</label>
                                <select
                                    value={selectedVendorId}
                                    onChange={e => setSelectedVendorId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all outline-none"
                                >
                                    <option value="">Select a Vendor (Optional)</option>
                                    {vendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Client Name</label>
                                <select
                                    value={selectedClientId}
                                    onChange={e => setSelectedClientId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all outline-none"
                                >
                                    <option value="">Select a Client (Optional)</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Circuit Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="circuitType"
                                            value="UNPROTECTED"
                                            checked={circuitType === 'UNPROTECTED'}
                                            onChange={() => setCircuitType('UNPROTECTED')}
                                            className="w-4 h-4 text-brand-red focus:ring-brand-red border-gray-300"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">Unprotected</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="circuitType"
                                            value="PROTECTED"
                                            checked={circuitType === 'PROTECTED'}
                                            onChange={() => setCircuitType('PROTECTED')}
                                            className="w-4 h-4 text-brand-red focus:ring-brand-red border-gray-300"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">Protected</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all font-sans"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!customerCircuitId || submitting}
                                    className={`flex-1 py-2.5 bg-brand-red text-white font-bold rounded-xl hover:bg-brand-red-hover shadow-lg shadow-brand-red/20 transition-all font-sans flex items-center justify-center gap-2 ${!customerCircuitId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        "Add Circuit"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-8 flex-1 overflow-auto relative">
                {isSuperAdmin() && (
                    <div className="mb-6">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-red hover:bg-brand-red-hover text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-red/20 active:scale-95"
                        >
                            <Plus size={18} />
                            Add Circuit
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
                    </div>
                ) : (
                    <>
                        {/* Mobile/Tablet Card View */}
                        <div className="grid grid-cols-1 gap-4 lg:hidden mb-8">
                            {filteredCircuits.map((circuit) => (
                                <div key={circuit.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg break-all">{circuit.customerCircuitId}</h3>
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${circuit.type === 'PROTECTED'
                                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                                            : 'bg-orange-50 text-orange-600 border-orange-100'
                                            }`}>
                                            {circuit.type}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-50">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">Vendor:</span>
                                            <span className="font-bold text-gray-800">{circuit.vendor?.name || '—'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">Client:</span>
                                            <span className="font-bold text-gray-800">{circuit.client?.name || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/30">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Circuit ID</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Client</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCircuits.map((circuit) => (
                                            <tr key={circuit.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-800">{circuit.customerCircuitId}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${circuit.type === 'PROTECTED'
                                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                        : 'bg-orange-50 text-orange-600 border-orange-100'
                                                        }`}>
                                                        {circuit.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                    {circuit.vendor?.name ? (
                                                        <span className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                                            {circuit.vendor.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 font-normal italic">None</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                    {circuit.client?.name ? (
                                                        <span className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                                            {circuit.client.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 font-normal italic">None</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CircuitsPage;
