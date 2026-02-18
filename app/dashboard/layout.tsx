'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link href="/dashboard">
                                    <span className="text-xl font-bold text-gray-900">
                                        Flowchart <span className="text-blue-600">Engine</span>
                                    </span>
                                </Link>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link
                                    href="/dashboard"
                                    className={`${isActive('/dashboard')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                >
                                    Upload New
                                </Link>
                                <Link
                                    href="/dashboard/history"
                                    className={`${isActive('/dashboard/history')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                >
                                    Statement History
                                </Link>
                            </div>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            {/* Placeholder for User Profile or Settings */}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="py-10">
                <header>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold leading-tight text-gray-900">
                            {pathname === '/dashboard' ? 'Upload Statement' :
                                pathname === '/dashboard/history' ? 'Statement History' :
                                    'Statement Details'}
                        </h1>
                    </div>
                </header>
                <main>
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        {/* Replace with your content */}
                        <div className="px-4 py-8 sm:px-0">
                            {children}
                        </div>
                        {/* /End replace */}
                    </div>
                </main>
            </div>
        </div>
    );
}
