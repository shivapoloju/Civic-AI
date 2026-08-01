import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bell, LogOut, Moon, Sun, User, MapPin, Award, Shield, Hammer, ClipboardCheck } from 'lucide-react';
import axios from 'axios';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { liveUpdate } = useSocket();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Push incoming live notification to list
  useEffect(() => {
    if (liveUpdate && liveUpdate.type === 'NOTIFICATION') {
      setNotifications(prev => [liveUpdate.data, ...prev]);
    }
  }, [liveUpdate]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications list:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => axios.post(`${API_URL}/notifications/${n.id || n._id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="w-5 h-5 text-red-500" />;
      case 'supervisor': return <ClipboardCheck className="w-5 h-5 text-emerald-500" />;
      case 'worker': return <Hammer className="w-5 h-5 text-amber-500" />;
      default: return <User className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 dark:bg-darkbg-900 bg-slate-50">
      {/* Top Header navbar */}
      <header className="sticky top-0 z-50 glass-panel shadow-sm px-6 py-4 flex items-center justify-between border-b dark:border-slate-800 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-brand-600 to-brand-500 p-2.5 rounded-xl shadow-md text-white font-bold text-lg tracking-wider">
            CAI
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">
              CivicAI
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Smart City Resolver</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {user && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-darkbg-800 px-3.5 py-1.5 rounded-full border dark:border-slate-700">
              {getRoleIcon(user.role)}
              <span className="text-xs font-semibold uppercase tracking-wider capitalize text-slate-500 dark:text-slate-300">
                {user.role} Dashboard
              </span>
            </div>
          )}

          {user?.role === 'citizen' && (
            <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full text-sm font-bold">
              <Award className="w-4 h-4 fill-amber-500 animate-bounce" />
              <span>{user.civicPoints} Civic Points</span>
            </div>
          )}

          {/* Theme Switcher */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl dark:bg-darkbg-800 bg-slate-100 hover:scale-105 border dark:border-slate-700"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Notifications Center */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                if (!showNotifMenu) markAllRead();
              }}
              className="p-2 rounded-xl dark:bg-darkbg-800 bg-slate-100 relative hover:scale-105 border dark:border-slate-700"
            >
              <Bell className="w-5 h-5 text-slate-500 dark:text-slate-300" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-3 w-80 glass-panel shadow-2xl rounded-2xl p-4 border dark:border-slate-700 overflow-hidden z-50">
                <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                  <h4 className="font-bold text-sm">Notifications</h4>
                  <span className="text-xs text-brand-500 cursor-pointer font-semibold" onClick={markAllRead}>Mark all read</span>
                </div>
                <div className="max-h-64 overflow-y-auto mt-2 space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs py-4 text-slate-400">No notifications yet.</p>
                  ) : (
                    notifications.map((n, idx) => (
                      <div 
                        key={n.id || n._id || idx} 
                        className={`p-2.5 rounded-lg border text-xs transition ${
                          n.isRead ? 'bg-transparent border-slate-200 dark:border-slate-800' : 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-100 dark:border-brand-900/30'
                        }`}
                      >
                        <div className="flex justify-between items-start font-bold">
                          <span className="text-slate-600 dark:text-slate-200">{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Signout */}
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-red-950/30 bg-red-50 hover:bg-red-100 text-red-500 text-sm font-semibold border border-red-200 dark:border-red-900/30 transition hover:scale-105"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="py-6 border-t dark:border-slate-800 text-center text-xs text-slate-400 bg-transparent">
        <p>&copy; {new Date().getFullYear()} CivicAI Corp. Built for Smart Governance. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
