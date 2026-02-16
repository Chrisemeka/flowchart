'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import TransactionTable from '@/components/TransactionTable';

export default function Home() {
  const [statementData, setStatementData] = useState<any>(null);

  const handleUploadSuccess = (data: any) => {
    // The data structure returned is { status, message, data: { ... } }
    // We want the inner data object which contains transactions
    setStatementData(data.data);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Flowchart <span className="text-blue-600">Engine</span>
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          Upload a Nigerian Bank Statement (Access Bank) to test the parser logic.
        </p>
      </div>

      <FileUpload onUploadSuccess={handleUploadSuccess} />

      {statementData && (
        <div className="max-w-5xl mx-auto mt-8">
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
            <TransactionTable transactions={statementData.transactions} />
          ) : (
            <div className="p-8 bg-white text-center text-gray-500 border rounded-b-lg shadow-sm">
              Transactions saved to database. ID: {statementData.statementId}
              <p className="text-xs mt-2">Transactions were not returned in the response.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}