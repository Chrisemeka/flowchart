'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import TransactionTable from '@/components/TransactionTable';
import TransactionAnalysis from '@/components/TransactionAnalysis';
import Image from 'next/image';


export default function Home() {
  const [statementData, setStatementData] = useState<any>(null);

  const handleUploadSuccess = (data: any) => {
    // The data structure returned is { status, message, data: { ... } }
    // We want the inner data object which contains transactions
    setStatementData(data.data);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto text-center mb-10">
        <div className="flex justify-center mb-6">
          <Image
              src="/undraw_add-files_s0fz.svg"
              alt="No File Added"
              width={200}
              height={200}
              className="w-48 h-auto mb-4 opacity-80"
          />
        </div>
        <h2 className="text-2xl font-light text-foreground">Analyze Your Statements</h2>
        <p className="mt-3 text-lg text-muted-foreground font-light">
          Upload a Nigerian Bank Statement to visualize your finances.
        </p>
      </div>

      <FileUpload onUploadSuccess={handleUploadSuccess} />

      {statementData && (
        <div className="max-w-5xl mx-auto mt-8">
          <div className="bg-white px-4 py-4 sm:px-6 rounded-t-lg border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center shadow-sm gap-4 sm:gap-0">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Parsed Statement</h3>
              {statementData.bank && <p className="text-sm text-gray-500 max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">{statementData.bank}</p>}
            </div>
            <div className="text-left sm:text-right">
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
      )}
    </>
  );
}