import React, { useEffect } from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/ui/Sidebar';

// Dummy Support Agents Data
const SUPPORT_AGENTS = [
    { id: 'agent-1', name: 'Soumyajit' },
    { id: 'agent-2', name: 'Priyanshu' }
]

const DashboardLayout: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const agent = SUPPORT_AGENTS.find(a => a.id === id);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    useEffect(() => {
        document.title = 'EdgeStone - Dashboard';
    }, []);

    if (!agent) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="h-screen w-full bg-white flex flex-col lg:flex-row font-sans selection:bg-brand-red selection:text-white overflow-hidden">
            <Sidebar
                agentName={agent.name}
                isMobileOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-gray-100 bg-white flex-shrink-0">
                    <img src="/assets/logo.png" alt="EdgeStone" className="h-8 w-auto" />
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-gray-500 hover:text-brand-red"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto bg-[#F9FAFB]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
