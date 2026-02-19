'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onUploadSuccess: (data: any) => void;
}

import Link from 'next/link';
import { getUserTermsStatus, acceptTermsAndPrivacy } from '@/app/actions/user';
import { useEffect } from 'react';

interface FileUploadProps {
  onUploadSuccess: (data: any) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const queryClient = useQueryClient();

  // Check user status on mount
  useEffect(() => {
    async function checkStatus() {
      const status = await getUserTermsStatus();
      if (status.error) {
        // Handle error or assume accepted to not block? Or block?
        // For now, if we can't verify, we might want to be safe or just let it pass if it's an auth issue (which middleware handles)
      } else {
        if (!status.termsAcceptedAt || !status.privacyAcceptedAt) {
          setNeedsAcceptance(true);
        }
      }
    }
    checkStatus();
  }, []);

  const { mutate: uploadFile, isPending: loading, error: uploadError } = useMutation({
    mutationFn: async (file: File) => {
      // If acceptance is needed, we must ensure it's recorded before uploading
      if (needsAcceptance) {
        if (!termsAccepted || !privacyAccepted) {
          throw new Error("You must accept the Terms and Privacy Policy.");
        }

        setIsAccepting(true);
        const result = await acceptTermsAndPrivacy();
        setIsAccepting(false);

        if (result.error) {
          throw new Error("Failed to record acceptance. Please try again.");
        }
        setNeedsAcceptance(false); // No longer needs acceptance
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to parse PDF');
      }
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      onUploadSuccess(data);
    }
  });

  const error = uploadError ? (uploadError as Error).message : null;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };


  // Handle the upload and parsing
  const handleUpload = () => {
    if (!file) return;
    uploadFile(file);
  };

  const isUploadDisabled = !file || loading || (needsAcceptance && (!termsAccepted || !privacyAccepted)) || isAccepting;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl border border-border shadow-sm mb-12">
      <div className="flex items-center justify-center mb-6">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          <Upload size={24} />
        </div>
      </div>

      <h2 className="text-xl font-light text-foreground text-center mb-2">Upload Statement</h2>
      <p className="text-muted-foreground text-center text-sm mb-8">
        Upload your bank statement PDF to parse and analyze transactions.
      </p>

      {/* File Input Area */}
      <div className="mb-6 space-y-4">
        <div className="relative group">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}>
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="text-primary w-8 h-8" />
                <span className="text-sm font-medium text-foreground">{file.name}</span>
                <span className="text-xs text-muted-foreground">Click to change</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-foreground">Click to upload or drag and drop</span>
                <span className="text-xs text-muted-foreground">PDF files only</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={isUploadDisabled}
          className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2
            ${isUploadDisabled
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md'}`}
        >
          {loading || isAccepting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              {isAccepting ? 'Accepting Terms...' : 'Processing...'}
            </>
          ) : (
            'Upload & Analyze'
          )}
        </button>

        {needsAcceptance && (
          <div className="space-y-3 pt-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="terms" className="leading-tight">
                I agree to the <Link href="/terms" target="_blank" className="text-primary hover:underline">Terms and Conditions</Link>
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="privacy"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="privacy" className="leading-tight">
                I agree to the <Link href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <strong className="font-medium block mb-1">Upload Failed</strong>
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
