import React, { useState, useEffect } from 'react';
import {
    X,
    Shield,
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    Loader2,
    Check,
    Building2,
    User,
    Eye,
    ArrowLeft,
    AlertCircle,
    Zap,
    Edit2
} from 'lucide-react';
import { circuitService } from '../../services/circuitService';
import { slaRuleService } from '../../services/slaRuleService';
import { vendorService } from '../../services/vendorService';
import { clientService } from '../../services/clientService';
import type { Circuit } from '../../services/circuitService';
import type { SLARule, SLARuleCondition } from '../../services/slaRuleService';
import type { Vendor } from '../../services/vendorService';
import type { Client } from '../../services/clientService';

interface SLARulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AddStep = 'idle' | 'select-circuit' | 'select-type' | 'select-entity' | 'define-rules' | 'saving' | 'saved';

const OPERATORS = [
    { value: '>', label: '>' },
    { value: '>=', label: '≥' },
    { value: '<', label: '<' },
    { value: '<=', label: '≤' },
];

const emptyCondition: SLARuleCondition = {
    upperLimit: null,
    upperOperator: '>',
    lowerLimit: null,
    lowerOperator: '>=',
    compensation: 0,
};

export const SLARulesModal: React.FC<SLARulesModalProps> = ({ isOpen, onClose }) => {
    // Data states
    const [slaRules, setSlaRules] = useState<SLARule[]>([]);
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    // Loading states
    const [loadingRules, setLoadingRules] = useState(true);
    const [loadingCircuits, setLoadingCircuits] = useState(false);
    const [loadingEntities, setLoadingEntities] = useState(false);

    // View SLA expanded state
    const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

    // Add SLA flow states
    const [addStep, setAddStep] = useState<AddStep>('idle');
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [selectedCircuit, setSelectedCircuit] = useState<Circuit | null>(null);
    const [targetType, setTargetType] = useState<'vendor' | 'customer' | null>(null);
    const [selectedEntityId, setSelectedEntityId] = useState('');
    const [selectedEntityName, setSelectedEntityName] = useState('');
    const [conditions, setConditions] = useState<SLARuleCondition[]>([{ ...emptyCondition }]);

    // Dropdown open states
    const [circuitDropdownOpen, setCircuitDropdownOpen] = useState(false);
    const [entityDropdownOpen, setEntityDropdownOpen] = useState(false);

    // Error state
    const [error, setError] = useState('');

    // Fetch SLA rules on mount
    useEffect(() => {
        if (isOpen) {
            fetchSLARules();
        }
    }, [isOpen]);

    const fetchSLARules = async () => {
        try {
            setLoadingRules(true);
            setError('');
            const data = await slaRuleService.getAllSLARules();
            setSlaRules(data);
        } catch (err: any) {
            console.error('Failed to fetch SLA rules:', err);
            setError('Failed to load SLA rules');
            setSlaRules([]);
        } finally {
            setLoadingRules(false);
        }
    };

    const startAddFlow = async () => {
        setAddStep('select-circuit');
        setEditingRuleId(null);
        setSelectedCircuit(null);
        setTargetType(null);
        setSelectedEntityId('');
        setSelectedEntityName('');
        setConditions([{ ...emptyCondition }]);
        setError('');

        try {
            setLoadingCircuits(true);
            const data = await circuitService.getAllCircuits();
            setCircuits(data);
        } catch (err: any) {
            console.error('Failed to fetch circuits:', err);
            setError('Failed to load circuits');
        } finally {
            setLoadingCircuits(false);
        }
    };

    const handleCircuitSelect = (circuit: Circuit) => {
        setSelectedCircuit(circuit);
        setCircuitDropdownOpen(false);
        setAddStep('select-type');
    };

    const handleTypeSelect = async (type: 'vendor' | 'customer') => {
        setTargetType(type);
        setAddStep('select-entity');
        setSelectedEntityId('');
        setSelectedEntityName('');

        try {
            setLoadingEntities(true);
            
            // Prevent adding a duplicate SLA rule by filtering out entities that already have one
            const existingIds = slaRules
                .filter(r => r.circuitId === selectedCircuit?.id && r.targetType === type)
                .map(r => r.targetId);

            if (type === 'vendor') {
                const data = await vendorService.getAllVendors();
                setVendors(data.filter(v => !existingIds.includes(v.id)));
            } else {
                const data = await clientService.getAllClients();
                setClients(data.filter(c => !existingIds.includes(c.id)));
            }
        } catch (err: any) {
            console.error(`Failed to fetch ${type}s:`, err);
            setError(`Failed to load ${type}s`);
        } finally {
            setLoadingEntities(false);
        }
    };

    const handleEntitySelect = (id: string, name: string) => {
        setSelectedEntityId(id);
        setSelectedEntityName(name);
        setEntityDropdownOpen(false);
        setAddStep('define-rules');
    };

    const addConditionRow = () => {
        setConditions(prev => [...prev, { ...emptyCondition }]);
    };

    const removeConditionRow = (index: number) => {
        setConditions(prev => prev.filter((_, i) => i !== index));
    };

    const updateCondition = (index: number, field: keyof SLARuleCondition, value: any) => {
        setConditions(prev => prev.map((c, i) => {
            if (i !== index) return c;
            return { ...c, [field]: value };
        }));
    };

    const handleSave = async () => {
        if (!selectedCircuit || !targetType || !selectedEntityId) return;

        setAddStep('saving');
        setError('');

        try {
            if (editingRuleId) {
                await slaRuleService.updateSLARule(editingRuleId, {
                    circuitId: selectedCircuit.id,
                    circuitDisplayId: selectedCircuit.customerCircuitId,
                    targetType,
                    targetId: selectedEntityId,
                    targetName: selectedEntityName,
                    conditions,
                });
            } else {
                await slaRuleService.createSLARule({
                    circuitId: selectedCircuit.id,
                    circuitDisplayId: selectedCircuit.customerCircuitId,
                    targetType,
                    targetId: selectedEntityId,
                    targetName: selectedEntityName,
                    conditions,
                });
            }
            setAddStep('saved');
            // Refresh rules list
            await fetchSLARules();
            // Auto-dismiss after 2s
            setTimeout(() => {
                setAddStep('idle');
            }, 2000);
        } catch (err: any) {
            console.error('Failed to save SLA rule:', err);
            setError('Failed to save SLA rule. Please try again.');
            setAddStep('define-rules');
        }
    };

    const resetAddFlow = () => {
        setAddStep('idle');
        setSelectedCircuit(null);
        setTargetType(null);
        setSelectedEntityId('');
        setSelectedEntityName('');
        setConditions([{ ...emptyCondition }]);
        setError('');
        setEditingRuleId(null);
    };

    const startEditFlow = (rule: SLARule) => {
        setEditingRuleId(rule.id);
        setSelectedCircuit({
            id: rule.circuitId,
            customerCircuitId: rule.circuitDisplayId,
            supplierCircuitId: null,
            type: 'PROTECTED', // fallback for display only
            vendorId: null,
            vendor: null,
            clientId: null,
            client: null,
        } as Circuit);
        setTargetType(rule.targetType);
        setSelectedEntityId(rule.targetId);
        setSelectedEntityName(rule.targetName);
        setConditions(rule.conditions.map(c => ({ ...c })));
        setAddStep('define-rules');
    };

    const goBack = () => {
        switch (addStep) {
            case 'select-circuit': resetAddFlow(); break;
            case 'select-type': setAddStep('select-circuit'); break;
            case 'select-entity': setAddStep('select-type'); break;
            case 'define-rules': setAddStep('select-entity'); break;
            default: break;
        }
    };

    // Group SLA rules by circuit for display
    const groupedRules = slaRules.reduce((acc, rule) => {
        const key = rule.circuitId;
        if (!acc[key]) {
            acc[key] = {
                circuitDisplayId: rule.circuitDisplayId,
                circuitId: rule.circuitId,
                vendorRules: [],
                customerRules: [],
            };
        }
        if (rule.targetType === 'vendor') {
            acc[key].vendorRules.push(rule);
        } else {
            acc[key].customerRules.push(rule);
        }
        return acc;
    }, {} as Record<string, { circuitDisplayId: string; circuitId: string; vendorRules: SLARule[]; customerRules: SLARule[] }>);

    if (!isOpen) return null;

    const renderConditionTable = (ruleConditions: SLARuleCondition[]) => (
        <div className="mb-4 last:mb-0">
            <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/80">
                            <th className="px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Upper Limit</th>
                            <th className="px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Op</th>
                            <th className="px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Av</th>
                            <th className="px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Op</th>
                            <th className="px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lower Limit</th>
                            <th className="px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Service Credit %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ruleConditions.map((c, i) => (
                            <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-2.5 text-sm font-semibold text-gray-700">
                                    {c.upperLimit !== null ? `${c.upperLimit}%` : '—'}
                                </td>
                                <td className="px-4 py-2.5 text-sm font-bold text-gray-500 text-center">
                                    {c.upperOperator ? OPERATORS.find(o => o.value === c.upperOperator)?.label || c.upperOperator : '—'}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[11px] font-bold">Av</span>
                                </td>
                                <td className="px-4 py-2.5 text-sm font-bold text-gray-500 text-center">
                                    {c.lowerOperator ? OPERATORS.find(o => o.value === c.lowerOperator)?.label || c.lowerOperator : '—'}
                                </td>
                                <td className="px-4 py-2.5 text-sm font-semibold text-gray-700">
                                    {c.lowerLimit !== null ? `${c.lowerLimit}%` : '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold ${c.compensation === 0
                                        ? 'bg-green-50 text-green-600'
                                        : 'bg-red-50 text-red-600'
                                        }`}>
                                        {c.compensation}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <>
            {/* Custom styles */}
            <style>{`
                @keyframes sla-modal-in {
                    0% { opacity: 0; transform: scale(0.95) translateY(10px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes sla-fade-in {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                @keyframes sla-slide-up {
                    0% { opacity: 0; transform: translateY(12px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes sla-checkmark {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes sla-pulse-ring {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                .sla-modal-enter { animation: sla-modal-in 0.3s ease-out forwards; }
                .sla-fade-enter { animation: sla-fade-in 0.2s ease-out forwards; }
                .sla-slide-enter { animation: sla-slide-up 0.3s ease-out forwards; }
                .sla-checkmark-enter { animation: sla-checkmark 0.5s ease-out forwards; }
                .sla-pulse-ring { animation: sla-pulse-ring 1s ease-out infinite; }
            `}</style>

            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] sla-fade-enter"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-[0_32px_128px_-12px_rgba(0,0,0,0.25)] border border-gray-100/50 flex flex-col pointer-events-auto sla-modal-enter overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            {addStep !== 'idle' && addStep !== 'saving' && addStep !== 'saved' && (
                                <button
                                    onClick={goBack}
                                    className="p-1.5 -ml-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                                >
                                    <ArrowLeft size={20} strokeWidth={2.5} />
                                </button>
                            )}
                            <div className="w-10 h-10 bg-gradient-to-br from-brand-red/10 to-brand-red/5 text-brand-red rounded-xl flex items-center justify-center">
                                <Shield size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 tracking-tight">SLA Rules</h2>
                                <p className="text-[12px] text-gray-400 font-medium">
                                    {addStep === 'idle' && 'Manage service level agreement rules'}
                                    {addStep === 'select-circuit' && 'Step 1 — Select a circuit'}
                                    {addStep === 'select-type' && 'Step 2 — Vendor or Customer?'}
                                    {addStep === 'select-entity' && `Step 3 — Select ${targetType}`}
                                    {addStep === 'define-rules' && 'Step 4 — Define SLA conditions'}
                                    {addStep === 'saving' && editingRuleId && 'Updating SLA rule...'}
                                    {addStep === 'saving' && !editingRuleId && 'Saving SLA rule...'}
                                    {addStep === 'saved' && editingRuleId && 'SLA rule updated successfully!'}
                                    {addStep === 'saved' && !editingRuleId && 'SLA rule saved successfully!'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                        {/* Error */}
                        {error && (
                            <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl sla-slide-enter">
                                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                                <p className="text-sm font-semibold text-red-600">{error}</p>
                            </div>
                        )}

                        {/* =================== IDLE VIEW: Show existing rules + Add button =================== */}
                        {addStep === 'idle' && (
                            <>
                                {/* Add SLA Button */}
                                <button
                                    onClick={startAddFlow}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 mb-6 bg-brand-red hover:bg-[#d41c34] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-red/20 active:scale-[0.98]"
                                >
                                    <Plus size={18} strokeWidth={2.5} />
                                    Add SLA Rule
                                </button>

                                {/* Existing SLA Rules */}
                                {loadingRules ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
                                        <p className="text-sm font-medium text-gray-400">Loading SLA rules...</p>
                                    </div>
                                ) : Object.keys(groupedRules).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                                        <Shield size={48} strokeWidth={1} className="text-gray-200" />
                                        <p className="font-bold text-lg text-gray-300">No SLA rules defined</p>
                                        <p className="text-sm">Click "Add SLA Rule" to create your first rule.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {Object.entries(groupedRules).map(([circuitId, group]) => (
                                            <div key={circuitId} className="border border-gray-100 rounded-2xl overflow-hidden transition-all sla-slide-enter">
                                                {/* Card header */}
                                                <div className="px-5 py-4 bg-white">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <Zap size={18} className="text-gray-400" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-sm font-bold text-gray-900 truncate">{group.circuitDisplayId}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                                    {group.vendorRules.length > 0 && (
                                                                        <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                                                                            <Building2 size={12} />
                                                                            {group.vendorRules.map(r => r.targetName).join(', ')}
                                                                        </span>
                                                                    )}
                                                                    {group.customerRules.length > 0 && (
                                                                        <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                                                                            <User size={12} />
                                                                            {group.customerRules.map(r => r.targetName).join(', ')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setExpandedRuleId(expandedRuleId === circuitId ? null : circuitId)}
                                                            className="flex items-center gap-2 px-3.5 py-2 text-[12px] font-bold text-brand-red bg-brand-red/5 hover:bg-brand-red/10 rounded-lg transition-all active:scale-95 flex-shrink-0"
                                                        >
                                                            <Eye size={14} />
                                                            {expandedRuleId === circuitId ? 'Hide' : 'View SLA'}
                                                            {expandedRuleId === circuitId ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expanded SLA details */}
                                                {expandedRuleId === circuitId && (
                                                    <div className="px-5 pb-5 border-t border-gray-50 bg-gray-50/30 sla-slide-enter">
                                                        <div className="pt-4 space-y-5">
                                                            {/* Vendor Side Rules */}
                                                            {group.vendorRules.length > 0 && (
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <Building2 size={15} className="text-blue-500" />
                                                                            <h4 className="text-[13px] font-bold text-gray-700">Vendor Side SLA</h4>
                                                                            <span className="text-[11px] font-medium text-gray-400">({group.vendorRules[0]?.targetName})</span>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => startEditFlow(group.vendorRules[0])}
                                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-gray-500 hover:text-brand-red bg-white border border-gray-200 hover:border-brand-red/30 hover:bg-brand-red/5 rounded-lg transition-all"
                                                                        >
                                                                            <Edit2 size={12} />
                                                                            Edit
                                                                        </button>
                                                                    </div>
                                                                    {group.vendorRules.map(rule => renderConditionTable(rule.conditions))}
                                                                </div>
                                                            )}

                                                            {/* Customer Side Rules */}
                                                            {group.customerRules.length > 0 && (
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <User size={15} className="text-emerald-500" />
                                                                        <h4 className="text-[13px] font-bold text-gray-700">Customer Side SLA</h4>
                                                                    </div>
                                                                    {group.customerRules.map(rule => (
                                                                        <div key={rule.id} className="mb-3 last:mb-0">
                                                                            <div className="flex items-center justify-between mb-1.5 px-1">
                                                                                <p className="text-[11px] font-semibold text-gray-400">{rule.targetName}</p>
                                                                                <button 
                                                                                    onClick={() => startEditFlow(rule)}
                                                                                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-brand-red bg-white border border-gray-100 hover:border-brand-red/30 hover:bg-brand-red/5 rounded-md transition-all"
                                                                                >
                                                                                    <Edit2 size={12} />
                                                                                    Edit
                                                                                </button>
                                                                            </div>
                                                                            {renderConditionTable(rule.conditions)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {group.vendorRules.length === 0 && group.customerRules.length === 0 && (
                                                                <p className="text-sm text-gray-400 text-center py-4">No rules defined for this circuit yet.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* =================== STEP 1: Select Circuit =================== */}
                        {addStep === 'select-circuit' && (
                            <div className="sla-slide-enter">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                                    Select Circuit
                                </label>

                                {loadingCircuits ? (
                                    <div className="flex items-center justify-center py-12 gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
                                        <p className="text-sm font-medium text-gray-400">Loading circuits...</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <button
                                            onClick={() => setCircuitDropdownOpen(!circuitDropdownOpen)}
                                            className={`w-full h-[56px] border rounded-2xl px-4 flex items-center justify-between transition-all active:scale-[0.98] ${circuitDropdownOpen
                                                ? 'bg-white border-[#0F172A] ring-4 ring-[#0F172A]/5'
                                                : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            <span className={`text-[14px] font-bold truncate ${selectedCircuit ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {selectedCircuit
                                                    ? `${selectedCircuit.customerCircuitId} (${selectedCircuit.type === 'PROTECTED' ? 'Protected' : 'Unprotected'})`
                                                    : 'Choose a circuit...'
                                                }
                                            </span>
                                            <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${circuitDropdownOpen ? 'rotate-180 text-gray-900' : ''}`} />
                                        </button>

                                        {circuitDropdownOpen && (
                                            <div className="mt-2 bg-white border border-gray-100 rounded-2xl shadow-lg max-h-[260px] overflow-y-auto p-2 sla-slide-enter">
                                                {circuits.length === 0 ? (
                                                    <p className="text-sm text-gray-400 text-center py-4">No circuits found</p>
                                                ) : (
                                                    circuits.map(circuit => (
                                                        <button
                                                            key={circuit.id}
                                                            onClick={() => handleCircuitSelect(circuit)}
                                                            className="w-full px-3.5 py-3 text-left rounded-xl transition-all flex items-center justify-between mb-0.5 last:mb-0 hover:bg-gray-50 active:bg-gray-100"
                                                        >
                                                            <div>
                                                                <span className="text-[13px] font-bold text-gray-900 block">{circuit.customerCircuitId}</span>
                                                                <span className="text-[11px] text-gray-400 font-medium">{circuit.vendor?.name ?? '—'}</span>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${circuit.type === 'PROTECTED'
                                                                ? 'bg-green-50 text-green-600'
                                                                : 'bg-orange-50 text-orange-600'
                                                                }`}>
                                                                {circuit.type === 'PROTECTED' ? 'Protected' : 'Unprotected'}
                                                            </span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =================== STEP 2: Select Type (Vendor/Customer) =================== */}
                        {addStep === 'select-type' && (
                            <div className="sla-slide-enter">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                                    Define SLA for
                                </label>
                                <p className="text-sm text-gray-500 mb-5 px-1">
                                    Circuit: <span className="font-bold text-gray-800">{selectedCircuit?.customerCircuitId}</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${selectedCircuit?.type === 'PROTECTED' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {selectedCircuit?.type === 'PROTECTED' ? 'Protected' : 'Unprotected'}
                                    </span>
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleTypeSelect('vendor')}
                                        className="group flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-300 hover:bg-blue-50/30 transition-all active:scale-[0.97]"
                                    >
                                        <div className="w-14 h-14 bg-blue-50 group-hover:bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center transition-colors">
                                            <Building2 size={28} />
                                        </div>
                                        <span className="text-[14px] font-bold text-gray-700 group-hover:text-blue-700">Vendor</span>
                                    </button>

                                    <button
                                        onClick={() => handleTypeSelect('customer')}
                                        className="group flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-all active:scale-[0.97]"
                                    >
                                        <div className="w-14 h-14 bg-emerald-50 group-hover:bg-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center transition-colors">
                                            <User size={28} />
                                        </div>
                                        <span className="text-[14px] font-bold text-gray-700 group-hover:text-emerald-700">Customer</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* =================== STEP 3: Select Entity =================== */}
                        {addStep === 'select-entity' && (
                            <div className="sla-slide-enter">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                                    Select {targetType === 'vendor' ? 'Vendor' : 'Customer'}
                                </label>
                                <p className="text-sm text-gray-500 mb-5 px-1">
                                    Circuit: <span className="font-bold text-gray-800">{selectedCircuit?.customerCircuitId}</span>
                                    {' → '}
                                    <span className="font-bold text-gray-800 capitalize">{targetType}</span>
                                </p>

                                {loadingEntities ? (
                                    <div className="flex items-center justify-center py-12 gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
                                        <p className="text-sm font-medium text-gray-400">Loading {targetType}s...</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <button
                                            onClick={() => setEntityDropdownOpen(!entityDropdownOpen)}
                                            className={`w-full h-[56px] border rounded-2xl px-4 flex items-center justify-between transition-all active:scale-[0.98] ${entityDropdownOpen
                                                ? 'bg-white border-[#0F172A] ring-4 ring-[#0F172A]/5'
                                                : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            <span className={`text-[14px] font-bold truncate ${selectedEntityName ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {selectedEntityName || `Choose a ${targetType}...`}
                                            </span>
                                            <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${entityDropdownOpen ? 'rotate-180 text-gray-900' : ''}`} />
                                        </button>

                                        {entityDropdownOpen && (
                                            <div className="mt-2 bg-white border border-gray-100 rounded-2xl shadow-lg max-h-[260px] overflow-y-auto p-2 sla-slide-enter">
                                                {targetType === 'vendor' ? (
                                                    vendors.length === 0 ? (
                                                        <p className="text-sm text-gray-400 text-center py-4">
                                                            All eligible vendors already have an SLA defined.
                                                        </p>
                                                    ) : (
                                                        vendors.map(v => (
                                                            <button
                                                                key={v.id}
                                                                onClick={() => handleEntitySelect(v.id, v.name)}
                                                                className={`w-full px-3.5 py-3 text-left text-[13px] font-semibold rounded-xl transition-all flex items-center justify-between mb-0.5 last:mb-0 ${selectedEntityId === v.id ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'}`}
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <Building2 size={16} className="text-gray-400" />
                                                                    {v.name}
                                                                </div>
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                                    {v.status}
                                                                </span>
                                                            </button>
                                                        ))
                                                    )
                                                ) : (
                                                    clients.length === 0 ? (
                                                        <p className="text-sm text-gray-400 text-center py-4">
                                                            All eligible customers already have an SLA defined.
                                                        </p>
                                                    ) : (
                                                        clients.map(c => (
                                                            <button
                                                                key={c.id}
                                                                onClick={() => handleEntitySelect(c.id, c.name)}
                                                                className={`w-full px-3.5 py-3 text-left text-[13px] font-semibold rounded-xl transition-all flex items-center justify-between mb-0.5 last:mb-0 ${selectedEntityId === c.id ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'}`}
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <User size={16} className="text-gray-400" />
                                                                    {c.name}
                                                                </div>
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                                    {c.status}
                                                                </span>
                                                            </button>
                                                        ))
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =================== STEP 4: Define Rules =================== */}
                        {addStep === 'define-rules' && (
                            <div className="sla-slide-enter">
                                {/* Summary breadcrumb */}
                                <div className="flex items-center gap-2 flex-wrap text-[12px] text-gray-400 font-medium mb-5 px-1">
                                    <span className="font-bold text-gray-600">{selectedCircuit?.customerCircuitId}</span>
                                    <ChevronRight size={12} />
                                    <span className="capitalize font-bold text-gray-600">{targetType}</span>
                                    <ChevronRight size={12} />
                                    <span className="font-bold text-gray-800">{selectedEntityName}</span>
                                </div>

                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                                    Define Availability Factor Ranges
                                </label>

                                <p className="text-[12px] text-gray-500 mb-4 px-1 leading-relaxed">
                                    Each row defines: <span className="font-bold text-gray-700">Upper Limit</span>{' '}
                                    <span className="text-brand-red font-bold">[operator]</span>{' '}
                                    <span className="font-bold text-blue-600">Av</span>{' '}
                                    <span className="text-brand-red font-bold">[operator]</span>{' '}
                                    <span className="font-bold text-gray-700">Lower Limit</span>{' '}
                                    → Compensation %. Leave upper/lower empty for boundary rows.
                                </p>

                                <div className="space-y-3 mb-5">
                                    {conditions.map((cond, index) => (
                                        <div key={index} className="bg-gray-50/70 rounded-xl p-4 border border-gray-100 sla-slide-enter" style={{ animationDelay: `${index * 50}ms` }}>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase">Range {index + 1}</span>
                                                {conditions.length > 1 && (
                                                    <button
                                                        onClick={() => removeConditionRow(index)}
                                                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-12 gap-2 items-center">
                                                {/* Upper Limit */}
                                                <div className="col-span-3">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Upper %"
                                                        value={cond.upperLimit ?? ''}
                                                        onChange={e => updateCondition(index, 'upperLimit', e.target.value === '' ? null : parseFloat(e.target.value))}
                                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all placeholder:text-gray-300"
                                                    />
                                                </div>

                                                {/* Upper Operator */}
                                                <div className="col-span-2">
                                                    <select
                                                        value={cond.upperOperator || '>'}
                                                        onChange={e => updateCondition(index, 'upperOperator', e.target.value)}
                                                        className="w-full px-2 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-center text-gray-700 focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all appearance-none cursor-pointer"
                                                    >
                                                        {OPERATORS.map(op => (
                                                            <option key={op.value} value={op.value}>{op.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Av label */}
                                                <div className="col-span-1 flex items-center justify-center">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-bold">Av</span>
                                                </div>

                                                {/* Lower Operator */}
                                                <div className="col-span-2">
                                                    <select
                                                        value={cond.lowerOperator || '>='}
                                                        onChange={e => updateCondition(index, 'lowerOperator', e.target.value)}
                                                        className="w-full px-2 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-center text-gray-700 focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all appearance-none cursor-pointer"
                                                    >
                                                        {OPERATORS.map(op => (
                                                            <option key={op.value} value={op.value}>{op.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Lower Limit */}
                                                <div className="col-span-3">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Lower %"
                                                        value={cond.lowerLimit ?? ''}
                                                        onChange={e => updateCondition(index, 'lowerLimit', e.target.value === '' ? null : parseFloat(e.target.value))}
                                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all placeholder:text-gray-300"
                                                    />
                                                </div>

                                                {/* Delete spacer for alignment */}
                                                <div className="col-span-1" />
                                            </div>

                                            {/* Compensation row */}
                                            <div className="mt-3 flex items-center gap-3">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase whitespace-nowrap">Service Credit:</label>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        placeholder="0"
                                                        value={cond.compensation || ''}
                                                        onChange={e => updateCondition(index, 'compensation', parseFloat(e.target.value) || 0)}
                                                        className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all placeholder:text-gray-300"
                                                    />
                                                    <span className="text-sm font-bold text-gray-400">% of MRC</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add more row button */}
                                <button
                                    onClick={addConditionRow}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 hover:border-brand-red/30 text-gray-400 hover:text-brand-red rounded-xl text-sm font-bold transition-all hover:bg-brand-red/5 active:scale-[0.98]"
                                >
                                    <Plus size={16} strokeWidth={2.5} />
                                    Add Range
                                </button>
                            </div>
                        )}

                        {/* =================== SAVING STATE =================== */}
                        {addStep === 'saving' && (
                            <div className="flex flex-col items-center justify-center py-16 gap-4 sla-fade-enter">
                                <div className="relative">
                                    <Loader2 className="w-12 h-12 animate-spin text-brand-red" />
                                </div>
                                <p className="text-sm font-bold text-gray-500">Saving SLA rule...</p>
                                <p className="text-[12px] text-gray-400">Please wait while we save your configuration</p>
                            </div>
                        )}

                        {/* =================== SAVED STATE =================== */}
                        {addStep === 'saved' && (
                            <div className="flex flex-col items-center justify-center py-16 gap-4 sla-fade-enter">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-green-400/20 rounded-full sla-pulse-ring" />
                                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 sla-checkmark-enter">
                                        <Check size={32} className="text-white" strokeWidth={3} />
                                    </div>
                                </div>
                                <p className="text-lg font-bold text-gray-900">SLA Rule Saved!</p>
                                <p className="text-sm text-gray-400">The rule has been added successfully</p>
                            </div>
                        )}
                    </div>

                    {/* Footer - Save button (only in define-rules step) */}
                    {addStep === 'define-rules' && (
                        <div className="px-8 py-5 border-t border-gray-100 flex-shrink-0 bg-white">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={resetAddFlow}
                                    className="flex-1 h-[48px] bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={conditions.length === 0}
                                    className={`flex-1 h-[48px] bg-brand-red text-white font-bold rounded-xl shadow-lg shadow-brand-red/20 hover:bg-[#d41c34] transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 ${conditions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Shield size={16} />
                                    Save SLA Rule
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
