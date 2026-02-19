import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import React from 'react';

export default function TermsPage() {
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
                    <h1 className="text-3xl font-light tracking-tight text-foreground mb-8">
                        Terms and Conditions for <span className="font-semibold text-primary">Flowchart</span>
                    </h1>

                    <div className="space-y-8 text-foreground/80 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-medium text-foreground mb-3">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using Flowchart, you agree to be bound by these terms. If you do not agree, please do not upload your financial data.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-medium text-foreground mb-3">2. Not Financial Advice</h2>
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
                                <p className="text-amber-900 text-sm">
                                    <strong>IMPORTANT:</strong> Flowchart is a tool for personal information and organization only. We are not a bank, a licensed financial advisor, or a wealth manager. Any insights provided are suggestions based on your data and should not be taken as professional financial or investment advice.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-medium text-foreground mb-3">3. User Responsibilities</h2>
                            <ul className="list-disc pl-5 space-y-2 marker:text-primary/50">
                                <li>
                                    <strong>Authorization:</strong> You represent that you have the legal right to upload and process the bank statements you provide.
                                </li>
                                <li>
                                    <strong>Security:</strong> You are responsible for maintaining the confidentiality of your Flowchart login credentials.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-medium text-foreground mb-3">4. Accuracy of Information</h2>
                            <p>
                                Flowchart relies on the data you provide. We are not responsible for inaccuracies in your financial overview caused by incomplete, modified, or corrupted bank statements.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-medium text-foreground mb-3">5. Limitation of Liability</h2>
                            <p>
                                To the maximum extent permitted by law, Flowchart and its developers shall not be liable for any financial losses, damages, or data breaches resulting from unauthorized access to your device or thirdparty service failures.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-medium text-foreground mb-3">6. Termination</h2>
                            <p>
                                We reserve the right to suspend or terminate your access to the service if we detect fraudulent activity or a violation of these terms.
                            </p>
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
