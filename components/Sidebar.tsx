"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Filter,
  Tag,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/pipelines", label: "Pipelines", icon: Kanban },
  { href: "/segments", label: "Segments", icon: Filter },
  { href: "/tags", label: "Tags", icon: Tag },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (pathname === "/login") return null;

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-[#1a1a24] border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-64 bg-[#1a1a24] border-r border-slate-700 fixed left-0 top-0 h-screen flex flex-col z-50
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#C9A96E]">Marimbas CRM</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-slate-700 text-[#C9A96E] border-l-4 border-[#C9A96E]"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {session?.user && (
          <div className="p-3 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors w-full"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-700">
          <p className="text-xs text-slate-500">Marimbas Home 2026</p>
        </div>
      </aside>
    </>
  );
}
