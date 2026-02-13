'use client';

import { useState } from 'react';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  // Handle the upload and parsing
  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse PDF');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Flowchart Engine Test</h2>
      
      {/* File Input Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Bank Statement (PDF)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer border rounded-lg p-2"
          />
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`px-6 py-2 rounded-lg font-medium text-white transition-colors
              ${!file || loading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Parsing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
            <div>
              <span className="font-semibold">Detected Bank:</span> {result.bank}
            </div>
            <div>
              <span className="font-semibold">Transactions:</span> {result.transactions?.length || 0}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b font-medium text-gray-700 text-sm">
              Parsed Data (JSON)
            </div>
            <pre className="p-4 bg-gray-900 text-green-400 text-xs overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}