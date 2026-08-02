import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  ThumbsUp
} from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-brand-500 selection:text-white relative">
      {/* Dynamic ambient background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -z-10 animate-pulse duration-[6000ms]" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-10 left-1/3 w-[350px] h-[350px] bg-pink-500/5 rounded-full blur-3xl -z-10 animate-pulse duration-[5000ms]" />

      {/* Header / Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Civic Sense
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#portals" className="hover:text-white transition">Dashboard Panels</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                to={user.role === 'admin' ? '/admin' : user.role === 'supervisor' ? '/supervisor' : user.role === 'worker' ? '/worker' : user.role === 'officer' ? '/officer' : '/citizen'}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold uppercase rounded-xl shadow-lg hover:scale-102 transition duration-200 flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link 
                to="/login"
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white text-xs font-bold uppercase rounded-xl transition duration-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 border border-brand-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-brand-400 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Closed-Loop Smart Governance</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
          Sensible Cities.<br />
          <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
            Smarter Resolutions.
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Empowering citizens and municipal departments to report, route, inspect, and verify urban grievances in real-time. Transparent accountability, powered by AI feedback loops.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to={user ? '/citizen' : '/login'} 
            className="px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-extrabold uppercase rounded-xl shadow-xl shadow-brand-500/15 hover:scale-102 transition duration-200 w-full sm:w-auto"
          >
            File a Grievance
          </Link>
          <a 
            href="#features" 
            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-extrabold uppercase rounded-xl border border-slate-800 transition duration-200 w-full sm:w-auto"
          >
            Explore Platform
          </a>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">Modern Municipal Infrastructure</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">Four core layers designed to bring lightning-fast resolutions to public complaints.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 hover:border-slate-800/80 transition duration-200">
            <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center text-brand-400 mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-2">Multimodal Intake</h3>
            <p className="text-slate-400 text-xs leading-relaxed">Citizens capture and upload geolocated photo snapshots instantly. Geolocation coordinates map the exact hazard on the city grid.</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 hover:border-slate-800/80 transition duration-200">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-2">Spatial Auto-Dispatch</h3>
            <p className="text-slate-400 text-xs leading-relaxed">The system utilizes the Haversine formula to dynamically route and assign the closest field crew inside the respective department.</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 hover:border-slate-800/80 transition duration-200">
            <div className="w-10 h-10 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-2">AI-Powered Auditing</h3>
            <p className="text-slate-400 text-xs leading-relaxed">Supervisors perform visual checks comparing before/after photos with AI models to ensure the repairs meet rigorous quality standards.</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 hover:border-slate-800/80 transition duration-200">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-4">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-2">Closed-Loop Verification</h3>
            <p className="text-slate-400 text-xs leading-relaxed">Citizens review resolved tasks. Incomplete repairs can be rejected, forcing an automatic re-evaluation loop back to the dispatch supervisor.</p>
          </div>
        </div>
      </section>

      {/* Landing Portal panels */}
      <section id="portals" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">Unified Platform Portals</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">Different dashboards configured specifically for each actor in the resolution workflow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-brand-500 font-extrabold text-[10px] uppercase mb-1 tracking-wider">For Citizens</div>
              <h4 className="font-bold text-sm text-white mb-2">Citizen Dashboard</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">Report issues with photo uploads, track progress on a live feed, and rate or reject repair quality.</p>
            </div>
            <Link to="/login" className="text-xs text-brand-400 font-bold hover:text-brand-300 transition flex items-center gap-1 mt-4">
              <span>Enter Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-indigo-400 font-extrabold text-[10px] uppercase mb-1 tracking-wider">For Field Workers</div>
              <h4 className="font-bold text-sm text-white mb-2">Worker Portal</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">View assigned routing jobs, navigate via live map coordinates, and upload completed repair photos.</p>
            </div>
            <Link to="/login" className="text-xs text-indigo-400 font-bold hover:text-indigo-300 transition flex items-center gap-1 mt-4">
              <span>Enter Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-pink-400 font-extrabold text-[10px] uppercase mb-1 tracking-wider">For Administration</div>
              <h4 className="font-bold text-sm text-white mb-2">Supervisor Hub</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">Audit repair qualities, manage field team assignments, and process user rating escalations.</p>
            </div>
            <Link to="/login" className="text-xs text-pink-400 font-bold hover:text-pink-300 transition flex items-center gap-1 mt-4">
              <span>Enter Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-emerald-400 font-extrabold text-[10px] uppercase mb-1 tracking-wider">For City Chiefs</div>
              <h4 className="font-bold text-sm text-white mb-2">Admin Dashboard</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">Track analytics metrics, audit operational logs, register new supervisors, and overview city health.</p>
            </div>
            <Link to="/login" className="text-xs text-emerald-400 font-bold hover:text-emerald-300 transition flex items-center gap-1 mt-4">
              <span>Enter Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950 text-slate-500 text-[10px] font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-black text-white">Civic Sense</span>
          </div>
          <p className="text-center sm:text-right">&copy; {new Date().getFullYear()} Civic Sense Corp. Built for Smart Governance. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
