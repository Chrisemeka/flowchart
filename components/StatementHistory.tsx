'use client';

import Link from 'next/link';
import { getUserStatements } from '@/app/actions/statement-actions';
import { useQuery } from '@tanstack/react-query';
import { FileText, Calendar, CreditCard } from 'lucide-react';

interface Statement {
    id: string;
    bank_name: string;
    account_number: string;
    month: number;
    year: number;
    file_name: string;
    start_date: string;
}

export default function StatementHistory() {
    const { data: statements = [], isLoading: loading, error, refetch } = useQuery<Statement[]>({
        queryKey: ['statements'],
        queryFn: async () => {
            const result = await getUserStatements();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data || [];
        }
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
                <button onClick={() => refetch()} className="mt-2 text-primary hover:underline">Try Again</button>
            </div>
        );
    }

    if (statements.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/10">
                <p className="text-muted-foreground font-light">No statements uploaded yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <ul role="list" className="divide-y divide-border">
                {statements.map((statement) => (
                    <li key={statement.id}>
                        <Link
                            href={`/dashboard/history/${statement.id}`}
                            className="block hover:bg-muted/30 transition duration-150 ease-in-out group"
                        >
                            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="p-2 bg-primary/10 rounded-full text-primary">
                                                <CreditCard size={16} />
                                            </span>
                                            <p className="text-base font-medium text-foreground truncate">
                                                {statement.bank_name}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                            Processed
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:gap-6 text-sm text-muted-foreground ml-10">
                                        <div className="flex items-center gap-1.5">
                                            <FileText size={14} />
                                            <span className="truncate max-w-[200px]">{statement.file_name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            <time dateTime={statement.start_date}>
                                                {new Date(statement.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </time>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-sm font-medium mr-2">View Breakdown</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
