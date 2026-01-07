"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Receipt,
  BarChart3,
  LogOut,
  Clock,
  UserCog,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager"] },
  { name: "POS", href: "/pos", icon: ShoppingCart, roles: ["admin", "cashier"] },
  { name: "Products", href: "/products", icon: Package, roles: ["admin"] },
  { name: "Customers", href: "/customers", icon: Users, roles: ["admin", "manager", "cashier"] },
  { name: "Transactions", href: "/transactions", icon: Receipt, roles: ["admin", "manager", "cashier"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "manager"] },
  { name: "Shifts", href: "/shifts", icon: Clock, roles: ["admin", "manager"] },
  { name: "Users", href: "/users", icon: UserCog, roles: ["admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isOpen, close } = useSidebarStore();

  const filteredNav = navigation.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    close();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 shadow-sm font-sans",
          // Mobile: hide by default, show when open
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Header */}
        <div className="flex h-16 lg:h-20 items-center justify-between px-6 lg:px-8 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-xl overflow-hidden bg-white shadow-lg">
              <Image src="/logo.png" alt="QuickPOS" width={36} height={36} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg lg:text-xl font-bold text-gray-900 tracking-tight leading-none">QuickPOS</span>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">Management</span>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={close}
            className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 lg:py-6 px-3 lg:px-4 space-y-1">
          <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu
          </div>
          {filteredNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600")} />
                  <span>{item.name}</span>
                </div>
                {!isActive && (
                  <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 text-gray-300" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Separator using Radix Primitive */}
        <SeparatorPrimitive.Root className="h-[1px] bg-gray-100 mx-4 lg:mx-6" />

        {/* User Section */}
        <div className="p-4 lg:p-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-1">
            <div className="flex items-center gap-3 p-2 lg:p-3">
              <AvatarPrimitive.Root className="relative flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm">
                <AvatarPrimitive.Image
                  className="aspect-square h-full w-full object-cover"
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullname || 'User'}`}
                  alt={user?.fullname}
                />
                <AvatarPrimitive.Fallback
                  className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-600 text-sm font-bold"
                  delayMs={600}
                >
                  {user ? getInitials(user.fullname) : "?"}
                </AvatarPrimitive.Fallback>
              </AvatarPrimitive.Root>

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {user?.fullname}
                </p>
                <p className="truncate text-xs font-medium text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-white p-2 lg:p-2.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 border border-gray-100 shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
