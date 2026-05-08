"use client"
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, AlertTriangle, CreditCard, Banknote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

type Stats = {
  revenue: { total: number; month: number; today: number };
  sales: { total: number; month: number; today: number };
  productsCount: number; lowStockCount: number; usersCount: number;
  chartData: { date: string; name: string; total: number }[];
  topProducts: { productName: string; _sum: { quantity: number; subtotal: number } }[];
  paymentBreakdown: { paymentMethod: string; _sum: { total: number }; _count: { id: number } }[];
};

export function DashboardClient({ stats }: { stats: Stats }) {
  const now = new Date();

  const kpis = [
    { label: "Today's Revenue", value: `$${stats.revenue.today.toFixed(2)}`, sub: `${stats.sales.today} transactions`, icon: DollarSign, color: '#6366f1', glow: 'rgba(99,102,241,0.3)' },
    { label: "Month Revenue", value: `$${stats.revenue.month.toFixed(2)}`, sub: `${stats.sales.month} transactions`, icon: TrendingUp, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
    { label: "Products", value: stats.productsCount, sub: stats.lowStockCount > 0 ? `${stats.lowStockCount} low stock` : 'All stocked', icon: Package, color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', warn: stats.lowStockCount > 0 },
    { label: "Active Users", value: stats.usersCount, sub: 'System users', icon: Users, color: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>Overview</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Live</span>
        </div>
      </div>

      {/* Low stock warning */}
      {stats.lowStockCount > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#fbbf24' }}>{stats.lowStockCount} product(s) are running low on stock.</p>
          <a href="/products" style={{ marginLeft: 'auto', fontSize: '12px', color: '#f59e0b', textDecoration: 'underline' }}>View →</a>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,${k.warn ? '0.12' : '0.07'})`, borderRadius: '12px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: k.glow, filter: 'blur(30px)', opacity: 0.4 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{k.label}</p>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${k.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={14} style={{ color: k.color }} />
              </div>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{k.value}</p>
            <p style={{ fontSize: '11px', color: k.warn ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
        {/* Revenue Chart */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Revenue — Last 7 Days</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Total: ${stats.chartData.reduce((a, d) => a + d.total, 0).toFixed(2)}</p>
            </div>
          </div>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Revenue']} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Payment Methods</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.paymentBreakdown.map(p => {
              const total = stats.paymentBreakdown.reduce((a, x) => a + (x._sum.total || 0), 0);
              const pct = total > 0 ? ((p._sum.total || 0) / total * 100).toFixed(0) : 0;
              const isCash = p.paymentMethod === 'CASH';
              return (
                <div key={p.paymentMethod}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isCash ? <Banknote size={14} style={{ color: '#34d399' }} /> : <CreditCard size={14} style={{ color: '#60a5fa' }} />}
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{p.paymentMethod}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{pct}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: isCash ? '#34d399' : '#60a5fa', borderRadius: '2px', transition: 'width 0.5s' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>${(p._sum.total || 0).toFixed(2)} · {p._count.id} txn</p>
                </div>
              );
            })}
            {stats.paymentBreakdown.length === 0 && <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: '20px' }}>No data yet</p>}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Top Products This Month</p>
        {stats.topProducts.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '20px' }}>No sales data yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.topProducts.map((p, i) => {
              const maxRevenue = stats.topProducts[0]._sum.subtotal || 1;
              const pct = ((p._sum.subtotal || 0) / maxRevenue * 100).toFixed(0);
              return (
                <div key={p.productName} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', width: '16px' }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{p.productName}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#a5b4fc' }}>${(p._sum.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '2px' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', width: '50px', textAlign: 'right' }}>{p._sum.quantity} sold</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
