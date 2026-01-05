"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useShiftStore } from "@/stores/shiftStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Loader2, Search, CheckCircle, XCircle } from "lucide-react";

// Debug helper
function debugLog(message: string, data?: unknown) {
  const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
  logs.push({
    time: new Date().toISOString(),
    message,
    data: data !== undefined ? JSON.stringify(data) : null
  });
  if (logs.length > 50) logs.shift();
  localStorage.setItem('debug_logs', JSON.stringify(logs));
  console.log('[DEBUG]', message, data);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token, checkAuth } = useAuthStore();
  const { fetchCurrentShift } = useShiftStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const hasCheckedAuth = useRef(false); // Prevent multiple auth checks

  // Load debug logs
  useEffect(() => {
    const interval = setInterval(() => {
      const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
      setDebugLogs(logs.map((l: { time: string; message: string; data: string | null }) =>
        `${l.time.split('T')[1]?.split('.')[0] || ''} - ${l.message}${l.data ? ': ' + l.data : ''}`
      ));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Hydration effect - runs once
  useEffect(() => {
    localStorage.setItem('debug_logs', '[]');
    debugLog('Dashboard mounted');
    debugLog('Initial token', token ? `exists (${token.length} chars)` : 'null');
    debugLog('Initial user', user ? user.username : 'null');
    setIsHydrated(true);
  }, []);

  // Auth check - only runs ONCE after hydration
  useEffect(() => {
    if (!isHydrated) {
      debugLog('Not hydrated yet');
      return;
    }

    // Only check auth once
    if (hasCheckedAuth.current) {
      debugLog('Already checked auth, skipping');
      return;
    }

    debugLog('Checking auth once...', { hasToken: !!token, hasUser: !!user });

    if (!token) {
      debugLog('No token on initial check, redirecting to login');
      router.push("/login");
      return;
    }

    // Mark as checked so we don't run again
    hasCheckedAuth.current = true;
    debugLog('Token exists, verifying with API...');

    // Don't await - let it run in background
    checkAuth();
    fetchCurrentShift();
  }, [isHydrated]); // Only depend on isHydrated, NOT token/user

  // Show loading while waiting for user (after hydration)
  if (!isHydrated || !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {!isHydrated ? 'Hydrating...' : 'Loading user...'}
          </span>
        </div>

        {/* Debug Panel */}
        <div className="w-full max-w-2xl rounded-lg border border-gray-300 bg-gray-50 p-4 shadow">
          <h3 className="mb-2 font-bold text-sm text-gray-800 flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-500" />
            Debug Logs:
          </h3>
          <div className="max-h-48 overflow-auto rounded bg-white p-2 text-xs font-mono">
            {debugLogs.length === 0 ? (
              <div className="text-gray-400">Loading logs...</div>
            ) : (
              debugLogs.map((log, i) => (
                <div key={i} className="text-gray-600 py-0.5 border-b border-gray-100">{log}</div>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-4 text-xs">
            <span className={`flex items-center gap-1 ${token ? "text-green-600" : "text-red-600"}`}>
              {token ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              Token: {token ? `${token.length} chars` : 'null'}
            </span>
            <span className={`flex items-center gap-1 ${user ? "text-green-600" : "text-red-600"}`}>
              {user ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              User: {user ? user.username : 'null'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="pl-72 transition-all duration-300">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
