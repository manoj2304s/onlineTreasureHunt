import Sidebar from "@/src/components/Sidebar";
import Navbar from "@/src/components/Navbar";
import AuthGuard from "@/src/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex">
        <Sidebar />

        <div className="flex flex-col w-full">
          <Navbar />

          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
