import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '../../components/ui/Topbar';
import { Plus, Check, X, Loader2, Zap, Pencil } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { circuitService } from '../../services/circuitService';
import type { Circuit, CreateCircuitData, UpdateCircuitData } from '../../services/circuitService';
import { vendorService } from '../../services/vendorService';
import type { Vendor } from '../../services/vendorService';
import { clientService } from '../../services/clientService';
import type { Client } from '../../services/clientService';

// ─── Blank form state helpers ─────────────────────────────────────────────────
const blankForm = (): CreateCircuitData => ({
    customerCircuitId: '',
    supplierCircuitId: '',
    type: 'UNPROTECTED',
    vendorId: '',
    clientId: '',
    poNumber: '',
    serviceDescription: '',
    contractTermMonths: undefined,
    contractType: '',
    mrc: undefined,
    supplierPoNumber: '',
    supplierServiceDescription: '',
    supplierContractTermMonths: undefined,
    supplierContractType: '',
    billingStartDate: '',
    supplierMrc: undefined,
    nrc: undefined,
    supplierNrc: undefined,
});

const circuitToForm = (c: Circuit): CreateCircuitData => ({
    customerCircuitId:          c.customerCircuitId,
    supplierCircuitId:          c.supplierCircuitId ?? '',
    type:                       c.type,
    vendorId:                   c.vendorId ?? '',
    clientId:                   c.clientId ?? '',
    poNumber:                   c.poNumber ?? '',
    serviceDescription:         c.serviceDescription ?? '',
    contractTermMonths:         c.contractTermMonths ?? undefined,
    contractType:               c.contractType ?? '',
    mrc:                        c.mrc,
    supplierPoNumber:           c.supplierPoNumber ?? '',
    supplierServiceDescription: c.supplierServiceDescription ?? '',
    supplierContractTermMonths: c.supplierContractTermMonths ?? undefined,
    supplierContractType:       c.supplierContractType ?? '',
    billingStartDate:           c.billingStartDate ?? '',
    supplierMrc:                c.supplierMrc,
    nrc:                        c.nrc ?? undefined,
    supplierNrc:                c.supplierNrc ?? undefined,
});

