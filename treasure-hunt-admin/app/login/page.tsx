"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import API from "@/src/services/api";
import { getErrorMessage } from "@/src/lib/httpError";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const reason = searchParams.get("reason");

    if (reason === "session_expired") {
      toast.error("Session expired. Please log in again.");
      router.replace("/login");
    }
  }, [searchParams, router]);

  const handleLogin = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (isSubmitting) return;

    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!password.trim()) {
      toast.error("Password is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await API.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const token = res.data.token;
      localStorage.setItem("adminToken", token);

      router.push("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed. Please check your credentials."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="panel rise-in w-full max-w-sm p-8"
      >
        <h2 className="mb-6 text-center text-2xl font-bold text-[color:var(--foreground)]">
          Admin Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="input mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="input mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={isSubmitting}
          className="btn btn-info w-full"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
