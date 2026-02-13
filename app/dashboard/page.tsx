import FileUpload from '@/components/FileUpload';

export default function Home() {
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

      <FileUpload />
    </main>
  );
}