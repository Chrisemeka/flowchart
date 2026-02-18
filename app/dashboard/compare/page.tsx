'use client';

import React, { useState, useEffect } from 'react';
import { getUserStatements, getStatementDetails } from '@/app/actions/statement-actions';
import ComparisonSelector from '@/components/ComparisonSelector';
import ComparisonView from '@/components/ComparisonView';

export default function ComparePage() {
    const [statements, setStatements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIdA, setSelectedIdA] = useState<string | null>(null);
    const [selectedIdB, setSelectedIdB] = useState<string | null>(null);
    const [dataA, setDataA] = useState<any>(null);
    const [dataB, setDataB] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        async function fetchStatements() {
            setLoading(true);
            const response = await getUserStatements();
            if (response.data) {
                setStatements(response.data);
            }
            setLoading(false);
        }
        fetchStatements();
    }, []);

    useEffect(() => {
        async function fetchData() {
            if (!selectedIdA && !selectedIdB) return;

            setLoadingData(true);

            if (selectedIdA && (!dataA || dataA.statementId !== selectedIdA)) {
                const res = await getStatementDetails(selectedIdA);
                if (res.data) setDataA(res.data);
            }

            if (selectedIdB && (!dataB || dataB.statementId !== selectedIdB)) {
                const res = await getStatementDetails(selectedIdB);
                if (res.data) setDataB(res.data);
            }

            setLoadingData(false);
        }
        fetchData();
    }, [selectedIdA, selectedIdB, dataA, dataB]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-light text-foreground mb-6">Compare Statements</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <ComparisonSelector
                    label="Select Statement A"
                    statements={statements}
                    selectedId={selectedIdA}
                    onSelect={setSelectedIdA}
                    excludeId={selectedIdB}
                />
                <ComparisonSelector
                    label="Select Statement B"
                    statements={statements}
                    selectedId={selectedIdB}
                    onSelect={setSelectedIdB}
                    excludeId={selectedIdA}
                />
            </div>

            {loadingData && (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!loadingData && dataA && dataB && (
                <ComparisonView statementA={dataA} statementB={dataB} />
            )}

            {!loadingData && (!dataA || !dataB) && (
                <div className="text-center p-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border font-light">
                    Select two statements to begin comparison
                </div>
            )}
        </div>
    );
}
