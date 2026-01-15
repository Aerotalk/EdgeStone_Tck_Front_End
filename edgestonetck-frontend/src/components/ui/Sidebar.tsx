import React, { useState } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import {
    PieChart,
    Files,
    User as UserIcon,
    Building2,
    UserPlus,
    FileText,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    LogOut,
    X
} from 'lucide-react';

interface SidebarProps {
    agentName: string;
    isMobileOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ agentName, isMobileOpen, onClose }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const menuItems = [
        { icon: PieChart, label: 'Dashboard', path: 'overview' },
        { icon: Files, label: 'Tickets', path: 'tickets' },
        { icon: UserIcon, label: 'Client', path: 'clients' },
        { icon: Building2, label: 'Vendor', path: 'vendors' },
        { icon: UserPlus, label: 'Assign agent', path: 'assign-agents' },
        { icon: FileText, label: 'SLA', path: 'sla' },
    ];

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <div
                className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 flex flex-col transition-[width,transform] duration-300 ease-in-out lg:relative lg:z-30 h-screen will-change-[width] ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72`}
            >
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 text-gray-400 lg:hidden hover:text-brand-red transition-colors"
                >
                    <X size={24} />
                </button>

                <div className={`p-4 h-[110px] flex items-center justify-center overflow-hidden transition-[padding] duration-300 ${isCollapsed ? 'lg:px-2' : 'px-4'}`}>
                    <img
                        src="/assets/logo.png"
                        alt="EdgeStone"
                        className={`h-14 w-auto transition-transform duration-300 ${isCollapsed ? 'scale-75' : 'scale-100'}`}
                    />
                </div>

                {/* Collapse Button (Desktop Only) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`absolute -right-4 top-11 w-8 h-8 hidden lg:flex items-center justify-center transition-all z-50 shadow-lg rounded-full border-2 border-white group hover:scale-110 active:scale-95 ${isCollapsed
                        ? 'bg-brand-red text-white shadow-red-200'
                        : 'bg-white text-gray-400 hover:text-brand-red hover:bg-gray-50 shadow-gray-200'
                        }`}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? (
                        <ChevronRight size={18} strokeWidth={3} />
                    ) : (
                        <ChevronLeft size={18} strokeWidth={3} />
                    )}
                </button>

                {/* Navigation */}
                <nav className={`flex-1 py-6 space-y-1.5 overflow-hidden transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    {menuItems.map((item, idx) => (
                        <NavLink
                            key={idx}
                            to={`/dashboard/${id}/${item.path}`}
                            onClick={() => onClose?.()}
                            className={({ isActive }) =>
                                `flex items-center rounded-lg transition-all group whitespace-nowrap py-3 ${isCollapsed ? 'justify-center px-0' : 'gap-4 px-4'
                                } ${isActive
                                    ? 'bg-brand-red text-white shadow-sm'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`flex-shrink-0 ${isActive ? '' : 'text-gray-400 group-hover:text-gray-500 transition-colors'}`} />
                                    <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'}`}>
                                        <span className="font-semibold text-[15px] whitespace-nowrap">{item.label}</span>
                                    </div>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer / Profile */}
                <div className={`border-t border-gray-100 relative transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
                    <div className={`flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors ${isCollapsed ? 'flex-col' : ''}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-700 font-bold flex-shrink-0 text-sm">
                                {agentName.charAt(0)}
                            </div>
                            <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'}`}>
                                <span className="text-[14px] font-bold text-gray-900 truncate block uppercase tracking-tight whitespace-nowrap">
                                    {agentName}
                                </span>
                            </div>
                        </div>

                        <div className="relative">
                            {!isCollapsed && (
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <MoreVertical size={20} />
                                </button>
                            )}

                            {showMenu && !isCollapsed && (
                                <div
                                    className="absolute bottom-full right-0 mb-3 bg-white border border-gray-100 rounded-lg shadow-xl py-2 min-w-[150px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                                >
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-brand-red hover:bg-red-50 text-sm font-bold transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Log out
                                    </button>
                                </div>
                            )}

                            {isCollapsed && (
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-400 hover:text-brand-red transition-colors"
                                    title="Logout"
                                >
                                    <LogOut size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
