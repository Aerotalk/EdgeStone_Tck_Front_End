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
        className={`w-8 h-8 flex items-center justify-center rounded-lg text-[14px] transition-all select-none
            ${active ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
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
    }, [initialContent]);

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
        restoreSelection();
        editorRef.current?.focus();
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('fontSize', false, '7');
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
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white ring-4 ring-gray-900/5 focus-within:border-gray-300 transition-all">
            {/* Toolbar */}
            <div className="flex items-center flex-wrap gap-1 px-3 py-2 bg-gray-50 border-b border-gray-100">
                {/* Font Family */}
                <div className="relative">
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowFontFamilyMenu(v => !v); setShowFontMenu(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all min-w-[120px]"
                    >
                        <Type size={14} />
                        <span className="truncate max-w-[80px]">{fontFamily}</span>
                        <ChevronDown size={14} className="flex-shrink-0 text-gray-400" />
                    </button>
                    {showFontFamilyMenu && (
                        <div className="absolute left-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_20px_60px_-12px_rgba(15,23,42,0.15)] z-[300] py-1.5 min-w-[180px] max-h-56 overflow-y-auto animate-in slide-in-from-top-2">
                            {FONT_FAMILIES.map(f => (
                                <button key={f} type="button" onMouseDown={(e) => { e.preventDefault(); setFontFamilyCmd(f); }}
                                    className={`w-full text-left px-4 py-2 text-[14px] hover:bg-gray-50 transition-all ${fontFamily === f ? 'text-gray-900 font-bold' : 'text-gray-600'}`}
                                    style={{ fontFamily: f }}>{f}</button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Font Size */}
                <div className="relative">
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowFontMenu(v => !v); setShowFontFamilyMenu(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all w-[72px]"
                    >
                        <span>{fontSize}</span>
                        <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                    </button>
                    {showFontMenu && (
                        <div className="absolute left-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_20px_60px_-12px_rgba(15,23,42,0.15)] z-[300] py-1.5 max-h-56 overflow-y-auto w-24 animate-in slide-in-from-top-2">
                            {FONT_SIZES.map(s => (
                                <button key={s} type="button" onMouseDown={(e) => { e.preventDefault(); setFontSizeCmd(s); }}
                                    className={`w-full text-left px-4 py-2 text-[14px] hover:bg-gray-50 transition-all ${fontSize === s ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{s}</button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                <ToolbarButton onClick={() => execAndFocus('bold')} title="Bold (Ctrl+B)"><Bold size={15} strokeWidth={2.5} /></ToolbarButton>
                <ToolbarButton onClick={() => execAndFocus('italic')} title="Italic (Ctrl+I)"><Italic size={15} /></ToolbarButton>
                <ToolbarButton onClick={() => execAndFocus('underline')} title="Underline (Ctrl+U)"><Underline size={15} /></ToolbarButton>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                <ToolbarButton onClick={() => execAndFocus('justifyLeft')} title="Align Left"><AlignLeft size={15} /></ToolbarButton>
                <ToolbarButton onClick={() => execAndFocus('justifyCenter')} title="Center"><AlignCenter size={15} /></ToolbarButton>
                <ToolbarButton onClick={() => execAndFocus('justifyRight')} title="Align Right"><AlignRight size={15} /></ToolbarButton>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Font Color */}
                <label title="Font Color" className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer transition-all">
                    <span className="text-[14px] font-bold text-gray-700" style={{ textDecoration: 'underline', textDecorationColor: '#F97316', textDecorationThickness: '2px' }}>A</span>
                    <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => execAndFocus('foreColor', e.target.value)} title="Font Color" />
                </label>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Image Upload */}
                <ToolbarButton
                    onClick={() => { saveSelection(); imgInputRef.current?.click(); }}
                    title="Insert Image"
                    active={uploadingImg}
                >
                    {uploadingImg ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                </ToolbarButton>
                <ToolbarButton onClick={handleLink} title="Insert Link"><Link size={15} /></ToolbarButton>

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
                className="min-h-[220px] p-6 text-[14px] text-gray-800 leading-relaxed focus:outline-none"
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
        <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">{label}</span>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    className={`w-full min-h-[52px] border rounded-2xl px-4 flex items-center justify-between transition-all active:scale-[0.98] ${open ? 'bg-white border-[#0F172A] ring-4 ring-[#0F172A]/5' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'}`}
                >
                    <span className={`text-[14px] font-bold truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>{selected?.label || '(No signature)'}</span>
                    <ChevronDown size={16} className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-gray-900' : 'text-gray-400'}`} />
                </button>
                {open && (
                    <>
                        <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />
                        <div className="absolute left-0 top-full mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-[0_20px_60px_-12px_rgba(15,23,42,0.15)] z-[210] overflow-hidden py-1.5 animate-in slide-in-from-top-2 duration-200">
                            {options.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    className={`w-full text-left px-4 py-3 text-[13px] font-semibold transition-all flex items-center justify-between
                                        ${opt.value === value ? 'bg-gray-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-900'}`}
                                >
                                    {opt.label}
                                    {opt.value === value && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
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
    const agentName = user?.name || '';
    const agentRole = user?.role || 'Support Agent';

    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSignature, setEditingSignature] = useState<Signature | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [openMoreId, setOpenMoreId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [formName, setFormName] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formDefaultFor, setFormDefaultFor] = useState<'new' | 'reply' | 'both' | null>(null);

    const getDefault = (type: 'new' | 'reply') =>
        signatures.find(s => s.defaultFor === type || s.defaultFor === 'both')?.id || '';

    const handleSetDefault = async (type: 'new' | 'reply', sigId: string) => {
        const current = signatures.find(s => s.id === sigId);
        if (!current) {
            const toUpdate = signatures.find(s => s.defaultFor === type || s.defaultFor === 'both');
            if (toUpdate) {
                try {
                    const updated = await signatureService.updateSignature(toUpdate.id, {
                        defaultFor: toUpdate.defaultFor === 'both' ? (type === 'new' ? 'reply' : 'new') : null
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
            return 'both';
        })();

        try {
            const updated = await signatureService.setDefault(current.id, newDefaultFor);
            const all = await signatureService.getSignatures(agentId);
            setSignatures(all);
            (_updated => {})(updated); 
        } catch { toast.error('Failed to set default'); }
    };

    useEffect(() => {
        if (!agentId) return;
        setLoading(true);
        signatureService.getSignatures(agentId)
            .then(setSignatures)
            .catch(() => toast.error('Failed to load signatures'))
            .finally(() => setLoading(false));
    }, [agentId]);

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

    const handleImageUpload = useCallback(async (file: File): Promise<string> => {
        if (file.size > 5 * 1024 * 1024) throw new Error('Image must be smaller than 5MB');
        try {
            const formData = new FormData();
            formData.append('image', file);
            const apiKey = '8ab75421ccecda2f5b61e2cbacdbab8f';
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data && data.success && data.data && data.data.url) return data.data.url;
            throw new Error('ImgBB upload response invalid');
        } catch (error) {
            console.error('External upload failed, falling back to data URL:', error);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (typeof e.target?.result === 'string') resolve(e.target.result);
                    else reject(new Error('Failed to read image fallback'));
                };
                reader.onerror = () => reject(new Error('Failed to read image fallback'));
                reader.readAsDataURL(file);
            });
        }
    }, []);

    const sigOptions = [
        { value: '', label: '(No signature)' },
        ...signatures.map(s => ({ value: s.id, label: s.name })),
    ];

    return (
        <div className="h-full flex flex-col bg-white font-sans">
            {/* Header Area */}
            <div className="px-10 py-8 border-b border-gray-50 flex items-start justify-between">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900 tracking-tight mb-2">My Account</h1>
                    <p className="text-[14px] text-gray-500 max-w-[500px] leading-relaxed font-medium">
                        View your profile details and manage your custom email signatures.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-[14px] font-bold rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98] shadow-[0_12px_24px_-8px_rgba(249,115,22,0.3)] flex-shrink-0 ml-8 mr-10 cursor-pointer relative z-10"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    New Signature
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-10 py-8">
                {/* Account Settings */}
                <div className="mb-10 animate-in slide-in-from-bottom-2 duration-300">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Profile Details</p>
                    <div className="flex items-center gap-4 px-5 py-4 bg-gray-50/80 border border-gray-100 rounded-2xl w-full max-w-2xl">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shadow-sm border border-orange-200/50">
                            {(agentName[0] || agentEmail[0] || 'U').toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-[16px] text-gray-900 truncate">{agentName || 'User'}</span>
                            <span className="font-medium text-[13px] text-gray-500">{agentEmail}</span>
                        </div>
                        <div className="ml-auto">
                            <span className="px-3 py-1 bg-gray-200/50 text-gray-600 text-[12px] font-bold rounded-lg uppercase tracking-wide">
                                {agentRole}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Default Selectors */}
                <div className="grid grid-cols-2 gap-6 mb-10 pb-8 border-b border-gray-50 animate-in slide-in-from-bottom-2 duration-300 delay-75">
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

                {/* Signature List */}
                <div className="animate-in slide-in-from-bottom-2 duration-300 delay-150">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Saved Signatures</p>
                    {loading ? (
                        <div className="flex items-center gap-3 py-10 text-gray-400 font-bold justify-center w-full bg-gray-50 border border-gray-100 border-dashed rounded-3xl">
                            <Loader2 size={18} className="animate-spin text-orange-500" />
                            <span>Loading your signatures...</span>
                        </div>
                    ) : signatures.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50 border border-gray-100 border-dashed rounded-3xl">
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-5 shadow-sm border border-gray-100/50">
                                <Pencil size={28} className="text-gray-300" />
                            </div>
                            <p className="text-[16px] font-bold text-gray-900 mb-2">It's a bit empty here</p>
                            <p className="text-[14px] font-medium text-gray-500 max-w-[280px]">Create your very first email signature to start giving your replies a professional touch.</p>
                            <button
                                onClick={openCreate}
                                className="mt-6 font-bold text-orange-500 hover:text-orange-600 transition-colors"
                            >
                                + Add a Signature
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {signatures.map(sig => (
                                <div
                                    key={sig.id}
                                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-300 hover:shadow-lg hover:shadow-gray-900/5 transition-all duration-300 group"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0 pl-2">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-50 to-white border border-orange-100/50 flex items-center justify-center text-orange-500 shadow-sm flex-shrink-0">
                                            <Type size={18} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[15px] text-gray-900 font-bold truncate">{sig.name}</span>
                                            {sig.defaultFor && (
                                                <span className="text-[12px] text-orange-500 font-bold bg-orange-50 w-fit px-2 py-0.5 rounded-md">
                                                    Default for {sig.defaultFor === 'both' ? 'New & Replies' : sig.defaultFor === 'new' ? 'New messages' : 'Replies'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pr-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Edit */}
                                        <button
                                            onClick={() => openEdit(sig)}
                                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                                        >
                                            <Pencil size={18} />
                                        </button>

                                        {/* Delete */}
                                        {deleteConfirmId === sig.id ? (
                                            <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
                                                <button
                                                    onClick={() => handleDelete(sig.id)}
                                                    className="px-4 py-2 text-[12px] font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all shadow-md shadow-red-200"
                                                >Delete</button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(null)}
                                                    className="px-4 py-2 text-[12px] font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                                                >Cancel</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirmId(sig.id)}
                                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}

                                        {/* More Options */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMoreId(openMoreId === sig.id ? null : sig.id)}
                                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {openMoreId === sig.id && (
                                                <>
                                                    <div className="fixed inset-0 z-[150]" onClick={() => setOpenMoreId(null)} />
                                                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_60px_-12px_rgba(15,23,42,0.15)] z-[160] py-1.5 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-150">
                                                        <button
                                                            onClick={async () => {
                                                                setOpenMoreId(null);
                                                                try {
                                                                    const updated = await signatureService.setDefault(sig.id, 'new');
                                                                    setSignatures(prev => prev.map(s => s.id === updated.id ? updated : { ...s, defaultFor: s.defaultFor === 'new' || s.defaultFor === 'both' ? (s.defaultFor === 'both' ? 'reply' : null) : s.defaultFor }));
                                                                    toast.success('Set as default for new messages');
                                                                } catch { toast.error('Failed to set default'); }
                                                            }}
                                                            className="w-full text-left px-4 py-3 text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                                        >
                                                            Set default (New messages)
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                setOpenMoreId(null);
                                                                try {
                                                                    const updated = await signatureService.setDefault(sig.id, 'reply');
                                                                    setSignatures(prev => prev.map(s => s.id === updated.id ? updated : { ...s, defaultFor: s.defaultFor === 'reply' || s.defaultFor === 'both' ? (s.defaultFor === 'both' ? 'new' : null) : s.defaultFor }));
                                                                    toast.success('Set as default for replies');
                                                                } catch { toast.error('Failed to set default'); }
                                                            }}
                                                            className="w-full text-left px-4 py-3 text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                                        >
                                                            Set default (Replies)
                                                        </button>
                                                        <div className="h-px bg-gray-50 my-1.5 mx-2" />
                                                        <button
                                                            onClick={() => { setOpenMoreId(null); setDeleteConfirmId(sig.id); }}
                                                            className="w-full text-left px-4 py-3 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-all flex items-center gap-2"
                                                        >
                                                            <Trash2 size={16} /> Delete
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
            </div>

            {/* ─── Create / Edit Modal ────────────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-[#0F172A]/30 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-[0_32px_128px_-12px_rgba(15,23,42,0.3)] w-full max-w-[800px] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 relative border border-white">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-50">
                            <div>
                                <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">
                                    {editingSignature ? 'Edit Signature' : 'New Signature'}
                                </h2>
                                <p className="text-[14px] text-gray-500 font-medium mt-1">Design your custom email footer.</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                            {/* Name Field */}
                            <div className="flex flex-col">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-1">
                                    Signature Name
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    placeholder="e.g. Priyanshu Routh - CTO AeroTalk"
                                    className="w-full h-[56px] px-5 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:bg-white transition-all"
                                />
                            </div>

                            {/* Editor */}
                            <div className="flex flex-col">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-1">
                                    Compose
                                </label>
                                <SignatureEditor
                                    key={editingSignature?.id || 'new'}
                                    initialContent={formContent}
                                    onChange={setFormContent}
                                    onImageUpload={handleImageUpload}
                                />
                                <p className="mt-3 text-[12px] text-gray-400 font-medium flex items-center gap-2 px-1">
                                    <ImageIcon size={14} className="text-gray-300" /> Feel free to embed logos directly using the image tool.
                                </p>
                            </div>

                            {/* Default For */}
                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <DefaultDropdown
                                    label="Default for new messages"
                                    value={formDefaultFor === 'new' || formDefaultFor === 'both' ? '__this__' : ''}
                                    options={[
                                        { value: '', label: '(No signature)' },
                                        { value: '__this__', label: `This signature (${formName || 'Current'})` },
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
                                        { value: '__this__', label: `This signature (${formName || 'Current'})` },
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
                        <div className="flex items-center justify-end gap-3 px-10 py-6 border-t border-gray-50 bg-gray-50/50 rounded-b-[32px]">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 text-[14px] font-bold text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-white rounded-xl transition-all"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-3 bg-orange-500 text-white text-[14px] font-bold rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98] shadow-[0_12px_24px_-8px_rgba(249,115,22,0.3)] disabled:opacity-60 disabled:cursor-not-allowed group"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Signature'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignaturesPage;
