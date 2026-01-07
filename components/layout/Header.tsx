"use client";

import { useAuthStore } from "@/stores/authStore";
import { useShiftStore } from "@/stores/shiftStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { Bell, Clock, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export function Header() {
  const { user } = useAuthStore();
  const { currentShift } = useShiftStore();
  const { toggle } = useSidebarStore();

  return (
    <header className="sticky top-0 z-30 flex h-14 lg:h-16 items-center justify-between border-b border-border bg-card/80 px-4 lg:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu (mobile only) */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden -ml-2"
          onClick={toggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div>
          <h1 className="text-base lg:text-lg font-semibold">
            Welcome, {user?.fullname?.split(" ")[0]}
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Shift Status (hidden on small screens) */}
        {(user?.role === "admin" || user?.role === "cashier") && (
          <div className="hidden md:flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {currentShift ? (
              <Badge variant="success" className="text-xs">
                <span className="hidden lg:inline">Shift Active since </span>
                {formatDateTime(currentShift.shift_start)}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">No Shift</Badge>
            )}
          </div>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive"></span>
        </Button>
      </div>
    </header>
  );
}
