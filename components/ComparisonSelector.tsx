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
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                value={selectedId || ''}
                onChange={(e) => onSelect(e.target.value)}
            >
                <option value="">Select a statement...</option>
                {statements.map((statement) => (
                    <option
                        key={statement.id}
                        value={statement.id}
                        disabled={statement.id === excludeId}
                    >
                        {statement.bank_name} - {statement.month}/{statement.year} ({statement.file_name})
                    </option>
                ))}
            </select>
        </div>
    );
}
