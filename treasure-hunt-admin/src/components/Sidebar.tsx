"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/players", label: "Players" },
  { href: "/dashboard/levels", label: "Levels" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="rise-in border-b border-[#d3cec2] bg-[#1f2937] px-4 py-4 text-white md:fixed md:inset-y-0 md:left-0 md:z-40 md:h-screen md:w-64 md:overflow-y-auto md:border-b-0 md:border-r">
      <h2 className="mb-4 text-lg font-bold md:text-xl">Admin Panel</h2>

      <nav className="flex flex-wrap gap-2 md:flex-col">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm transition md:text-base ${
                isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
