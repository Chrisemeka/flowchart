'use client';

import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface Transaction {
    id?: string;
    date: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    category?: string;
}

interface TransactionAnalysisProps {
    transactions: Transaction[];
}

const COLORS = ['#10B981', '#EF4444']; // Green for Income, Red for Expense

export default function TransactionAnalysis({ transactions }: TransactionAnalysisProps) {
    const { pieData, lineData, totalIncome, totalExpense } = useMemo(() => {
        let income = 0;
        let expense = 0;
        const dailyExpenses: Record<string, number> = {};

        transactions.forEach(t => {
            const amount = Math.abs(t.amount);
            if (t.type === 'CREDIT') {
                income += amount;
            } else {
                expense += amount;

                // For line chart - aggregate daily expenses
                const dateKey = new Date(t.date).toLocaleDateString(); // Simple date key
                // Or better, keep ISO date for sorting and format later
                const isoDate = new Date(t.date).toISOString().split('T')[0];
                dailyExpenses[isoDate] = (dailyExpenses[isoDate] || 0) + amount;
            }
        });

        // Prepare Pie Chart Data
        const pieArr = [
            { name: 'Income', value: income },
            { name: 'Expenditure', value: expense }
        ];

        // Prepare Line Chart Data
        // Sort dates
        const sortedDates = Object.keys(dailyExpenses).sort();
        const lineArr = sortedDates.map(date => ({
            date,
            amount: dailyExpenses[date],
            displayDate: new Date(date).toLocaleDateString()
        }));

        return {
            pieData: pieArr,
            lineData: lineArr,
            totalIncome: income,
            totalExpense: expense
        };
    }, [transactions]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
    };

    if (!transactions || transactions.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Income vs Expenditure - Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Income vs Expenditure</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center gap-8 text-sm">
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-gray-600">Income: <span className="font-semibold text-gray-900">{formatCurrency(totalIncome)}</span></span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-gray-600">Expense: <span className="font-semibold text-gray-900">{formatCurrency(totalExpense)}</span></span>
                    </div>
                </div>
            </div>

            {/* Daily Spending Trend - Line Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Spending Trend</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={lineData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                tick={{ fontSize: 12 }}
                                tickMargin={10}
                            />
                            <YAxis
                                tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), 'Spent']}
                                labelStyle={{ color: '#374151' }}
                            />
                            {/* <Legend /> */}
                            <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="#EF4444"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#EF4444' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center text-sm text-gray-500">
                    Shows daily expenditure over the statement period
                </div>
            </div>
        </div>
    );
}
