import { createClient } from '../lib/supabase';

export const revalidate = 60; // revalidate every 60 seconds

async function getDashboardData() {
  const supabase = createClient();

  const [
    { count: totalContacts },
    { data: ltvData },
    { count: totalInteractions },
    { count: vipCount },
    { count: frequentCount },
    { count: contactableEmail },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true }),
    supabase.from('crm_contacts').select('lifetime_value').not('lifetime_value', 'is', null),
    supabase.from('crm_interactions').select('*', { count: 'exact', head: true }),
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('guest_tier', 'vip'),
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('guest_tier', 'frequent'),
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).not('email', 'is', null).neq('email', ''),
    supabase.from('crm_activity_log').select('id, type, date, contact_name, contact_type, subject').order('date', { ascending: false }).limit(10),
  ]);

  const totalLTV = ltvData?.reduce((sum, r) => sum + (Number(r.lifetime_value) || 0), 0) || 0;

  return {
    totalContacts: totalContacts || 0,
    totalLTV,
    totalInteractions: totalInteractions || 0,
    vipCount: vipCount || 0,
    frequentCount: frequentCount || 0,
    contactableEmail: contactableEmail || 0,
    recentActivity: recentActivity || [],
  };
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M MXN`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K MXN`;
  }
  return `$${value.toFixed(0)} MXN`;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHrs < 24) return `hace ${diffHrs}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

const activityIcons: Record<string, string> = {
  reservation: '🏨',
  check_in: '✅',
  check_out: '👋',
  review: '⭐',
  minibar_order: '🛒',
  message: '💬',
  note: '📝',
  email: '📧',
};

export default async function Dashboard() {
  const data = await getDashboardData();

  const kpis = [
    { label: "Total Contacts", value: data.totalContacts.toLocaleString(), icon: "📊" },
    { label: "Total LTV", value: formatCurrency(data.totalLTV), icon: "💰" },
    { label: "Interactions", value: data.totalInteractions.toLocaleString(), icon: "💬" },
    { label: "VIP Guests", value: data.vipCount.toLocaleString(), icon: "👑" },
    { label: "Frequent", value: data.frequentCount.toLocaleString(), icon: "⭐" },
    { label: "Contactable (email)", value: data.contactableEmail.toLocaleString(), icon: "📧" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Vista general del CRM — datos en tiempo real</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-slate-800 rounded-lg p-3 sm:p-4 lg:p-6 border border-slate-700 hover:border-slate-600 transition"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-slate-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2 truncate">
                  {kpi.label}
                </p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#C9A96E] truncate">{kpi.value}</p>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl opacity-50 flex-shrink-0 hidden sm:block">{kpi.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
          Actividad Reciente
        </h2>
        {data.recentActivity.length === 0 ? (
          <p className="text-slate-400">No hay actividad reciente</p>
        ) : (
          <div className="space-y-3">
            {data.recentActivity.map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition"
              >
                <span className="text-2xl">
                  {activityIcons[activity.type] || '📋'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {activity.subject || activity.type}
                  </p>
                  <p className="text-xs text-slate-400">
                    {activity.contact_name || 'Sin contacto'} · {activity.contact_type || ''}
                  </p>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {formatTimeAgo(activity.date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
