"use client";

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

  if (pathname === "/login") return null;

  return (
    <aside className="w-60 bg-[#1a1a24] border-r border-slate-700 fixed left-0 h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-[#C9A96E]">Marimbas CRM</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-slate-700 text-[#C9A96E] border-l-4 border-[#C9A96E]"
                  : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {session?.user && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full"
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

      <div className="p-6 border-t border-slate-700">
        <p className="text-xs text-slate-500">Marimbas Home 2026</p>
      </div>
    </aside>
  );
}
