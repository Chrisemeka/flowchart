import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Server } from 'lucide-react';
import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                </div>

                <div className="bg-white shadow-sm border border-border rounded-xl p-8 sm:p-12">
                    <div className="mb-8 border-b border-border pb-8">
                        <h1 className="text-3xl font-light tracking-tight text-foreground mb-4">
                            Privacy Policy for <span className="font-semibold text-primary">Flowchart</span>
                        </h1>
                        <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground gap-2 sm:gap-6">
                            <span><strong>Effective Date:</strong> February 19, 2026</span>
                            <span className="hidden sm:inline">&bull;</span>
                            <span><strong>Last Updated:</strong> February 19, 2026</span>
                        </div>
                    </div>

                    <section className="mb-10">
                        <div className="bg-muted/30 border border-border/50 rounded-lg p-6">
                            <h2 className="text-lg font-medium text-foreground mb-4 flex items-center">
                                <ShieldCheck className="w-5 h-5 mr-2 text-primary" />
                                TL;DR
                            </h2>
                            <ul className="space-y-3">
                                {[
                                    "We process your bank statements to give you financial insights.",
                                    "We do not sell your data. Period.",
                                    "You can delete your data at any time.",
                                    "We use industry-standard encryption to keep your records safe.",
                                ].map((item, index) => (
                                    <li key={index} className="flex items-start text-foreground/80 text-sm">
                                        <span className="mr-3 text-primary">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    <div className="space-y-10 text-foreground/80 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-medium text-foreground mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-muted-foreground" />
                                1. Information We Collect
                            </h2>
                            <p className="mb-4">To provide the Flowchart service, we collect:</p>
                            <ul className="list-disc pl-5 space-y-2 marker:text-primary/50">
                                <li>
                                    <strong>Financial Data:</strong> Transaction history, balances, and descriptions from bank statements (PDF/CSV) you upload.
                                </li>
                                <li>
                                    <strong>Account Information:</strong> Name and email address if you create an account.
                                </li>
                                <li>
                                    <strong>Metadata:</strong> Technical data like IP address and device type to ensure app security.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-medium text-foreground mb-4 flex items-center">
                                <Eye className="w-5 h-5 mr-2 text-muted-foreground" />
                                2. How We Use Your Data
                            </h2>
                            <p className="mb-4">Your data is used strictly to:</p>
                            <ul className="list-disc pl-5 space-y-2 marker:text-primary/50">
                                <li>Categorize and aggregate your spending across multiple accounts.</li>
                                <li>Generate automated financial "flows" and budget suggestions.</li>
                                <li>Improve the app’s categorization algorithms.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-medium text-foreground mb-4 flex items-center">
                                <Lock className="w-5 h-5 mr-2 text-muted-foreground" />
                                3. Data Storage & Security
                            </h2>
                            <p className="mb-4">We implement "Bank Level" security measures:</p>
                            <ul className="list-disc pl-5 space-y-2 marker:text-primary/50">
                                <li>
                                    <strong>Encryption:</strong> All uploaded statements are encrypted using AES256 at rest and TLS during transit.
                                </li>
                                <li>
                                    <strong>Data Minimization:</strong> We only store what is necessary for the app to function.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-medium text-foreground mb-4 flex items-center">
                                <Server className="w-5 h-5 mr-2 text-muted-foreground" />
                                4. Third-party Sharing
                            </h2>
                            <p>
                                We do not sell, rent, or trade your personal financial data with third parties for marketing purposes. Data is only shared with essential service providers (e.g., secure cloud hosting) who are also bound by strict confidentiality.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-medium text-foreground mb-4">5. Your Rights</h2>
                            <p className="mb-4">Under the NDPR (and GDPR where applicable), you have the right to:</p>
                            <ul className="list-disc pl-5 space-y-2 marker:text-primary/50">
                                <li>Access the data we hold about you.</li>
                                <li>Request the permanent deletion of all uploaded statements and your account.</li>
                                <li>Withdraw consent for data processing at any time.</li>
                            </ul>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} Flowchart. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