// ─── Reusable labeled input ───────────────────────────────────────────────────
const Field: React.FC<{
    label: string;
    children: React.ReactNode;
}> = ({ label, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
        {children}
    </div>
);

const inputCls = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all";
const selectCls = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all appearance-none";

// ─── Circuit Form Modal (shared for Add & Edit) ───────────────────────────────
interface CircuitFormModalProps {
    mode: 'add' | 'edit';
    form: CreateCircuitData;
    onChange: (key: keyof CreateCircuitData, value: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    submitting: boolean;
    vendors: Vendor[];
    clients: Client[];
}

const CircuitFormModal: React.FC<CircuitFormModalProps> = ({
    mode, form, onChange, onSubmit, onClose, submitting, vendors, clients
}) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    {mode === 'add' ? <Zap size={18} className="text-brand-red" /> : <Pencil size={18} className="text-brand-red" />}
                    {mode === 'add' ? 'Add New Circuit' : 'Edit Circuit'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={18} className="text-gray-400" />
                </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={onSubmit} className="overflow-y-auto flex-1">
                <div className="px-8 py-6 space-y-6">

                    {/* ── Section: Circuit IDs ─────────────────────────── */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Circuit Identifiers</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Customer Circuit ID *">
                                <input
                                    required
                                    type="text"
                                    value={form.customerCircuitId}
                                    onChange={e => onChange('customerCircuitId', e.target.value)}
                                    placeholder="e.g. N1/LON-MUM/ESPL-006"
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Supplier Circuit ID">
                                <input
                                    type="text"
                                    value={form.supplierCircuitId ?? ''}
                                    onChange={e => onChange('supplierCircuitId', e.target.value)}
                                    placeholder="Auto-generated if blank"
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                    </div>

                    {/* ── Section: Circuit Type ────────────────────────── */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Circuit Type</p>
                        <div className="flex gap-6">
                            {(['UNPROTECTED', 'PROTECTED'] as const).map(t => (
                                <label key={t} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="circuitType"
                                        value={t}
                                        checked={form.type === t}
                                        onChange={() => onChange('type', t)}
                                        className="w-4 h-4 text-brand-red focus:ring-brand-red border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700 font-medium capitalize">{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* ── Section: Associations ────────────────────────── */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Associations</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Vendor">
                                <select value={form.vendorId ?? ''} onChange={e => onChange('vendorId', e.target.value)} className={selectCls}>
                                    <option value="">Select a Vendor</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Client">
                                <select value={form.clientId ?? ''} onChange={e => onChange('clientId', e.target.value)} className={selectCls}>
                                    <option value="">Select a Client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </Field>
                        </div>
                    </div>

                    {/* ── Section: Customer Contract Details ───────────── */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer Contract</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="PO Number">
                                <input type="text" value={form.poNumber ?? ''} onChange={e => onChange('poNumber', e.target.value)} placeholder="PO-XXXXX" className={inputCls} />
                            </Field>
                            <Field label="Contract Type">
                                <input type="text" value={form.contractType ?? ''} onChange={e => onChange('contractType', e.target.value)} placeholder="e.g. Annual" className={inputCls} />
                            </Field>
                            <Field label="Contract Term (Months)">
                                <input type="number" min={1} value={form.contractTermMonths ?? ''} onChange={e => onChange('contractTermMonths', e.target.value ? Number(e.target.value) : null)} placeholder="12" className={inputCls} />
                            </Field>
                            <Field label="MRC (Monthly Recurring Charge)">
                                <input type="number" min={0} step="0.01" value={form.mrc ?? ''} onChange={e => onChange('mrc', e.target.value ? Number(e.target.value) : null)} placeholder="1000.00" className={inputCls} />
                            </Field>
                            <Field label="NRC (Non-Recurring Charge)">
                                <input type="number" min={0} step="0.01" value={form.nrc ?? ''} onChange={e => onChange('nrc', e.target.value ? Number(e.target.value) : null)} placeholder="50.00" className={inputCls} />
                            </Field>
                            <Field label="Service Description">
                                <input type="text" value={form.serviceDescription ?? ''} onChange={e => onChange('serviceDescription', e.target.value)} placeholder="Service description" className={`${inputCls} sm:col-span-2`} />
                            </Field>
                        </div>
                    </div>

                    {/* ── Section: Supplier Contract Details ───────────── */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Supplier Contract</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Supplier PO Number">
                                <input type="text" value={form.supplierPoNumber ?? ''} onChange={e => onChange('supplierPoNumber', e.target.value)} placeholder="SUP-PO-XXXXX" className={inputCls} />
                            </Field>
                            <Field label="Supplier Contract Type">
                                <input type="text" value={form.supplierContractType ?? ''} onChange={e => onChange('supplierContractType', e.target.value)} placeholder="e.g. Annual" className={inputCls} />
                            </Field>
                            <Field label="Supplier Contract Term (Months)">
                                <input type="number" min={1} value={form.supplierContractTermMonths ?? ''} onChange={e => onChange('supplierContractTermMonths', e.target.value ? Number(e.target.value) : null)} placeholder="12" className={inputCls} />
                            </Field>
                            <Field label="Supplier MRC">
                                <input type="number" min={0} step="0.01" value={form.supplierMrc ?? ''} onChange={e => onChange('supplierMrc', e.target.value ? Number(e.target.value) : null)} placeholder="800.00" className={inputCls} />
                            </Field>
                            <Field label="Supplier NRC">
                                <input type="number" min={0} step="0.01" value={form.supplierNrc ?? ''} onChange={e => onChange('supplierNrc', e.target.value ? Number(e.target.value) : null)} placeholder="40.00" className={inputCls} />
                            </Field>
                            <Field label="Billing Start Date">
                                <input type="date" value={form.billingStartDate ?? ''} onChange={e => onChange('billingStartDate', e.target.value)} className={inputCls} />
                            </Field>
                            <Field label="Supplier Service Description">
                                <input type="text" value={form.supplierServiceDescription ?? ''} onChange={e => onChange('supplierServiceDescription', e.target.value)} placeholder="Supplier service description" className={inputCls} />
                            </Field>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 flex gap-3 bg-gray-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!form.customerCircuitId || submitting}
                        className={`flex-1 py-2.5 bg-brand-red text-white font-bold rounded-xl hover:bg-brand-red-hover shadow-lg shadow-brand-red/20 transition-all text-sm flex items-center justify-center gap-2 ${(!form.customerCircuitId || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {submitting
                            ? <><Loader2 className="w-4 h-4 animate-spin" />{mode === 'add' ? 'Adding...' : 'Saving...'}</>
                            : mode === 'add' ? 'Add Circuit' : 'Save Changes'
                        }
                    </button>
                </div>
            </form>
        </div>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const CircuitsPage: React.FC = () => {
    const navigate   = useNavigate();
    const { isSuperAdmin } = useAuth();

    const [circuits,  setCircuits]  = useState<Circuit[]>([]);
    const [vendors,   setVendors]   = useState<Vendor[]>([]);
    const [clients,   setClients]   = useState<Client[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // ── Success toast ──────────────────────────────────────────────────────
    const [showSuccess,    setShowSuccess]    = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // ── Add modal ──────────────────────────────────────────────────────────
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addForm,        setAddForm]        = useState<CreateCircuitData>(blankForm());
    const [addSubmitting,  setAddSubmitting]  = useState(false);

    // ── Edit modal ─────────────────────────────────────────────────────────
    const [editCircuit,    setEditCircuit]    = useState<Circuit | null>(null);
    const [editForm,       setEditForm]       = useState<CreateCircuitData>(blankForm());
    const [editSubmitting, setEditSubmitting] = useState(false);

    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [circuitsData, vendorsData, clientsData] = await Promise.all([
                circuitService.getAllCircuits(),
                vendorService.getAllVendors(),
                clientService.getAllClients(),
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

    const toast = (msg: string) => {
        setSuccessMessage(msg);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    // ── Add handlers ───────────────────────────────────────────────────────
    const handleAddChange = (key: keyof CreateCircuitData, value: any) =>
        setAddForm(prev => ({ ...prev, [key]: value }));

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setAddSubmitting(true);
            await circuitService.createCircuit(addForm);
            await fetchData();
            setIsAddModalOpen(false);
            setAddForm(blankForm());
            toast('Circuit Added Successfully');
        } catch (error: any) {
            console.error('Failed to create circuit:', error);
            if (error.message === 'Unauthorized') { localStorage.removeItem('edgestone_user'); navigate('/login'); }
            else alert(error.message || 'Failed to create circuit');
        } finally {
            setAddSubmitting(false);
        }
    };

    // ── Edit handlers ──────────────────────────────────────────────────────
    const openEdit = (circuit: Circuit) => {
        setEditCircuit(circuit);
        setEditForm(circuitToForm(circuit));
    };

    const handleEditChange = (key: keyof CreateCircuitData, value: any) =>
        setEditForm(prev => ({ ...prev, [key]: value }));

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editCircuit) return;
        try {
            setEditSubmitting(true);
            const payload: UpdateCircuitData = { ...editForm };
            await circuitService.updateCircuit(editCircuit.id, payload);
            await fetchData();
            setEditCircuit(null);
            toast('Circuit Updated Successfully');
        } catch (error: any) {
            console.error('Failed to update circuit:', error);
            if (error.message === 'Unauthorized') { localStorage.removeItem('edgestone_user'); navigate('/login'); }
            else alert(error.message || 'Failed to update circuit');
        } finally {
            setEditSubmitting(false);
        }
    };

    // ── Filter ─────────────────────────────────────────────────────────────
    const filteredCircuits = circuits.filter(c => {
        const q = searchQuery.toLowerCase();
        return (
            c.customerCircuitId.toLowerCase().includes(q) ||
            (c.vendor?.name?.toLowerCase().includes(q) ?? false) ||
            (c.client?.name?.toLowerCase().includes(q) ?? false)
        );
    });

    const typeBadge = (type: string) =>
        type === 'PROTECTED'
            ? 'bg-blue-50 text-blue-600 border-blue-100'
            : 'bg-orange-50 text-orange-600 border-orange-100';

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#F9FAFB] relative transition-all duration-500">
            <style>{`
                @keyframes gradual-fade {
                    0%   { opacity: 0; transform: translate(-50%, -15px); }
                    15%  { opacity: 1; transform: translate(-50%, 0); }
                    85%  { opacity: 1; transform: translate(-50%, 0); }
                    100% { opacity: 0; transform: translate(-50%, -15px); }
                }
                .animate-gradual { animation: gradual-fade 2s ease-in-out forwards; }
            `}</style>

            <Topbar
                title="Circuits"
                searchPlaceholder="Search circuits by ID, vendor or client..."
                onSearch={setSearchQuery}
            />

            {/* Toast */}
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

            {/* Add Modal */}
            {isAddModalOpen && (
                <CircuitFormModal
                    mode="add"
                    form={addForm}
                    onChange={handleAddChange}
                    onSubmit={handleAddSubmit}
                    onClose={() => { setIsAddModalOpen(false); setAddForm(blankForm()); }}
                    submitting={addSubmitting}
                    vendors={vendors}
                    clients={clients}
                />
            )}

            {/* Edit Modal */}
            {editCircuit && (
                <CircuitFormModal
                    mode="edit"
                    form={editForm}
                    onChange={handleEditChange}
                    onSubmit={handleEditSubmit}
                    onClose={() => setEditCircuit(null)}
                    submitting={editSubmitting}
                    vendors={vendors}
                    clients={clients}
                />
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
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${typeBadge(circuit.type)}`}>
                                                {circuit.type}
                                            </span>
                                            {isSuperAdmin() && (
                                                <button
                                                    onClick={() => openEdit(circuit)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Edit circuit"
                                                >
                                                    <Pencil size={14} className="text-gray-400" />
                                                </button>
                                            )}
                                        </div>
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
                                        {circuit.mrc > 0 && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 font-medium">MRC:</span>
                                                <span className="font-bold text-gray-800">${circuit.mrc.toLocaleString()}</span>
                                            </div>
                                        )}
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
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">MRC</th>
                                            {isSuperAdmin() && (
                                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-16"></th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCircuits.map((circuit) => (
                                            <tr key={circuit.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-gray-800">{circuit.customerCircuitId}</span>
                                                    {circuit.supplierCircuitId && (
                                                        <p className="text-xs text-gray-400 font-medium mt-0.5">{circuit.supplierCircuitId}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${typeBadge(circuit.type)}`}>
                                                        {circuit.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                    {circuit.vendor?.name
                                                        ? <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-400" />{circuit.vendor.name}</span>
                                                        : <span className="text-gray-400 font-normal italic">None</span>}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                    {circuit.client?.name
                                                        ? <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400" />{circuit.client.name}</span>
                                                        : <span className="text-gray-400 font-normal italic">None</span>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {circuit.mrc ? `$${circuit.mrc.toLocaleString()}` : '—'}
                                                </td>
                                                {isSuperAdmin() && (
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => openEdit(circuit)}
                                                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-lg transition-all"
                                                            title="Edit circuit"
                                                        >
                                                            <Pencil size={14} className="text-gray-500" />
                                                        </button>
                                                    </td>
                                                )}
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
