import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    MoreHorizontal,
    X,
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Image as ImageIcon,
    Link,
    Loader2,
    Check,
    ChevronDown,
    Type,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { signatureService, type Signature } from '../../services/signatureService';
import { useAuth } from '../../contexts/AuthContext';

// ─── Signature Editor Toolbar ─────────────────────────────────────────────────
const exec = (cmd: string, value?: string) => document.execCommand(cmd, false, value);

interface ToolbarButtonProps {
    onClick: () => void;
    title: string;
    active?: boolean;
    children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, title, active, children }) => (
    <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        title={title}
        className={`w-7 h-7 flex items-center justify-center rounded text-[13px] transition-all select-none
            ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
    >
        {children}
    </button>
);

// ─── Font Size Options ────────────────────────────────────────────────────────
const FONT_SIZES = ['8', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '36', '48', '72'];
const FONT_FAMILIES = ['Arial', 'Calibri', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma'];

// ─── Signature Editor Component ───────────────────────────────────────────────
interface SignatureEditorProps {
    initialContent: string;
    onChange: (html: string) => void;
    onImageUpload: (file: File) => Promise<string>;
}

const SignatureEditor: React.FC<SignatureEditorProps> = ({ initialContent, onChange, onImageUpload }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const imgInputRef = useRef<HTMLInputElement>(null);
    const [fontSize, setFontSize] = useState('12');
    const [fontFamily, setFontFamily] = useState('Arial');
    const [showFontMenu, setShowFontMenu] = useState(false);
    const [showFontFamilyMenu, setShowFontFamilyMenu] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);
    const savedRange = useRef<Range | null>(null);

    useEffect(() => {
        if (editorRef.current && initialContent !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = initialContent;
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        if (savedRange.current) {
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(savedRange.current);
        }
    };

    const handleInput = () => {
        onChange(editorRef.current?.innerHTML || '');
    };

    const execAndFocus = (cmd: string, value?: string) => {
        editorRef.current?.focus();
        exec(cmd, value);
        onChange(editorRef.current?.innerHTML || '');
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImg(true);
        try {
            const url = await onImageUpload(file);
            restoreSelection();
            editorRef.current?.focus();
            exec('insertHTML', `<img src="${url}" alt="signature-image" style="max-width:300px;height:auto;display:inline-block;" />`);
            onChange(editorRef.current?.innerHTML || '');
        } catch {
            toast.error('Failed to upload image');
        } finally {
            setUploadingImg(false);
            e.target.value = '';
        }
    };

    const handleLink = () => {
        const url = prompt('Enter URL:', 'https://');
        if (url) execAndFocus('createLink', url);
    };

    const setFontSizeCmd = (size: string) => {
        setFontSize(size);
        setShowFontMenu(false);
        // execCommand fontSize only supports 1-7; use styleWithCSS instead
        restoreSelection();
        editorRef.current?.focus();
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('fontSize', false, '7');
        // Find the inserted font elements and replace size attr with inline style
        const editor = editorRef.current;
        if (editor) {
            const fontEls = editor.querySelectorAll('font[size="7"]');
            fontEls.forEach(el => {
                (el as HTMLElement).style.fontSize = `${size}pt`;
                el.removeAttribute('size');
            });
        }
        onChange(editorRef.current?.innerHTML || '');
    };

    const setFontFamilyCmd = (font: string) => {
        setFontFamily(font);
        setShowFontFamilyMenu(false);
        restoreSelection();
        execAndFocus('fontName', font);
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 bg-[#f3f2f1] border-b border-gray-200">
                {/* Font Family */}
                <div className="relative">
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowFontFamilyMenu(v => !v); setShowFontMenu(false); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[12px] text-gray-700 hover:bg-gray-200 transition-all min-w-[100px]"
                    >
                        <Type size={12} />
                        <span className="truncate max-w-[80px]">{fontFamily}</span>
                        <ChevronDown size={10} className="flex-shrink-0 text-gray-400" />
                    </button>
                    {showFontFamilyMenu && (
                        <div className="absolute left-0 top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-xl z-[300] py-1 min-w-[160px] max-h-48 overflow-y-auto">
                            {FONT_FAMILIES.map(f => (
                                <button key={f} type="button" onMouseDown={(e) => { e.preventDefault(); setFontFamilyCmd(f); }}
                                    className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-blue-50 transition-all ${fontFamily === f ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                                    style={{ fontFamily: f }}>{f}</button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-px h-5 bg-gray-300 mx-0.5" />

                {/* Font Size */}
                <div className="relative">
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowFontMenu(v => !v); setShowFontFamilyMenu(false); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[12px] text-gray-700 hover:bg-gray-200 transition-all w-16"
                    >
                        <span>{fontSize}</span>
                        <ChevronDown size={10} className="text-gray-400 flex-shrink-0" />
                    </button>
                    {showFontMenu && (
                        <div className="absolute left-0 top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-xl z-[300] py-1 max-h-48 overflow-y-auto w-20">
                            {FONT_SIZES.map(s => (
                                <button key={s} type="button" onMouseDown={(e) => { e.preventDefault(); setFontSizeCmd(s); }}
                                    className={`w-full text-left px-3 py-1 text-[13px] hover:bg-blue-50 transition-all ${fontSize === s ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>{s}</button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-px h-5 bg-gray-300 mx-0.5" />

                <ToolbarButton onClick={() => execAndFocus('bold')} title="Bold (Ctrl+B)"><Bold size={13} strokeWidth={2.5} /></ToolbarButton>
                <ToolbarButton onClick={() => execAndFocus('italic')} title="Italic (Ctrl+I)"><Italic size={13} /></ToolbarButton>
                <ToolbarButton onClick={() => execAndFocus('underline')} title="Underline (Ctrl+U)"><Underline size={13} /></ToolbarButton>

                <div className="w-px h-5 bg-gray-300 mx-0.5" />

                <ToolbarButton onClick={() => execAndFocus('justifyLeft')} title="Align Left"><AlignLeft size={13} /></ToolbarButton>
                <ToolbarButton onClick={() => execAndFocus('justifyCenter')} title="Center"><AlignCenter size={13} /></ToolbarButton>
                <ToolbarButton onClick={() => execAndFocus('justifyRight')} title="Align Right"><AlignRight size={13} /></ToolbarButton>

                <div className="w-px h-5 bg-gray-300 mx-0.5" />

                {/* Font Color */}
                <label title="Font Color" className="relative w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer transition-all">
                    <span className="text-[12px] font-bold text-gray-700" style={{ textDecoration: 'underline', textDecorationColor: '#e53e3e', textDecorationThickness: '2px' }}>A</span>
                    <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => execAndFocus('foreColor', e.target.value)} title="Font Color" />
                </label>

                <div className="w-px h-5 bg-gray-300 mx-0.5" />

                {/* Image Upload */}
                <ToolbarButton
                    onClick={() => { saveSelection(); imgInputRef.current?.click(); }}
                    title="Insert Image"
                    active={uploadingImg}
                >
                    {uploadingImg ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                </ToolbarButton>
                <ToolbarButton onClick={handleLink} title="Insert Link"><Link size={13} /></ToolbarButton>

                <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" className="hidden" onChange={handleImageSelect} />
            </div>

            {/* Editable Content Area */}
            <div
                ref={editorRef}
                id="signature-editor"
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyUp={handleInput}
                onMouseUp={saveSelection}
                onKeyDown={saveSelection}
                className="min-h-[180px] p-4 text-[13px] text-gray-800 leading-relaxed focus:outline-none"
                style={{ fontFamily: 'Arial' }}
                data-placeholder="Type your signature here..."
            />
        </div>
    );
};

// ─── Default Dropdown ─────────────────────────────────────────────────────────
interface DefaultDropdownProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}

