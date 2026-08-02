import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import InteractiveMap from '../components/InteractiveMap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldCheck, BarChart3, TrendingUp, AlertCircle, FileSpreadsheet, MapPin } from 'lucide-react';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const OfficerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [mapMarkers, setMapMarkers] = useState({ complaints: [], workers: [] });
  const [predictions, setPredictions] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [statsRes, mapRes, predictRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/dashboard-stats`),
        axios.get(`${API_URL}/analytics/live-map`),
        axios.get(`${API_URL}/analytics/predictive-maintenance`)
      ]);

      setStats(statsRes.data);
      setMapMarkers(mapRes.data);
      setPredictions(predictRes.data.alerts || []);
    } catch (err) {
      console.error('Failed to load analytical metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert stats charts data to Recharts format
  const getCategoryChartData = () => {
    if (!stats?.charts?.categories) return [];
    return stats.charts.categories.map(c => ({
      name: c.category,
      value: Number(c.count)
    }));
  };

  const getStatusChartData = () => {
    if (!stats?.charts?.statuses) return [];
    return stats.charts.statuses.map(s => ({
      status: s.status.replace('_', ' ').toUpperCase(),
      count: Number(s.count)
    }));
  };

  const getPriorityChartData = () => {
    if (!stats?.charts?.priorities) return [];
    return stats.charts.priorities.map(p => ({
      priority: p.priority.toUpperCase(),
      count: Number(p.count)
    }));
  };

  // Export mock PDF/Excel reports
  const handleExportDataReport = () => {
    alert('Generating PDF Report... Downloading will begin shortly.');
  };

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Top Control Bar */}
        <div className="flex justify-between items-center bg-white/40 dark:bg-darkbg-800/20 p-4 rounded-2xl border dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black">City Command Analytics</h2>
            <p className="text-xs text-slate-400">Urban infrastructure monitoring and automated forecasting</p>
          </div>
          <button 
            onClick={handleExportDataReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Report
          </button>
        </div>

        {/* KPI Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass-panel shadow-md rounded-2xl p-5 border dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Reported</span>
              <h3 className="text-3xl font-black text-slate-700 dark:text-slate-100 mt-1">{stats.summary.totalRaised}</h3>
              <p className="text-[10px] text-brand-500 mt-2 font-bold flex items-center gap-0.5"><TrendingUp className="w-3.5 h-3.5" /> +12% this week</p>
            </div>
            
            <div className="glass-panel shadow-md rounded-2xl p-5 border dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolution Rate</span>
              <h3 className="text-3xl font-black text-emerald-500 mt-1">{stats.summary.resolutionRate}%</h3>
              <p className="text-[10px] text-slate-400 mt-2">Target resolution rate: 85.0%</p>
            </div>

            <div className="glass-panel shadow-md rounded-2xl p-5 border dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Anomalies</span>
              <h3 className="text-3xl font-black text-amber-500 mt-1">{stats.summary.activeComplaints}</h3>
              <p className="text-[10px] text-slate-400 mt-2">Currently assigned to dispatch</p>
            </div>

            <div className="glass-panel shadow-md rounded-2xl p-5 border dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Verification</span>
              <h3 className="text-3xl font-black text-purple-500 mt-1">{stats.summary.pendingVerification}</h3>
              <p className="text-[10px] text-slate-400 mt-2">Awaiting supervisor verification</p>
            </div>
          </div>
        )}

        {/* Central Map & Predictive Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Live Heatmap/Pins mapping */}
          <div className="lg:col-span-8 glass-panel shadow-md rounded-2xl p-5 border dark:border-slate-800 flex flex-col justify-between min-h-[420px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Live Incident Map</h3>
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-brand-500"><MapPin className="w-3.5 h-3.5" /> Realtime markers</span>
            </div>
            
            <div className="flex-1 rounded-xl overflow-hidden h-[340px]">
              <InteractiveMap 
                complaints={mapMarkers.complaints}
                workers={mapMarkers.workers}
              />
            </div>
          </div>

          {/* AI Predictive maintenance Alerts */}
          <div className="lg:col-span-4 glass-panel shadow-md rounded-2xl p-5 border dark:border-slate-800">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-purple-500" /> AI Predictive Alerts
            </h3>
            
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {predictions.length === 0 ? (
                <p className="text-slate-400 text-xs py-8 text-center">Collecting analytics data...</p>
              ) : (
                predictions.map((p, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-purple-400 uppercase tracking-wider">{p.departmentName} Dept</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-500 text-white uppercase">{p.riskLevel} risk</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">{p.reason}</p>
                    <div className="text-[10px] text-slate-500 font-bold border-t dark:border-slate-800 pt-2 flex justify-between">
                      <span>Forecast Failure:</span>
                      <span className="text-purple-400">{p.failureForecastDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Charts Analytics Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Category Chart */}
            <div className="glass-panel shadow-md rounded-2xl p-5 border dark:border-slate-800 flex flex-col justify-between min-h-[300px]">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Grievance category volume</h3>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCategoryChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {getCategoryChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-[9px] text-slate-400 border-t dark:border-slate-800 pt-3">
                {getCategoryChartData().map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1 truncate font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span>{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Chart */}
            <div className="glass-panel shadow-md rounded-2xl p-5 border dark:border-slate-800 flex flex-col justify-between min-h-[300px]">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Lifecycle status density</h3>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getStatusChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="status" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 8 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Severity chart */}
            <div className="glass-panel shadow-md rounded-2xl p-5 border dark:border-slate-800 flex flex-col justify-between min-h-[300px]">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Issue priority distribution</h3>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getPriorityChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="priority" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 8 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
};

export default OfficerDashboard;
