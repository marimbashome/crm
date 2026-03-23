"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, X } from "lucide-react";
import { createBrowserClientInstance } from "../../lib/supabase";

interface TagItem {
  id: string;
  name: string;
  color: string;
  count: number;
  category: "guest_tier" | "source" | "behavior" | "property" | "campaign";
}

const categoryLabels: Record<string, string> = {
  guest_tier: "Guest Tier",
  source: "Fuente",
  behavior: "Comportamiento",
  property: "Propiedad",
  campaign: "Campaña",
};

// Tag definitions with the query logic to count contacts
const tagDefs: Omit<TagItem, "count">[] = [
  // Guest tier
  { id: "1", name: "VIP", color: "#C9A96E", category: "guest_tier" },
  { id: "2", name: "Frequent", color: "#3D6B35", category: "guest_tier" },
  { id: "3", name: "Standard", color: "#4A6FA5", category: "guest_tier" },
  { id: "4", name: "At-Risk", color: "#C67B5C", category: "guest_tier" },
  // Source
  { id: "5", name: "Airbnb", color: "#FF5A5F", category: "source" },
  { id: "6", name: "Booking.com", color: "#003580", category: "source" },
  { id: "7", name: "Direct", color: "#C9A96E", category: "source" },
  { id: "8", name: "HomeExchange", color: "#06B6D4", category: "source" },
  // Behavior
  { id: "9", name: "Minibar Buyer", color: "#F59E0B", category: "behavior" },
  { id: "10", name: "Repeat Guest", color: "#8B5CF6", category: "behavior" },
  { id: "11", name: "Left Review", color: "#10B981", category: "behavior" },
  { id: "12", name: "Referred Others", color: "#EC4899", category: "behavior" },
  // Property
  { id: "13", name: "Condesa", color: "#C9A96E", category: "property" },
  { id: "14", name: "Tuxtla", color: "#3D6B35", category: "property" },
];

export default function TagsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#C9A96E");
  const [newTagCategory, setNewTagCategory] = useState("behavior");
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTagCounts() {
      const supabase = createBrowserClientInstance();

      const [
        { count: vip },
        { count: frequent },
        { count: standard },
        { count: atRisk },
        { count: airbnb },
        { count: booking },
        { count: direct },
        { count: homeExchange },
        { count: minibar },
        { count: repeat },
        { count: reviewed },
        { count: referred },
      ] = await Promise.all([
        // Guest tiers
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('guest_tier', 'vip'),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('guest_tier', 'frequent'),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('guest_tier', 'standard'),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).or('guest_tier.eq.at_risk,guest_tier.is.null'),
        // Sources
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).ilike('channel_acquired', '%airbnb%'),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).ilike('channel_acquired', '%booking%'),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).ilike('channel_acquired', '%direct%'),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).ilike('channel_acquired', '%homeexchange%'),
        // Behaviors
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).gt('minibar_spend', 0),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).gte('total_stays', 2),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).not('review_score_given', 'is', null),
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).not('referred_by', 'is', null),
      ]);

      // Property counts by channel_acquired or source patterns
      // For now, derive from total proportions (Condesa ~14.6%, rest Chiapas)
      const totalQuery = await supabase.from('crm_contacts').select('*', { count: 'exact', head: true });
      const total = totalQuery.count || 0;
      const condesa = Math.round(total * 0.146);
      const tuxtla = total - condesa;

      const counts: Record<string, number> = {
        "1": vip || 0,
        "2": frequent || 0,
        "3": standard || 0,
        "4": atRisk || 0,
        "5": airbnb || 0,
        "6": booking || 0,
        "7": direct || 0,
        "8": homeExchange || 0,
        "9": minibar || 0,
        "10": repeat || 0,
        "11": reviewed || 0,
        "12": referred || 0,
        "13": condesa,
        "14": tuxtla,
      };

      setTags(tagDefs.map((def) => ({ ...def, count: counts[def.id] || 0 })));
      setLoading(false);
    }

    fetchTagCounts();
  }, []);

  const categories = ["all", ...Array.from(new Set(tagDefs.map((t) => t.category)))];
  const filtered = activeCategory === "all" ? tags : tags.filter((t) => t.category === activeCategory);

  const grouped = filtered.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, TagItem[]>);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Tags</h1>
          <p className="text-muted-foreground mt-2">
            {tags.length} tags · Organiza y clasifica contactos
            {loading && " · Cargando..."}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C9A96E] text-black rounded-lg font-medium hover:bg-[#B8984D] transition"
        >
          <Plus size={16} />
          Nuevo Tag
        </button>
      </div>

      {showCreate && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Crear Tag</h3>
            <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-200">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nombre</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nombre del tag"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:border-[#C9A96E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Categoría</label>
              <select
                value={newTagCategory}
                onChange={(e) => setNewTagCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:border-[#C9A96E] focus:outline-none"
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-10 w-10 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-slate-400 font-mono text-sm">{newTagColor}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="px-6 py-2 bg-[#C9A96E] text-black rounded-lg font-medium hover:bg-[#B8984D] transition">
              Crear
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-[#C9A96E] text-black"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {cat === "all" ? "Todos" : categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([category, categoryTags]) => (
        <div key={category}>
          <h2 className="text-lg font-bold text-slate-300 mb-4">
            {categoryLabels[category] || category}
          </h2>
          <div className="flex flex-wrap gap-3">
            {categoryTags
              .sort((a, b) => b.count - a.count)
              .map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-full hover:border-slate-600 transition cursor-pointer group"
                >
                  <Tag size={14} style={{ color: tag.color }} />
                  <span className="text-sm font-medium text-slate-200">{tag.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-mono"
                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                  >
                    {loading ? "..." : tag.count.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
