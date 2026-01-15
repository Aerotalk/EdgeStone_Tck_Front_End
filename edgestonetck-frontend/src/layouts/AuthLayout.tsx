import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="h-screen flex items-center justify-center bg-white p-4 selection:bg-brand-red selection:text-white overflow-hidden">
            <div className="w-full max-w-[600px]">
                {children}
            </div>
        </div>
    );
}
