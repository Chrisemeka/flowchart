import LoginButtons from '@/components/LoginButtons';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="z-10 w-full max-w-md items-center justify-between font-mono text-sm lg:flex flex-col gap-8 bg-white p-8 rounded-xl shadow-lg border">
        <h1 className="text-2xl font-bold text-center text-gray-900">Welcome to Flowchart</h1>
        <p className="text-center text-gray-500 mb-4">Sign in to manage your finances</p>
        <LoginButtons />
      </div>
    </div>
  );
}