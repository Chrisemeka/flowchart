import React, { useMemo, useTransition } from 'react';
import { ChevronRight, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { TRANSACTION_CATEGORIES } from '../lib/constants';
import { updateTransactionCategory } from '@/app/actions/transaction-actions';
import { useQueryClient } from '@tanstack/react-query';

interface Transaction {
    id?: string;
    date: string;
    clean_name?: string;
    narration?: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    category?: string;
    description?: string;
}

interface TransactionTableProps {
    transactions: Transaction[];
    statementId?: string;
}

type SortDirection = 'asc' | 'desc';

export default function TransactionTable({ transactions, statementId }: TransactionTableProps) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
    const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');
    const [isPending, startTransition] = useTransition();
    const queryClient = useQueryClient();
    const itemsPerPage = 20;

    // Filter and Sort transactions
    const processedTransactions = useMemo(() => {
        if (!transactions) return [];

        let result = [...transactions];

        // Filter
        if (selectedCategory !== 'All') {
            result = result.filter(t => t.category === selectedCategory);
        }

        // Sort
        result.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        });

        return result;
    }, [transactions, selectedCategory, sortDirection]);

    // Reset page when category or sort changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, sortDirection]);

    if (!transactions || transactions.length === 0) {
        return <div className="text-center p-8 text-muted-foreground font-light">No transactions to display.</div>;
    }

    const totalPages = Math.ceil(processedTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentTransactions = processedTransactions.slice(startIndex, startIndex + itemsPerPage);

    const handlePrevious = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNext = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const toggleSort = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const handleCategoryChange = (transactionId: string | undefined, newCategory: string) => {
        if (!transactionId) return;

        startTransition(async () => {
            try {
                const result = await updateTransactionCategory(transactionId, newCategory);
                if (result?.error) {
                    alert(result.error);
                } else {
                    queryClient.invalidateQueries({ queryKey: ['statement'] });
                }
            } catch (error) {
                console.error("Failed to update category", error);
                alert("Failed to update category");
            }
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-light text-foreground">Transactions</h2>
                <div className="relative">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="block w-full min-w-[180px] p-2.5 text-sm text-foreground bg-white rounded-lg border border-border focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
                    >
                        <option value="All">All Categories</option>
                        {TRANSACTION_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-muted-foreground">
                    <thead className="text-xs text-muted-foreground uppercase border-b border-border font-medium tracking-wider">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/50 transition-colors" onClick={toggleSort}>
                                <div className="flex items-center gap-1">
                                    Date
                                    {sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                </div>
                            </th>
                            <th scope="col" className="px-4 py-3 font-medium">Description</th>
                            <th scope="col" className="px-4 py-3 font-medium">Category</th>
                            <th scope="col" className="px-4 py-3 font-medium">Type</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {currentTransactions.length > 0 ? (
                            currentTransactions.map((t, index) => (
                                <tr key={t.id || index} className="bg-white hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap">
                                        {new Date(t.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 min-w-[200px] text-foreground/90">
                                        {t.clean_name || t.narration || t.description || 'No description'}
                                    </td>
                                    <td className="px-4 py-4 min-w-[150px]">
                                        <select
                                            value={t.category || ''}
                                            onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                                            disabled={isPending}
                                            className={`bg-transparent border-none text-xs rounded focus:ring-0 focus:border-none block w-full p-0 cursor-pointer ${!t.category ? 'text-muted-foreground' : 'text-primary font-medium'}`}
                                        >
                                            <option value="" disabled>Select Category</option>
                                            {TRANSACTION_CATEGORIES.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${t.type === 'CREDIT'
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-700'
                                            }`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-4 text-right font-medium whitespace-nowrap ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {t.type === 'DEBIT' ? '-' : '+'}{Math.abs(t.amount).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground font-light">
                                    No transactions found for this category.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center py-4 border-t border-border mt-2">
                    <div className="text-sm text-muted-foreground">
                        Page <span className="font-medium text-foreground">{currentPage}</span> of <span className="font-medium text-foreground">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-md border border-border bg-white text-foreground hover:bg-muted transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-md border border-border bg-white text-foreground hover:bg-muted transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
