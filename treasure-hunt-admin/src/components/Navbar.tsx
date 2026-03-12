"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.replace("/login");
  };

  return (
    <header className="rise-in m-4 mb-0 flex items-center justify-between rounded-2xl border border-[#d3cec2] bg-[#fffdf7]/95 px-4 py-3 shadow-[0_16px_28px_-20px_rgba(20,19,17,0.45)] md:m-6 md:mb-0 md:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#5a564e]">Control Room</p>
        <h1 className="text-lg font-semibold text-[#1f1d1a] md:text-xl">
          Treasure Hunt Admin
        </h1>
      </div>

      <button onClick={handleLogout} className="btn btn-neutral text-sm">
        Logout
      </button>
    </header>
  );
}
