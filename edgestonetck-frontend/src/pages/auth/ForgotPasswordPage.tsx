import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import AuthLayout from '../../layouts/AuthLayout'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        document.title = 'EdgeStone - Forgot Password';
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsSuccess(false)
        setIsLoading(true)

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true)
            } else {
                throw new Error(data.message || data.error || 'Failed to send reset link');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred.')
        } finally {
            setIsLoading(false)
        }
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

                {/* Card */}
                <div className="bg-white px-6 sm:px-12 py-10 rounded-xl shadow-[0_1px_5px_rgba(0,0,0,0.05)] border border-gray-100 w-full max-w-[500px]">
                    <div className="flex items-center gap-2 mb-3">
                        <Link to="/login" className="text-gray-400 hover:text-brand-red transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-[28px] font-bold text-[#2D3748]">Reset Password</h1>
                    </div>
                    <p className="text-[14px] text-gray-500 mb-8">Enter your email address and we'll send you a link to reset your password.</p>

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
                                <p className="text-[13px] font-semibold">If an account exists, a reset link has been sent to your email.</p>
                            </div>
                        )}
                    </div>

                    {!isSuccess && (
                        <form onSubmit={handleSubmit} className="space-y-7">
                            <div>
                                <Input
                                    label="Email address:"
                                    type="email"
                                    id="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    className="bg-brand-red hover:bg-brand-red-hover w-full py-4 rounded-lg text-white font-bold text-lg transition-transform active:scale-95 shadow-lg shadow-brand-red/20"
                                >
                                    Send Reset Link
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AuthLayout>
    )
}
