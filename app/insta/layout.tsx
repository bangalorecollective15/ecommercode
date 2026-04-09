import Sidebar from "@/app/components/Sidebar";
import Header from "@/app/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#fcfcfc]">
      {/* Sidebar stays fixed on the left */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header stays at the top of the content area */}
        <Header />
        
        {/* This is where your Dashboard Page content will render */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}