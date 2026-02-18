import LoginButtons from '@/components/LoginButtons';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 lg:p-24 bg-background">
      <div className="z-10 w-full max-w-md flex flex-col items-center justify-center gap-6 bg-white p-8 rounded-xl border border-border shadow-sm">
        <h1 className="text-3xl font-light text-center text-foreground tracking-tight">Welcome to <span className="font-semibold text-primary">Flowchart</span></h1>
        <p className="text-center text-muted-foreground font-light text-sm max-w-xs">Sign in to manage and analyze your financial statements with ease.</p>
        <div className="w-full mt-4">
          <LoginButtons />
        </div>
      </div>
    </div>
  );
}