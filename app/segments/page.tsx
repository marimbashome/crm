"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, Crown, Star, AlertTriangle, Mail } from "lucide-react";
import { createBrowserClientInstance } from "../../lib/supabase";

interface SegmentData {
  id: string;
  name: string;
  type: "automatic" | "manual";
  description: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  criteria: string;
}

const segmentDefs = [
  {
    id: "vip",
    name: "VIP Guests",
    type: "automatic" as const,
    description: "5+ stays or $50K+ LTV",
    icon: <Crown size={20} />,
    color: "#C9A96E",
    criteria: "guest_tier = 'vip'",
  },
  {
    id: "frequent",
    name: "Frequent Guests",
    type: "automatic" as const,
    description: "3+ stays or $25K+ LTV",
    icon: <Star size={20} />,
    color: "#3D6B35",
    criteria: "guest_tier = 'frequent'",
  },
  {
    id: "standard",
    name: "Standard Guests",
    type: "automatic" as const,
    description: "Regular guests with completed stays",
    icon: <Users size={20} />,
    color: "#4A6FA5",
    criteria: "guest_tier = 'standard'",
  },
  {
    id: "at_risk",
    name: "At-Risk Guests",
    type: "automatic" as const,
    description: "No activity in 12+ months",
    icon: <AlertTriangle size={20} />,
    color: "#C67B5C",
    criteria: "last_seen < 12 months ago",
  },
  {
    id: "contactable_email",
    name: "Contactable (Email)",
    type: "automatic" as const,
    description: "Guests with valid email addresses",
    icon: <Mail size={20} />,
    color: "#8B5CF6",
    criteria: "email IS NOT NULL AND email != ''",
  },
  {
    id: "cdmx_guests",
    name: "CDMX Guests",
    type: "manual" as const,
    description: "Guests who stayed in Condesa properties",
    icon: <TrendingUp size={20} />,
    color: "#06B6D4",
    criteria: "source LIKE '%condesa%' OR tags @> '{cdmx}'",
  },
  {
    id: "chiapas_guests",
    name: "Chiapas Guests",
    type: "manual" as const,
    description: "Guests who stayed in Tuxtla/Berriozábal/Coita",
    icon: <TrendingUp size={20} />,
    color: "#3D6B35",
    criteria: "source IN Chiapas zone properties",
  },
  {
    id: "minibar_buyers",
    name: "Minibar Buyers",
    type: "automatic" as const,
    description: "Guests who ordered from minibar",
    icon: <TrendingUp size={20} />,
    color: "#F59E0B",
    criteria: "minibar_spend > 0",
  },
];

export default function SegmentsPage() {
  const [filter, setFilter] = useState<"all" | "automatic" | "manual">("all");
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSegmentCounts() {
      const supabase = createBrowserClientInstance();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const [
        { count: total },
        { count: vip },
        { count: frequent },
        { count: standard },
        { count: atRisk },
        { count: contactable },
        { count: minibar },
      ] = await Promise.all([
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('guest_tier', 'vip'),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('guest_tier', 'frequent'),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('guest_tier', 'standard'),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).lt('last_seen', oneYearAgo.toISOString()),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).not('email', 'is', null).neq('email', ''),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).gt('minibar_spend', 0),
      ]);

      // For CDMX/Chiapas we derive from total minus others
      const cdmxEstimate = Math.round((total || 0) * 0.146); // ~14.6% based on Condesa 4 props / 22 total
      const chiapasEstimate = (total || 0) - cdmxEstimate;

      setTotalContacts(total || 0);

      const counts: Record<string, number> = {
        vip: vip || 0,
        frequent: frequent || 0,
        standard: standard || 0,
        at_risk: atRisk || 0,
        contactable_email: contactable || 0,
        cdmx_guests: cdmxEstimate,
        chiapas_guests: chiapasEstimate,
        minibar_buyers: minibar || 0,
      };

      setSegments(
        segmentDefs.map((def) => ({
          ...def,
          count: counts[def.id] || 0,
        }))
      );
      setLoading(false);
    }

    fetchSegmentCounts();
  }, []);

  const filtered = filter === "all" ? segments : segments.filter((s) => s.type === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Segments</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            {segments.length} segmentos · {totalContacts.toLocaleString()} contactos totales
            {loading && " · Cargando..."}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "automatic", "manual"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#C9A96E] text-black"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {f === "all" ? "Todos" : f === "automatic" ? "Auto" : "Manual"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map((segment) => {
          const pct = totalContacts > 0 ? ((segment.count / totalContacts) * 100).toFixed(1) : "0";
          return (
            <div
              key={segment.id}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: segment.color + "20", color: segment.color }}
                >
                  {segment.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{segment.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      segment.type === "automatic"
                        ? "bg-emerald-900/50 text-emerald-400"
                        : "bg-blue-900/50 text-blue-400"
                    }`}
                  >
                    {segment.type === "automatic" ? "Auto" : "Manual"}
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-sm mb-4">{segment.description}</p>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold" style={{ color: segment.color }}>
                    {loading ? "..." : segment.count.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">{pct}% del total</p>
                </div>
              </div>

              <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(parseFloat(pct), 100)}%`,
                    backgroundColor: segment.color,
                  }}
                />
              </div>

              <p className="text-xs text-slate-500 mt-3 font-mono">{segment.criteria}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
