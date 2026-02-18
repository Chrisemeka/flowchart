'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserStatements } from '@/app/actions/statement-actions';

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
    const [statements, setStatements] = useState<Statement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStatements();
    }, []);

    const fetchStatements = async () => {
        setLoading(true);
        const result = await getUserStatements();
        if (result.error) {
            setError(result.error);
        } else {
            setStatements(result.data || []);
        }
        setLoading(false);
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading history...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                <p>Error: {error}</p>
                <button onClick={fetchStatements} className="mt-2 text-blue-600 underline">Try Again</button>
            </div>
        );
    }

    if (statements.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No statements uploaded yet.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
                {statements.map((statement) => (
                    <li key={statement.id}>
                        <div className="block hover:bg-gray-50 transition duration-150 ease-in-out">
                            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-blue-600 truncate">
                                            {statement.bank_name} - {statement.month}/{statement.year}
                                        </p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Processed
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                {statement.file_name}
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            <p>
                                                Statement Date: <time dateTime={statement.start_date}>{new Date(statement.start_date).toLocaleDateString()}</time>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-5 flex-shrink-0">
                                    <Link
                                        href={`/dashboard/history/${statement.id}`}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        View Breakdown
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
