"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useShiftStore } from "@/stores/shiftStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token, checkAuth } = useAuthStore();
  const { fetchCurrentShift } = useShiftStore();

  useEffect(() => {
    // Check authentication
    if (!token) {
      router.push("/login");
      return;
    }

    // Verify token and fetch user profile
    checkAuth();

    // Fetch current shift for cashier/admin
    fetchCurrentShift();
  }, [token, router, checkAuth, fetchCurrentShift]);

  // Show loading while checking auth
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
