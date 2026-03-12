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
      <div className="min-h-screen overflow-x-hidden md:h-screen md:overflow-hidden">
        <Sidebar />

        <div className="flex w-full flex-col md:ml-64 md:h-screen md:w-[calc(100%-16rem)] md:overflow-y-auto">
          <Navbar />

          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
