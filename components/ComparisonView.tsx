'use client';

import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface Transaction {
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    category?: string;
}

interface StatementData {
    statementId: string;
    bank: string;
    transactions: Transaction[];
    month: number;
    year: number;
}

interface ComparisonViewProps {
    statementA: StatementData;
    statementB: StatementData;
}

export default function ComparisonView({ statementA, statementB }: ComparisonViewProps) {
    const processStatement = (statement: StatementData) => {
        let income = 0;
        let expense = 0;
        const categoryExpenses: Record<string, number> = {};

        statement.transactions.forEach(t => {
            const amount = Math.abs(t.amount);
            if (t.type === 'CREDIT') {
                income += amount;
            } else {
                expense += amount;
                const cat = t.category || 'Uncategorized';
                categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amount;
            }
        });

        return { income, expense, categoryExpenses };
    };

    const dataA = useMemo(() => processStatement(statementA), [statementA]);
    const dataB = useMemo(() => processStatement(statementB), [statementB]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
    };

    const categoryChartData = useMemo(() => {
        const allCategories = new Set([
            ...Object.keys(dataA.categoryExpenses),
            ...Object.keys(dataB.categoryExpenses)
        ]);

        return Array.from(allCategories).map(cat => ({
            name: cat,
            [statementA.bank]: dataA.categoryExpenses[cat] || 0,
            [statementB.bank]: dataB.categoryExpenses[cat] || 0
        }));
    }, [dataA, dataB, statementA.bank, statementB.bank]);

    return (
        <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Statement A Summary */}
                <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                    <h3 className="text-lg font-light text-foreground mb-4 pb-2 border-b border-border">{statementA.bank} <span className="text-sm text-muted-foreground ml-2">({statementA.month}/{statementA.year})</span></h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-light">Total Income</span>
                            <span className="font-medium text-emerald-600">{formatCurrency(dataA.income)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-light">Total Expenses</span>
                            <span className="font-medium text-rose-600">{formatCurrency(dataA.expense)}</span>
                        </div>
                        <div className="pt-3 border-t border-border flex justify-between items-center font-medium">
                            <span className="text-foreground">Net</span>
                            <span className={dataA.income - dataA.expense >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                {formatCurrency(dataA.income - dataA.expense)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Statement B Summary */}
                <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                    <h3 className="text-lg font-light text-foreground mb-4 pb-2 border-b border-border">{statementB.bank} <span className="text-sm text-muted-foreground ml-2">({statementB.month}/{statementB.year})</span></h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-light">Total Income</span>
                            <span className="font-medium text-emerald-600">{formatCurrency(dataB.income)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-light">Total Expenses</span>
                            <span className="font-medium text-rose-600">{formatCurrency(dataB.expense)}</span>
                        </div>
                        <div className="pt-3 border-t border-border flex justify-between items-center font-medium">
                            <span className="text-foreground">Net</span>
                            <span className={dataB.income - dataB.expense >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                {formatCurrency(dataB.income - dataB.expense)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Comparison Chart */}
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                <h3 className="text-lg font-light text-foreground mb-6">Expenditure by Category Comparison</h3>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={categoryChartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                            <XAxis
                                dataKey="name"
                                interval="preserveStartEnd"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 12, fill: '#737373' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                                tick={{ fontSize: 12, fill: '#737373' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                formatter={(value: number | undefined) => formatCurrency(value || 0)}
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey={statementA.bank} fill="#6c63ff" radius={[4, 4, 0, 0]} name={`${statementA.bank} (${statementA.month}/${statementA.year})`} />
                            <Bar dataKey={statementB.bank} fill="#c7c4fc" radius={[4, 4, 0, 0]} name={`${statementB.bank} (${statementB.month}/${statementB.year})`} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
