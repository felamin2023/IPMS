import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNav from "./navigation/AdminNav";
import UserNav from "./navigation/UserNav";
import TopBar from "./TopBar";
import { useAuth } from "../context/AuthContext";
import { X } from "lucide-react";

export default function Layout() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        {isAdmin ? <AdminNav /> : <UserNav />}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative h-full w-64 bg-white shadow-lg">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <div className="text-lg font-semibold">IPMS</div>
              <button
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 hover:bg-gray-50"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            <div className="h-full overflow-y-auto">
              {isAdmin ? <AdminNav hideBrand /> : <UserNav hideBrand />}
            </div>
          </div>
        </div>
      )}

      {/* Make this a column with full height */}
      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <div className="shrink-0 sticky top-0 z-20 bg-white">
          <TopBar onOpenMobile={() => setMobileOpen(true)} />
        </div>

        {/* Scrollable content with responsive padding */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
