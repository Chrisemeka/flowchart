'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => {
        return pathname === path
            ? 'text-primary border-b-2 border-primary'
            : 'text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-muted';
    };

    const isMobileActive = (path: string) => {
        return pathname === path
            ? 'bg-primary/5 text-primary border-l-4 border-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground';
    };

    return (
        <div className="min-h-screen bg-background">
            <nav className="bg-background border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link href="/dashboard" className="flex items-center gap-2">
                                    <Image
                                        src="/undraw_visual-data_1eya.svg"
                                        alt="Flowchart Logo"
                                        width={32}
                                        height={32}
                                        className="w-8 h-8"
                                    />
                                    <span className="text-xl font-bold tracking-tight text-foreground">
                                        Flow<span className="text-primary">chart</span>
                                    </span>
                                </Link>
                            </div>
                            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                                <Link
                                    href="/dashboard"
                                    className={`${isActive('/dashboard')} inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200`}
                                >
                                    Upload New
                                </Link>
                                <Link
                                    href="/dashboard/history"
                                    className={`${isActive('/dashboard/history')} inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200`}
                                >
                                    Statement History
                                </Link>
                                <Link
                                    href="/dashboard/compare"
                                    className={`${isActive('/dashboard/compare')} inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200`}
                                >
                                    Compare
                                </Link>
                            </div>
                        </div>
                        <div className="-mr-2 flex items-center sm:hidden">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                                aria-controls="mobile-menu"
                                aria-expanded="false"
                            >
                                <span className="sr-only">Open main menu</span>
                                <svg
                                    className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                                <svg
                                    className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`} id="mobile-menu">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link
                            href="/dashboard"
                            className={`${isMobileActive('/dashboard')} block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Upload New
                        </Link>
                        <Link
                            href="/dashboard/history"
                            className={`${isMobileActive('/dashboard/history')} block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Statement History
                        </Link>
                        <Link
                            href="/dashboard/compare"
                            className={`${isMobileActive('/dashboard/compare')} block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Compare
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="py-10">
                <header>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold leading-tight text-foreground tracking-tight">
                            {pathname === '/dashboard' ? 'Upload Statement' :
                                pathname === '/dashboard/history' ? 'Statement History' :
                                    pathname === '/dashboard/compare' ? 'Compare Statements' :
                                        'Statement Details'}
                        </h1>
                    </div>
                </header>
                <main>
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="px-4 py-8 sm:px-0">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
