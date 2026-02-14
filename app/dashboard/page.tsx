"use client";

import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold">High On</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium hidden sm:inline">{session.user?.name}</span>
            </div>
            <button
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-accent transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Dashboard</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Welcome to your dashboard! This is a placeholder page. Content will be added here soon.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
