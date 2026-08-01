import { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout"; 

export const metadata: Metadata = {
  title: "Bangalore Collective",
  description: "Curating elegance through fashion, redefining the modern Bangalore aesthetic.",
  icons: {
    icon: "/banglorecollectivelogo.jpg", 
    apple: "/banglorecollectivelogo.jpg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen flex overflow-hidden bg-white dark:bg-slate-950">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}