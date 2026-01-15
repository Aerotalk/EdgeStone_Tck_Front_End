import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import AuthLayout from '../../layouts/AuthLayout'

// Dummy Support Agents
const SUPPORT_AGENTS = [
    { id: 'agent-1', email: 'agent.one@edgestone.com', password: 'password123', name: 'Soumyajit' },
    { id: 'agent-2', email: 'agent.two@edgestone.com', password: 'password456', name: 'Priyanshu' }
]

export default function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [rememberMe, setRememberMe] = useState(true)

    useEffect(() => {
        document.title = 'EdgeStone - Login';
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsSuccess(false)
        setIsLoading(true)

        // Simulate API delay
        setTimeout(() => {
            const user = SUPPORT_AGENTS.find(u => u.email === email)

            if (!user) {
                setError('User does not exist.')
                setIsLoading(false)
            } else if (user.password !== password) {
                setError('Credentials incorrect.')
                setIsLoading(false)
            } else {
                setIsSuccess(true)
                setIsLoading(false)
                // Redirect after a short delay
                setTimeout(() => {
                    navigate(`/dashboard/${user.id}`)
                }, 1500)
            }
        }, 1500)
    }

    return (
        <AuthLayout>
            <div className="flex flex-col items-center">
                {/* Logo Section */}
                <div className="mb-4">
                    <img
                        src="/assets/logo.png"
                        alt="EdgeStone Logo"
                        className="h-16 w-auto"
                    />
                </div>

                {/* Login Card */}
                <div className="bg-white px-6 sm:px-12 py-10 rounded-xl shadow-[0_1px_5px_rgba(0,0,0,0.05)] border border-gray-100 w-full max-w-[500px]">
                    <h1 className="text-[28px] font-bold mb-3 text-center text-[#2D3748]">Login to Account</h1>
                    <p className="text-[14px] text-gray-500 text-center mb-8">Please enter your email and password to continue</p>

                    {/* Status Messages */}
                    <div className={`${(error || isSuccess) ? 'mb-6' : 'h-0 invisible'}`}>
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-brand-red/20 text-brand-red rounded-lg">
                                <AlertCircle size={18} />
                                <p className="text-[13px] font-semibold">{error}</p>
                            </div>
                        )}
                        {isSuccess && (
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 text-green-600 rounded-lg">
                                <CheckCircle2 size={18} />
                                <p className="text-[13px] font-semibold">Login successful! Redirecting...</p>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-7">
                        <div>
                            <Input
                                label="Email address:"
                                type="email"
                                id="email"
                                placeholder="esteban_schiller@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading || isSuccess}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label htmlFor="password" title="Password" className="text-[14px] font-medium text-gray-600 ml-0.5">
                                    Password
                                </label>
                                <a href="#" className="text-[14px] font-medium text-gray-400 hover:text-brand-red transition-colors">
                                    Forget Password?
                                </a>
                            </div>
                            <Input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                placeholder="••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading || isSuccess}
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1 hover:text-brand-red transition-colors"
                                        disabled={isLoading || isSuccess}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-brand-red focus:ring-brand-red cursor-pointer accent-brand-red"
                                    disabled={isLoading || isSuccess}
                                />
                            </div>
                            <label htmlFor="remember" className="text-[14px] text-gray-500 font-medium cursor-pointer">
                                Remember Password
                            </label>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                isLoading={isLoading}
                                disabled={isSuccess}
                                className={isSuccess ? "bg-green-600 w-full py-4 rounded-lg" : "bg-brand-red hover:bg-brand-red-hover w-full py-4 rounded-lg text-white font-bold text-lg transition-transform active:scale-95 shadow-lg shadow-brand-red/20"}
                            >
                                {isSuccess ? "Redirecting..." : "Sign In"}
                            </Button>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-[14px] font-medium text-gray-400">
                                Don't have an account? <a href="#" className="text-[#4C51BF] font-bold hover:underline ml-1">Create Account</a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </AuthLayout>
    )
}
