import { useParams, useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/ui/Sidebar'

// Dummy Support Agents Data (Consolidated)
const SUPPORT_AGENTS = [
    { id: 'agent-1', name: 'Soumyajit Dhar', role: 'Senior Support Lead' },
    { id: 'agent-2', name: 'Priyanshu Routh', role: 'Support Specialist' }
]

export default function DashboardPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const agent = SUPPORT_AGENTS.find(a => a.id === id)

    if (!agent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tighter">404</h1>
                    <p className="text-gray-600 mb-6 font-medium">Agent not found.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-brand-red font-bold hover:underline uppercase text-sm tracking-widest"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white flex font-sans selection:bg-brand-red selection:text-white">
            {/* Sidebar Component */}
            <Sidebar agentName={agent.name} />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {/* Workspace Card */}
                    <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <span className="text-brand-red font-bold text-[10px] uppercase tracking-[0.3em] mb-4 block">Workspace / Overview</span>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Welcome, {agent.name}</h1>
                        <p className="text-gray-500 font-medium max-w-md leading-relaxed text-[15px]">
                            Your operational panel is ready. Use the sidebar to navigate between tickets, clients, and vendor management.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
