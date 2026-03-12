"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/src/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-sm text-[color:var(--foreground-muted)]">
      Redirecting...
    </main>
  );
}
