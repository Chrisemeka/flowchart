'use client';

import Link from 'next/link';
import { getUserStatements, deleteStatement } from '@/app/actions/statement-actions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Calendar, CreditCard, Trash2 } from 'lucide-react';
import Image from 'next/image';

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
    const queryClient = useQueryClient();

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

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteStatement(id);
            if (result.error) throw new Error(result.error);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['statements'] });
        }
    });

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this statement? This action cannot be undone.")) {
            deleteMutation.mutate(id);
        }
    };

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
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg bg-muted/10">
                <Image
                    src="/undraw_no-data_ig65.svg"
                    alt="No statements"
                    width={200}
                    height={200}
                    className="w-48 h-auto mb-4 opacity-80"
                />
                <p className="text-muted-foreground font-light text-lg">No statements uploaded yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Upload a statement to get started.</p>
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
                                    <svg className="w-5 h-5 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <button
                                        onClick={(e) => handleDelete(e, statement.id)}
                                        disabled={deleteMutation.isPending}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors z-10"
                                        title="Delete Statement"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
