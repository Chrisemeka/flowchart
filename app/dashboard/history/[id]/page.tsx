'use client';

import { useParams, useRouter } from 'next/navigation';
import { getStatementDetails } from '@/app/actions/statement-actions';
import { useQuery } from '@tanstack/react-query';
import TransactionTable from '@/components/TransactionTable';
import TransactionAnalysis from '@/components/TransactionAnalysis';

export default function StatementDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const { data: statementData, isLoading: loading, error } = useQuery({
        queryKey: ['statement', params.id],
        queryFn: async () => {
            if (!params.id) throw new Error('No ID provided');
            const result = await getStatementDetails(params.id as string);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!params.id,
    });

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Loading statement details...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
                <button
                    onClick={() => router.push('/dashboard/history')}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                    Back to History
                </button>
            </div>
        );
    }

    if (!statementData) {
        return <div className="text-center py-12 text-gray-500">Statement not found.</div>;
    }

    return (
        <div className="max-w-5xl mx-auto mt-8">
            <div className="mb-6">
                <button
                    onClick={() => router.push('/dashboard/history')}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                    ← Back to History
                </button>
            </div>

            <div className="bg-white px-6 py-4 rounded-t-lg border-b border-gray-200 flex justify-between items-center shadow-sm">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Parsed Statement</h3>
                    {statementData.bank && <p className="text-sm text-gray-500 max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">{statementData.bank}</p>}
                </div>
                <div className="text-right">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {statementData.transactionCount || (statementData.transactions ? statementData.transactions.length : 0)} Transactions
                    </span>
                </div>
            </div>

            {statementData.transactions ? (
                <>
                    <TransactionAnalysis transactions={statementData.transactions} />
                    <TransactionTable transactions={statementData.transactions} />
                </>
            ) : (
                <div className="p-8 bg-white text-center text-gray-500 border rounded-b-lg shadow-sm">
                    Transactions saved to database. ID: {statementData.statementId}
                    <p className="text-xs mt-2">Transactions were not returned in the response.</p>
                </div>
            )}
        </div>
    );
}
