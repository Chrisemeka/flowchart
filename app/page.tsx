import LoginButtons from '@/components/LoginButtons';
import Image from 'next/image';


export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-row items-center justify-center p-6 lg:p-24 bg-background overflow-hidden">
      <div className="z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Illustration Section */}
        <div className="hidden lg:flex flex-col items-center justify-center p-8">
          <Image
            src="/undraw_authentication_1evl.svg"
            alt="Login Illustration"
            width={400}
            height={400}
            className="w-full max-w-md h-auto"
          />
        </div>

        {/* Login Form Section */}
        <div className="flex flex-col items-center justify-center gap-6 bg-white p-8 sm:p-12 rounded-2xl border border-border shadow-sm max-w-md w-full mx-auto">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-light text-foreground tracking-tight">Welcome to <span className="font-semibold text-primary">Flowchart</span></h1>
            <p className="text-muted-foreground font-light text-sm">Sign in to manage and analyze your financial statements with ease.</p>
          </div>
          <div className="w-full mt-2">
            <LoginButtons />
          </div>
        </div>

      </div>
    </div>
  );
}