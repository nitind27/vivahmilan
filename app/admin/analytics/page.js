'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Globe, Monitor, Smartphone, Tablet, Eye, Users,
  TrendingUp, RefreshCw, MapPin, Search,
  ExternalLink, Calendar, Activity, Link2
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-gray-400 text-sm mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, max, color = 'bg-vd-primary', sub }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white truncate">{label}</span>
          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{value.toLocaleString()}{sub ? ` · ${sub}` : ''}</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full">
          <div className={`h-1.5 ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

const DEVICE_ICONS = { Mobile: Smartphone, Tablet: Tablet, Desktop: Monitor };
const DEVICE_COLORS = { Mobile: 'text-green-400 bg-green-900/20', Tablet: 'text-blue-400 bg-blue-900/20', Desktop: 'text-purple-400 bg-purple-900/20' };

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState('overview');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      const d = await res.json();
      setData(d);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [days]);

  const maxPageViews = data?.topPages?.[0]?.views || 1;
  const maxCountry   = data?.topCountries?.[0]?.views || 1;
  const maxReferrer  = data?.topReferrers?.[0]?.cnt || 1;
  const totalDevices = data?.deviceBreakdown?.reduce((s, d) => s + Number(d.cnt), 0) || 1;
  const totalBrowsers = data?.browserBreakdown?.reduce((s, d) => s + Number(d.cnt), 0) || 1;

  // Mini sparkline from daily trend
  const trend = data?.dailyTrend || [];
  const maxTrend = Math.max(...trend.map(t => Number(t.views)), 1);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 border border-gray-700">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${days === d ? 'bg-vd-primary text-white' : 'text-gray-400 hover:text-white'}`}>
              {d}d
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm hover:bg-gray-700 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
        <p className="text-xs text-gray-500 ml-auto">Last {days} days</p>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Eye}       label="Total Page Views"   value={Number(data?.summary?.totalViews || 0).toLocaleString()}    color="text-blue-400"   bg="bg-blue-900/20"   />
            <StatCard icon={Users}     label="Unique Visitors"    value={Number(data?.summary?.uniqueVisitors || 0).toLocaleString()} color="text-green-400"  bg="bg-green-900/20"  />
            <StatCard icon={Activity}  label="Today's Views"      value={Number(data?.summary?.todayViews || 0).toLocaleString()}     color="text-yellow-400" bg="bg-yellow-900/20" />
            <StatCard icon={TrendingUp} label="Avg/Day"           value={trend.length ? Math.round(data.summary.totalViews / trend.length).toLocaleString() : '—'} color="text-vd-primary" bg="bg-vd-accent-soft dark:bg-vd-accent/20" />
          </div>

          {/* Daily trend sparkline */}
          {trend.length > 0 && (
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-vd-primary" /> Daily Traffic Trend
              </h3>
              <div className="flex items-end gap-1 h-24">
                {trend.map((t, i) => {
                  const h = Math.max(4, Math.round((Number(t.views) / maxTrend) * 96));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {t.date ? format(new Date(t.date), 'dd MMM') : ''}: {Number(t.views).toLocaleString()} views
                      </div>
                      <div className="w-full bg-vd-primary/80 hover:bg-vd-primary rounded-t-sm transition-colors" style={{ height: `${h}px` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{trend[0]?.date ? format(new Date(trend[0].date), 'dd MMM') : ''}</span>
                <span>{trend[trend.length - 1]?.date ? format(new Date(trend[trend.length - 1].date), 'dd MMM') : ''}</span>
              </div>
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'pages',    label: '📄 Pages' },
              { id: 'geo',      label: '🌍 Geography' },
              { id: 'tech',     label: '💻 Technology' },
              { id: 'visitors', label: '👥 Recent Visitors' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${activeTab === t.id ? 'bg-vd-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Device */}
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Monitor className="w-4 h-4 text-vd-primary" /> Devices</h3>
                <div className="space-y-3">
                  {(data?.deviceBreakdown || []).map(d => {
                    const Icon = DEVICE_ICONS[d.device] || Monitor;
                    const cls = DEVICE_COLORS[d.device] || 'text-gray-400 bg-gray-700';
                    const pct = Math.round((Number(d.cnt) / totalDevices) * 100);
                    return (
                      <div key={d.device} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white">{d.device}</span>
                            <span className="text-gray-400">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-700 rounded-full">
                            <div className="h-1.5 bg-vd-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Browser */}
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Link2 className="w-4 h-4 text-vd-primary" /> Browsers</h3>
                <div className="space-y-1">
                  {(data?.browserBreakdown || []).map(b => (
                    <BarRow key={b.browser} label={b.browser} value={Number(b.cnt)} max={totalBrowsers} sub={`${Math.round((Number(b.cnt)/totalBrowsers)*100)}%`} />
                  ))}
                </div>
              </div>

              {/* Top referrers */}
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><ExternalLink className="w-4 h-4 text-vd-primary" /> Traffic Sources</h3>
                <div className="space-y-1">
                  {(data?.topReferrers || []).length === 0 && <p className="text-gray-500 text-sm">No referrer data yet</p>}
                  {(data?.topReferrers || []).map((r, i) => {
                    const label = r.referrer === '' || !r.referrer ? 'Direct / None' : r.referrer.replace(/^https?:\/\//, '').split('/')[0];
                    return <BarRow key={i} label={label} value={Number(r.cnt)} max={maxReferrer} color="bg-blue-500" />;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Pages tab */}
          {activeTab === 'pages' && (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="px-5 py-3 bg-gray-700/50 flex items-center justify-between">
                <p className="font-semibold text-white">Top Pages</p>
                <p className="text-xs text-gray-500">{data?.topPages?.length || 0} pages</p>
              </div>
              <div className="divide-y divide-gray-700/50">
                {(data?.topPages || []).length === 0 && <p className="text-center py-10 text-gray-500 text-sm">No page data yet</p>}
                {(data?.topPages || []).map((p, i) => (
                  <div key={i} className="px-5 py-3 hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-5 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate font-medium">{p.page}</p>
                        <div className="mt-1 h-1 bg-gray-700 rounded-full">
                          <div className="h-1 bg-vd-primary rounded-full" style={{ width: `${Math.round((Number(p.views) / maxPageViews) * 100)}%` }} />
                        </div>
                      </div>
                      <span className="text-sm text-gray-300 flex-shrink-0 font-semibold">{Number(p.views).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Geography tab */}
          {activeTab === 'geo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                <div className="px-5 py-3 bg-gray-700/50"><p className="font-semibold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-vd-primary" /> Countries</p></div>
                <div className="p-4 space-y-1">
                  {(data?.topCountries || []).length === 0 && <p className="text-center py-8 text-gray-500 text-sm">No geo data yet</p>}
                  {(data?.topCountries || []).map((c, i) => (
                    <BarRow key={i} label={c.country || 'Unknown'} value={Number(c.views)} max={maxCountry} sub={`${Number(c.unique_visitors).toLocaleString()} unique`} color="bg-green-500" />
                  ))}
                </div>
              </div>
              <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                <div className="px-5 py-3 bg-gray-700/50"><p className="font-semibold text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-vd-primary" /> Top Cities</p></div>
                <div className="p-4 space-y-1">
                  {(data?.topCities || []).length === 0 && <p className="text-center py-8 text-gray-500 text-sm">No city data yet</p>}
                  {(data?.topCities || []).map((c, i) => (
                    <BarRow key={i} label={`${c.city}, ${c.country}`} value={Number(c.views)} max={data?.topCities?.[0]?.views || 1} color="bg-blue-500" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Technology tab */}
          {activeTab === 'tech' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="font-semibold text-white mb-4">Browsers</h3>
                <div className="space-y-1">
                  {(data?.browserBreakdown || []).map(b => (
                    <BarRow key={b.browser} label={b.browser} value={Number(b.cnt)} max={totalBrowsers} sub={`${Math.round((Number(b.cnt)/totalBrowsers)*100)}%`} />
                  ))}
                </div>
              </div>
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="font-semibold text-white mb-4">Operating Systems</h3>
                <div className="space-y-1">
                  {(data?.osBreakdown || []).map(o => {
                    const total = data.osBreakdown.reduce((s, x) => s + Number(x.cnt), 0);
                    return <BarRow key={o.os} label={o.os} value={Number(o.cnt)} max={total} sub={`${Math.round((Number(o.cnt)/total)*100)}%`} color="bg-purple-500" />;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recent Visitors tab */}
          {activeTab === 'visitors' && (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="px-5 py-3 bg-gray-700/50 flex items-center justify-between">
                <p className="font-semibold text-white">Recent Visitors (last 50)</p>
                <p className="text-xs text-gray-500">Real-time log</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/30">
                    <tr>
                      {['Time', 'Page', 'IP', 'Country / City', 'Device', 'Browser', 'Source'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {(data?.recentVisitors || []).length === 0 && (
                      <tr><td colSpan={7} className="text-center py-10 text-gray-500">No visitors yet</td></tr>
                    )}
                    {(data?.recentVisitors || []).map(v => (
                      <tr key={v.id} className="hover:bg-gray-700/20 transition-colors">
                        <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                          {v.createdAt ? format(new Date(v.createdAt), 'dd MMM, h:mm a') : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-white max-w-xs">
                          <span className="truncate block text-xs" title={v.page}>{v.page}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs font-mono whitespace-nowrap">{v.ip}</td>
                        <td className="px-4 py-2.5 text-gray-300 text-xs whitespace-nowrap">
                          {[v.city, v.country].filter(Boolean).join(', ') || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${v.device === 'Mobile' ? 'bg-green-900/30 text-green-400' : v.device === 'Tablet' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
                            {v.device}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{v.browser}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs max-w-xs">
                          <span className="truncate block" title={v.referrer}>
                            {v.referrer ? v.referrer.replace(/^https?:\/\//, '').split('/')[0] : 'Direct'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
