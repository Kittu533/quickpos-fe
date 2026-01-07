"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useShiftStore } from "@/stores/shiftStore";
import { useSidebarStore } from "@/stores/sidebarStore";
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
  const { close } = useSidebarStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const hasCheckedAuth = useRef(false);

  // Hydration effect - runs once
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        close();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [close]);

  // Auth check - only runs ONCE after hydration
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    // Only check auth once (on initial load)
    if (hasCheckedAuth.current) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    // Mark as checked so we don't run again
    hasCheckedAuth.current = true;

    // Don't await - let it run in background
    checkAuth();
    fetchCurrentShift();
  }, [isHydrated]);

  // Watch for logout (token becomes null after initial auth check)
  useEffect(() => {
    if (isHydrated && hasCheckedAuth.current && !token) {
      // User logged out, redirect to login
      router.push("/login");
    }
  }, [token, isHydrated, router]);

  // Show loading while waiting for user (after hydration)
  if (!isHydrated || !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {!isHydrated ? 'Loading...' : 'Authenticating...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      {/* Main content - responsive padding for sidebar */}
      <div className="lg:pl-72 transition-all duration-300">
        <Header />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
