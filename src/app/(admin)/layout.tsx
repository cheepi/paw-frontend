"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/me`, { credentials: 'include' });

        if (!res.ok) throw new Error("Not authorized");

        const user = await res.json();

        if (user.role !== "admin") {
          alert("Akses ditolak. Hanya untuk Admin.");
          router.push("/dashboard");
        } else {
          setIsAdmin(true); 
        }
      } catch (err) {
        router.push("/sign-in");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-3">Memverifikasi akses admin...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; 
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Fixed */}
      <div className="fixed left-0 top-0 h-screen">
        <AdminSidebar /> 
      </div>

      {/* Main Content - Offset by sidebar */}
      <main className="flex-1 lg:ml-20 overflow-y-auto">
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 px-6 sm:px-8 lg:px-12 py-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}