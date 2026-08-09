import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import AuthLayout from '../../layouts/AuthLayout'

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        document.title = 'EdgeStone - Reset Password';
        if (!token) {
            setError('Invalid or missing reset token. Please request a new password reset link.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsSuccess(false)

        if (!token) {
            setError('Invalid reset token.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true)

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true)
                setTimeout(() => {
                    navigate('/login')
                }, 3000)
            } else {
                throw new Error(data.message || data.error || 'Failed to reset password');
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
                    <h1 className="text-[28px] font-bold mb-3 text-center text-[#2D3748]">Create New Password</h1>
                    <p className="text-[14px] text-gray-500 text-center mb-8">Your new password must be different from previous used passwords.</p>

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
                                <p className="text-[13px] font-semibold">Password reset successfully! Redirecting to login...</p>
                            </div>
                        )}
                    </div>

                    {!isSuccess && (
                        <form onSubmit={handleSubmit} className="space-y-7">
                            <div>
                                <Input
                                    label="New Password:"
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading || !token}
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-1 hover:text-brand-red transition-colors"
                                            disabled={isLoading || !token}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    }
                                />
                            </div>
                            
                            <div>
                                <Input
                                    label="Confirm New Password:"
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading || !token}
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="p-1 hover:text-brand-red transition-colors"
                                            disabled={isLoading || !token}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    }
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    disabled={!token}
                                    className="bg-brand-red hover:bg-brand-red-hover w-full py-4 rounded-lg text-white font-bold text-lg transition-transform active:scale-95 shadow-lg shadow-brand-red/20"
                                >
                                    Reset Password
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AuthLayout>
    )
}
