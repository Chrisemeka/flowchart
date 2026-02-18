'use client';

import React from 'react';

interface Statement {
    id: string;
    bank_name: string;
    month: number;
    year: number;
    file_name: string;
}

interface ComparisonSelectorProps {
    statements: Statement[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    label: string;
    excludeId?: string | null;
}

export default function ComparisonSelector({
    statements,
    selectedId,
    onSelect,
    label,
    excludeId
}: ComparisonSelectorProps) {
    const availableStatements = statements.filter(s => s.id !== excludeId);

    // If the currently selected ID is now excluded (e.g. selected in the other dropdown),
    // we should ideally handle that, but for now the parent can handle the reset or we just let it be.
    // The user will just see it selected but if they try to change it, the options won't include the excluded one.

    return (
        <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <div className="relative">
                <select
                    className="block w-full rounded-lg border border-border bg-white p-3 text-sm text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                    value={selectedId || ''}
                    onChange={(e) => onSelect(e.target.value)}
                >
                    <option value="">Select a statement...</option>
                    {statements.map((statement) => (
                        <option
                            key={statement.id}
                            value={statement.id}
                            disabled={statement.id === excludeId}
                            className="text-foreground"
                        >
                            {statement.bank_name} - {statement.month}/{statement.year} ({statement.file_name})
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
