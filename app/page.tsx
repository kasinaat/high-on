import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="flex flex-col items-center gap-6 sm:gap-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold">Welcome to High On</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Landing page coming soon</p>
        <Link
          href="/login"
          className="px-6 py-3 text-sm sm:text-base font-medium bg-primary rounded-md hover:bg-primary/90 transition-colors"
        >
          Go to Login
        </Link>
      </main>
    </div>
  );
}