const DefaultDropdown: React.FC<DefaultDropdownProps> = ({ label, value, options, onChange }) => {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value);

    return (
        <div className="flex items-center gap-4">
            <span className="text-[13px] text-[#323130] w-48 flex-shrink-0">{label}</span>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    className="flex items-center justify-between gap-2 min-w-[220px] h-[30px] px-3 bg-white border border-[#8a8886] rounded text-[13px] text-[#323130] hover:border-[#106ebe] transition-all"
                >
                    <span className="truncate">{selected?.label || '(No signature)'}</span>
                    <ChevronDown size={12} className="flex-shrink-0 text-gray-500" />
                </button>
                {open && (
                    <>
                        <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />
                        <div className="absolute left-0 top-full mt-1 bg-white border border-[#8a8886] rounded shadow-lg z-[210] min-w-[220px] py-1 max-h-48 overflow-y-auto">
                            {options.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-[#deecf9] transition-all flex items-center justify-between
                                        ${opt.value === value ? 'bg-[#deecf9] text-[#106ebe]' : 'text-[#323130]'}`}
                                >
                                    {opt.label}
                                    {opt.value === value && <Check size={12} className="text-[#106ebe]" />}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Main SignaturesPage ──────────────────────────────────────────────────────
const SignaturesPage: React.FC = () => {
    const { user } = useAuth();
    const agentId = user?.id || '';
    const agentEmail = user?.email || '';

    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSignature, setEditingSignature] = useState<Signature | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [openMoreId, setOpenMoreId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Modal form state
    const [formName, setFormName] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formDefaultFor, setFormDefaultFor] = useState<'new' | 'reply' | 'both' | null>(null);

    // Default for new messages / replies (derived from signatures)
    const getDefault = (type: 'new' | 'reply') =>
        signatures.find(s => s.defaultFor === type || s.defaultFor === 'both')?.id || '';

    const handleSetDefault = async (type: 'new' | 'reply', sigId: string) => {
        const current = signatures.find(s => s.id === sigId);
        if (!current) {
            // Setting to "no signature" — clear existing default
            const toUpdate = signatures.find(s => s.defaultFor === type || s.defaultFor === 'both');
            if (toUpdate) {
                try {
                    const updated = await signatureService.updateSignature(toUpdate.id, {
                        defaultFor: toUpdate.defaultFor === 'both'
                            ? (type === 'new' ? 'reply' : 'new')
                            : null
                    });
                    setSignatures(prev => prev.map(s => s.id === updated.id ? updated : s));
                } catch { toast.error('Failed to update default'); }
            }
            return;
        }

        const newDefaultFor: 'new' | 'reply' | 'both' | null = (() => {
            if (current.defaultFor === null) return type;
            if (current.defaultFor === type) return type;
            if (current.defaultFor === 'both') return 'both';
            // e.g. current is 'new', setting 'reply' → 'both'
            return 'both';
        })();

        try {
            const updated = await signatureService.setDefault(current.id, newDefaultFor);
            // Re-fetch to get updated state after server-side conflict resolution
            const all = await signatureService.getSignatures(agentId);
            setSignatures(all);
            (_updated => {})(updated);
        } catch { toast.error('Failed to set default'); }
    };

    // Fetch signatures on mount
    useEffect(() => {
        if (!agentId) return;
        setLoading(true);
        signatureService.getSignatures(agentId)
            .then(setSignatures)
            .catch(() => toast.error('Failed to load signatures'))
            .finally(() => setLoading(false));
    }, [agentId]);

    useEffect(() => {
        document.title = 'Signatures — EdgeStone';
    }, []);

    const openCreate = () => {
        setEditingSignature(null);
        setFormName('');
        setFormContent('');
        setFormDefaultFor(null);
        setShowModal(true);
    };

    const openEdit = (sig: Signature) => {
        setEditingSignature(sig);
        setFormName(sig.name);
        setFormContent(sig.content);
        setFormDefaultFor(sig.defaultFor);
        setOpenMoreId(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) { toast.error('Signature name is required'); return; }
        if (!formContent.trim() || formContent === '<br>') { toast.error('Signature content is required'); return; }
        setSaving(true);
        try {
            if (editingSignature) {
                const updated = await signatureService.updateSignature(editingSignature.id, {
                    name: formName,
                    content: formContent,
                    defaultFor: formDefaultFor,
                });
                setSignatures(prev => prev.map(s => s.id === updated.id ? updated : s));
                toast.success('Signature updated');
            } else {
                const created = await signatureService.createSignature({
                    agentId,
                    name: formName,
                    content: formContent,
                    defaultFor: formDefaultFor || undefined,
                });
                setSignatures(prev => [created, ...prev]);
                toast.success('Signature created');
            }
            setShowModal(false);
        } catch (e: any) {
            toast.error(e.message || 'Failed to save signature');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await signatureService.deleteSignature(id);
            setSignatures(prev => prev.filter(s => s.id !== id));
            setDeleteConfirmId(null);
            toast.success('Signature deleted');
        } catch {
            toast.error('Failed to delete signature');
        }
    };

    // ─── Upload image via backend ───────────────────────
    const handleImageUpload = useCallback(async (file: File): Promise<string> => {
        // Validate size client-side (5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image must be smaller than 5MB');
        }
        return await signatureService.uploadImage(file);
    }, []);


    const sigOptions = [
        { value: '', label: '(No signature)' },
        ...signatures.map(s => ({ value: s.id, label: s.name })),
    ];

    return (
        <div className="h-full flex flex-col bg-white font-[Segoe_UI,_Arial,_sans-serif]">
            {/* Page Header — matches Outlook Settings top bar */}
            <div className="px-8 pt-8 pb-4 border-b border-[#edebe9]">
                <div className="flex items-start justify-between max-w-4xl">
                    <div>
                        <h1 className="text-[28px] font-semibold text-[#323130] mb-2">Signatures</h1>
                        <p className="text-[13px] text-[#605e5c] max-w-[500px] leading-relaxed">
                            You can add and modify signatures that can be added to your emails.
                            You can also choose which signature to add by default to your new emails and replies.
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        id="add-signature-btn"
                        className="flex items-center gap-2 px-4 h-[32px] bg-[#0f6cbd] text-white text-[13px] font-semibold rounded hover:bg-[#115ea3] transition-all active:scale-[0.98] flex-shrink-0 ml-8 mt-1"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        Add signature
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 max-w-4xl">
                {/* Divider */}
                <div className="h-px bg-[#edebe9] mb-6" />

                {/* Account Selector */}
                <div className="mb-6">
                    <p className="text-[14px] font-semibold text-[#323130] mb-2">The signatures for</p>
                    <div className="flex items-center gap-2 min-w-[340px] h-[30px] px-3 bg-white border border-[#8a8886] rounded text-[13px] text-[#323130] w-[340px]">
                        <span className="flex-1 truncate">{agentEmail}</span>
                        <ChevronDown size={12} className="flex-shrink-0 text-gray-500" />
                    </div>
                </div>

                {/* Default Selectors */}
                <div className="space-y-3 mb-8">
                    <DefaultDropdown
                        label="Default for new messages"
                        value={getDefault('new')}
                        options={sigOptions}
                        onChange={(id) => handleSetDefault('new', id)}
                    />
                    <DefaultDropdown
                        label="Default for replies and forwards"
                        value={getDefault('reply')}
                        options={sigOptions}
                        onChange={(id) => handleSetDefault('reply', id)}
                    />
                </div>

                {/* Divider */}
                <div className="h-px bg-[#edebe9] mb-4" />

                {/* Signature List */}
                {loading ? (
                    <div className="flex items-center gap-2 py-8 text-[#605e5c]">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-[13px]">Loading signatures...</span>
                    </div>
                ) : signatures.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#f3f2f1] flex items-center justify-center mb-4">
                            <Pencil size={24} className="text-[#8a8886]" />
                        </div>
                        <p className="text-[14px] font-semibold text-[#323130] mb-1">No signatures yet</p>
                        <p className="text-[13px] text-[#605e5c]">Click "+ Add signature" to create your first signature.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {signatures.map(sig => (
                            <div
                                key={sig.id}
                                className="flex items-center justify-between px-4 py-3 border border-[#edebe9] rounded hover:border-[#c8c6c4] bg-white transition-all group"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="text-[13px] text-[#323130] font-medium truncate">{sig.name}</span>
                                    {sig.defaultFor && (
                                        <span className="text-[11px] text-[#0f6cbd] bg-[#deecf9] px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                                            {sig.defaultFor === 'both' ? 'New & Replies' : sig.defaultFor === 'new' ? 'New messages' : 'Replies'}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1">
                                    {/* Edit */}
                                    <button
                                        onClick={() => openEdit(sig)}
                                        id={`edit-sig-${sig.id}`}
                                        title="Edit signature"
                                        className="w-8 h-8 flex items-center justify-center text-[#605e5c] hover:text-[#323130] hover:bg-[#f3f2f1] rounded transition-all"
                                    >
                                        <Pencil size={15} />
                                    </button>

                                    {/* Delete */}
                                    {deleteConfirmId === sig.id ? (
                                        <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
                                            <button
                                                onClick={() => handleDelete(sig.id)}
                                                className="px-2 py-1 text-[11px] font-bold text-white bg-red-600 rounded hover:bg-red-700 transition-all"
                                            >Delete</button>
                                            <button
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="px-2 py-1 text-[11px] font-bold text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-all"
                                            >Cancel</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirmId(sig.id)}
                                            id={`delete-sig-${sig.id}`}
                                            title="Delete signature"
                                            className="w-8 h-8 flex items-center justify-center text-[#605e5c] hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}

                                    {/* More */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenMoreId(openMoreId === sig.id ? null : sig.id)}
                                            title="More options"
                                            className="w-8 h-8 flex items-center justify-center text-[#605e5c] hover:text-[#323130] hover:bg-[#f3f2f1] rounded transition-all"
                                        >
                                            <MoreHorizontal size={15} />
                                        </button>

                                        {openMoreId === sig.id && (
                                            <>
                                                <div className="fixed inset-0 z-[150]" onClick={() => setOpenMoreId(null)} />
                                                <div className="absolute right-0 top-full mt-1 bg-white border border-[#8a8886] rounded shadow-lg z-[160] py-1 min-w-[180px] animate-in fade-in slide-in-from-top-1 duration-150">
                                                    <button
                                                        onClick={() => openEdit(sig)}
                                                        className="w-full text-left px-3 py-2 text-[13px] text-[#323130] hover:bg-[#deecf9] transition-all flex items-center gap-2"
                                                    >
                                                        <Pencil size={13} /> Rename / Edit
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            setOpenMoreId(null);
                                                            try {
                                                                const updated = await signatureService.setDefault(sig.id, 'new');
                                                                setSignatures(prev => prev.map(s => s.id === updated.id ? updated : { ...s, defaultFor: s.defaultFor === 'new' || s.defaultFor === 'both' ? (s.defaultFor === 'both' ? 'reply' : null) : s.defaultFor }));
                                                                const all = await signatureService.getSignatures(agentId);
                                                                setSignatures(all);
                                                                toast.success('Set as default for new messages');
                                                            } catch { toast.error('Failed to set default'); }
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-[13px] text-[#323130] hover:bg-[#deecf9] transition-all"
                                                    >
                                                        Set as default (New messages)
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            setOpenMoreId(null);
                                                            try {
                                                                const updated = await signatureService.setDefault(sig.id, 'reply');
                                                                (_updated => {})(updated);
                                                                const all = await signatureService.getSignatures(agentId);
                                                                setSignatures(all);
                                                                toast.success('Set as default for replies');
                                                            } catch { toast.error('Failed to set default'); }
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-[13px] text-[#323130] hover:bg-[#deecf9] transition-all"
                                                    >
                                                        Set as default (Replies)
                                                    </button>
                                                    <div className="h-px bg-[#edebe9] my-1" />
                                                    <button
                                                        onClick={() => { setOpenMoreId(null); setDeleteConfirmId(sig.id); }}
                                                        className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-all flex items-center gap-2"
                                                    >
                                                        <Trash2 size={13} /> Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Create / Edit Modal ────────────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/30 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-[0_16px_64px_rgba(0,0,0,0.22)] w-full max-w-[720px] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
                        style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#edebe9]">
                            <h2 className="text-[20px] font-semibold text-[#323130]">
                                {editingSignature ? 'Edit signature' : 'New signature'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 flex items-center justify-center text-[#605e5c] hover:text-[#323130] hover:bg-[#f3f2f1] rounded transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Name Field */}
                            <div>
                                <label className="block text-[13px] font-semibold text-[#323130] mb-1.5">
                                    Signature name
                                </label>
                                <input
                                    type="text"
                                    id="sig-name-input"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    placeholder="e.g. Priyanshu Routh CTO AeroTalk"
                                    className="w-full h-[32px] px-3 border border-[#8a8886] rounded text-[13px] text-[#323130] focus:outline-none focus:border-[#106ebe] focus:ring-1 focus:ring-[#106ebe] transition-all"
                                />
                            </div>

                            {/* Editor */}
                            <div>
                                <label className="block text-[13px] font-semibold text-[#323130] mb-1.5">
                                    Edit signature
                                </label>
                                <SignatureEditor
                                    key={editingSignature?.id || 'new'}
                                    initialContent={formContent}
                                    onChange={setFormContent}
                                    onImageUpload={handleImageUpload}
                                />
                                <p className="mt-1.5 text-[11px] text-[#605e5c]">
                                    Tip: Use the image button to insert logos or photos. Images embed as inline data for best compatibility.
                                </p>
                            </div>

                            {/* Default For */}
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#edebe9]">
                                <DefaultDropdown
                                    label="Default for new messages"
                                    value={formDefaultFor === 'new' || formDefaultFor === 'both' ? '__this__' : ''}
                                    options={[
                                        { value: '', label: '(No signature)' },
                                        { value: '__this__', label: `This signature (${formName || 'current'})` },
                                    ]}
                                    onChange={(v) => {
                                        if (v === '__this__') {
                                            setFormDefaultFor(formDefaultFor === 'reply' ? 'both' : 'new');
                                        } else {
                                            setFormDefaultFor(formDefaultFor === 'both' ? 'reply' : formDefaultFor === 'new' ? null : formDefaultFor);
                                        }
                                    }}
                                />
                                <DefaultDropdown
                                    label="Default for replies"
                                    value={formDefaultFor === 'reply' || formDefaultFor === 'both' ? '__this__' : ''}
                                    options={[
                                        { value: '', label: '(No signature)' },
                                        { value: '__this__', label: `This signature (${formName || 'current'})` },
                                    ]}
                                    onChange={(v) => {
                                        if (v === '__this__') {
                                            setFormDefaultFor(formDefaultFor === 'new' ? 'both' : 'reply');
                                        } else {
                                            setFormDefaultFor(formDefaultFor === 'both' ? 'new' : formDefaultFor === 'reply' ? null : formDefaultFor);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#edebe9] bg-[#faf9f8]">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 h-[32px] border border-[#8a8886] text-[13px] text-[#323130] rounded hover:bg-[#f3f2f1] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                id="save-signature-btn"
                                className="flex items-center gap-2 px-4 h-[32px] bg-[#0f6cbd] text-white text-[13px] font-semibold rounded hover:bg-[#115ea3] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {saving && <Loader2 size={13} className="animate-spin" />}
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignaturesPage;
