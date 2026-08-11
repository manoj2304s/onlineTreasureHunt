"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import API from "@/src/services/api";
import { getErrorMessage } from "@/src/lib/httpError";

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

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
      toast.error(
        getErrorMessage(
          error,
          "Login failed. Please check your credentials."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromote = async () => {
    if (isPromoting) return;

    if (!email.trim()) {
      toast.error("Email is required to promote admin.");
      return;
    }

    if (!password.trim()) {
      toast.error("Password is required to promote admin.");
      return;
    }

    if (!adminCode.trim()) {
      toast.error("Admin code is required.");
      return;
    }

    try {
      setIsPromoting(true);
      const res = await API.post("/auth/promote-admin", {
        email: email.trim(),
        password,
        code: adminCode.trim(),
      });

      const message = res.data.message || "Admin role granted. Please log in.";
      toast.success(message);
      setSuccessMessage(message);
      setShowAdminCode(false);
      setAdminCode("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to promote admin."));
    } finally {
      setIsPromoting(false);
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

        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            className="btn btn-outline w-full"
            onClick={() => setShowAdminCode((current) => !current)}
          >
            {showAdminCode ? "Cancel New Admin" : "New Admin"}
          </button>

          {showAdminCode ? (
            <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--background-overlay)] p-4">
              <p className="text-sm text-[color:var(--foreground-muted)]">
                Enter the 6-digit admin code to promote this user.
              </p>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Admin Code"
                className="input"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                maxLength={6}
              />

              <button
                type="button"
                disabled={isPromoting}
                className="btn btn-secondary w-full"
                onClick={handlePromote}
              >
                {isPromoting ? "Applying code..." : "Apply Admin Code"}
              </button>

              {successMessage ? (
                <p className="text-sm text-emerald-600">
                  {successMessage}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}