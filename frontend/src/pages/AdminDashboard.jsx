import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import Timeline from '../components/Timeline';
import { Shield, Users, Server, ClipboardList, PlusCircle, UserCog, Activity, ListOrdered, ChevronDown, ChevronUp } from 'lucide-react';

const t = {
  en: {
    categories: {
      "Potholes": "Potholes",
      "Water leakage": "Water leakage",
      "Street lights": "Street lights",
      "Open manholes": "Open manholes",
      "Drainage": "Drainage",
      "Fallen trees": "Fallen trees",
      "Illegal dumping": "Illegal dumping",
      "Garbage": "Garbage"
    }
  },
  hi: {
    categories: {
      "Potholes": "सड़क के गड्ढे",
      "Water leakage": "पानी का रिसाव",
      "Street lights": "स्ट्रीट लाइट",
      "Open manholes": "खुले मैनहोल",
      "Drainage": "जल निकासी",
      "Fallen trees": "गिरे हुए पेड़",
      "Illegal dumping": "अवैध डंपिंग",
      "Garbage": "कचरा"
    }
  },
  te: {
    categories: {
      "Potholes": "రోడ్డు గుంతలు",
      "Water leakage": "నీటి లీకేజీ",
      "Street lights": "వీధి దీపాలు",
      "Open manholes": "తెరిచిన మ్యాన్‌హోల్స్",
      "Drainage": "డ్రైనేజీ",
      "Fallen trees": "కూలిపోయిన చెట్లు",
      "Illegal dumping": "అక్రమ డంపింగ్",
      "Garbage": "చెత్త"
    }
  }
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem('civic_lang') || 'en');
  const [translatedDesc, setTranslatedDesc] = useState('');

  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

  useEffect(() => {
    const handleLangUpdate = () => {
      setLang(localStorage.getItem('civic_lang') || 'en');
    };
    window.addEventListener('civic_lang_changed', handleLangUpdate);
    return () => window.removeEventListener('civic_lang_changed', handleLangUpdate);
  }, []);

  useEffect(() => {
    if (!selectedComplaint?.description) {
      setTranslatedDesc('');
      return;
    }
    
    if (lang === 'en') {
      setTranslatedDesc(selectedComplaint.description);
      return;
    }

    const translate = async () => {
      try {
        const res = await axios.post(`${API_URL}/complaints/translate`, {
          text: selectedComplaint.description,
          targetLang: lang
        });
        setTranslatedDesc(res.data.translatedText);
      } catch (err) {
        setTranslatedDesc(selectedComplaint.description);
      }
    };

    translate();
  }, [selectedComplaint, lang]);

  // Accordion toggle states
  const [showUsersBoard, setShowUsersBoard] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Promoted User role states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [targetRole, setTargetRole] = useState('worker');
  const [deptBindId, setDeptBindId] = useState('');

  // Add Department states
  const [newDeptName, setNewDeptName] = useState('');

  // Add Worker account states
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerDeptId, setWorkerDeptId] = useState('');

  // Add Supervisor account states
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [supervisorPhone, setSupervisorPhone] = useState('');
  const [supervisorDeptId, setSupervisorDeptId] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes, auditRes, complaintsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`),
        axios.get(`${API_URL}/admin/departments`),
        axios.get(`${API_URL}/admin/audit`),
        axios.get(`${API_URL}/complaints`)
      ]);

      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setAuditLogs(auditRes.data);
      setComplaints(complaintsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add Department submit
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName) return;

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await axios.post(`${API_URL}/admin/department`, { name: newDeptName });
      setSuccessMsg(`Department '${newDeptName}' created successfully.`);
      setNewDeptName('');
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create department.');
    } finally {
      setLoading(false);
    }
  };

  // Promote User role submit
  const handlePromoteUser = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !targetRole) return;

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      await axios.post(`${API_URL}/admin/change-role`, {
        userId: selectedUserId,
        role: targetRole,
        departmentId: deptBindId || undefined
      });

      setSuccessMsg('User role updated successfully.');
      setSelectedUserId('');
      setTargetRole('worker');
      setDeptBindId('');
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update user role.');
    } finally {
      setLoading(false);
    }
  };

  // Add Worker submit
  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!workerName || !workerEmail || !workerPassword || !workerPhone || !workerDeptId) {
      setErrorMsg('All fields are required to create a worker account.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await axios.post(`${API_URL}/admin/worker`, {
        name: workerName,
        email: workerEmail,
        password: workerPassword,
        phone: workerPhone,
        departmentId: workerDeptId
      });

      setSuccessMsg(res.data.message);
      setWorkerName('');
      setWorkerEmail('');
      setWorkerPassword('');
      setWorkerPhone('');
      setWorkerDeptId('');
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create worker account.');
    } finally {
      setLoading(false);
    }
  };

  // Add Supervisor submit
  const handleAddSupervisor = async (e) => {
    e.preventDefault();
    if (!supervisorName || !supervisorEmail || !supervisorPassword || !supervisorPhone || !supervisorDeptId) {
      setErrorMsg('All fields are required to create a supervisor account.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await axios.post(`${API_URL}/admin/supervisor`, {
        name: supervisorName,
        email: supervisorEmail,
        password: supervisorPassword,
        phone: supervisorPhone,
        departmentId: supervisorDeptId
      });

      setSuccessMsg(res.data.message);
      setSupervisorName('');
      setSupervisorEmail('');
      setSupervisorPassword('');
      setSupervisorPhone('');
      setSupervisorDeptId('');
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create supervisor account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Live Metrics Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        
        {/* Unassigned */}
        <div className="glass-panel p-6 rounded-2xl border dark:border-slate-800 flex justify-between items-center shadow bg-gradient-to-br from-brand-500/10 to-brand-500/5">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Unassigned</span>
            <span className="text-3xl font-black text-brand-500 mt-1 block">
              {complaints.filter(c => c.status === 'raised').length}
            </span>
          </div>
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Active */}
        <div className="glass-panel p-6 rounded-2xl border dark:border-slate-800 flex justify-between items-center shadow bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Active</span>
            <span className="text-3xl font-black text-blue-500 mt-1 block">
              {complaints.filter(c => c.status === 'assigned' || c.status === 'worker_assigned').length}
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-panel p-6 rounded-2xl border dark:border-slate-800 flex justify-between items-center shadow bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">In Progress</span>
            <span className="text-3xl font-black text-amber-500 mt-1 block">
              {complaints.filter(c => c.status === 'worker_reached' || c.status === 'work_started' || c.status === 'citizen_rejected').length}
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Completed */}
        <div className="glass-panel p-6 rounded-2xl border dark:border-slate-800 flex justify-between items-center shadow bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Completed</span>
            <span className="text-3xl font-black text-emerald-500 mt-1 block">
              {complaints.filter(c => c.status === 'completed' || c.status === 'citizen_verified' || c.status === 'closed').length}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side Column: Manage Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Add Department Form */}
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-brand-500" /> Add Municipal Department
            </h3>
            
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  value={newDeptName}
                  onChange={e => setNewDeptName(e.target.value)}
                  placeholder="e.g. Electricity, Water" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow"
              >
                Create Department
              </button>
            </form>
          </div>

          {/* User Role Promotion Management */}
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-amber-500" /> Promote User Roles
            </h3>

            <form onSubmit={handlePromoteUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Account</label>
                <select 
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                >
                  <option value="">Choose user account...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) - {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Role</label>
                <select 
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                >
                  <option value="worker">Field Worker</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="officer">Municipal Officer</option>
                  <option value="admin">System Admin</option>
                  <option value="citizen">Citizen</option>
                </select>
              </div>

              {targetRole === 'worker' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assign Department</label>
                  <select 
                    value={deptBindId}
                    onChange={e => setDeptBindId(e.target.value)}
                    className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                  >
                    <option value="">Choose department...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow"
              >
                Promote User Account
              </button>
            </form>
          </div>

          {/* Create Worker Form */}
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-indigo-500" /> Create Field Worker
            </h3>

            <form onSubmit={handleAddWorker} className="space-y-3.5">
              <div>
                <input 
                  type="text" 
                  value={workerName}
                  onChange={e => setWorkerName(e.target.value)}
                  placeholder="Full Name" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <input 
                  type="email" 
                  value={workerEmail}
                  onChange={e => setWorkerEmail(e.target.value)}
                  placeholder="Email Address" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <input 
                  type="password" 
                  value={workerPassword}
                  onChange={e => setWorkerPassword(e.target.value)}
                  placeholder="Password" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <input 
                  type="text" 
                  value={workerPhone}
                  onChange={e => setWorkerPhone(e.target.value)}
                  placeholder="Phone Number" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <select 
                  value={workerDeptId}
                  onChange={e => setWorkerDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow"
              >
                Create Worker Account
              </button>
            </form>
          </div>

          {/* Create Supervisor Form */}
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-emerald-500" /> Create Supervisor
            </h3>

            <form onSubmit={handleAddSupervisor} className="space-y-3.5">
              <div>
                <input 
                  type="text" 
                  value={supervisorName}
                  onChange={e => setSupervisorName(e.target.value)}
                  required
                  placeholder="Full Name" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none animate-focus"
                />
              </div>

              <div>
                <input 
                  type="email" 
                  value={supervisorEmail}
                  onChange={e => setSupervisorEmail(e.target.value)}
                  required
                  placeholder="Email Address" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none animate-focus"
                />
              </div>

              <div>
                <input 
                  type="password" 
                  value={supervisorPassword}
                  onChange={e => setSupervisorPassword(e.target.value)}
                  required
                  placeholder="Password" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none animate-focus"
                />
              </div>

              <div>
                <input 
                  type="text" 
                  value={supervisorPhone}
                  onChange={e => setSupervisorPhone(e.target.value)}
                  required
                  placeholder="Phone Number" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none animate-focus"
                />
              </div>

              <div>
                <select 
                  value={supervisorDeptId}
                  onChange={e => setSupervisorDeptId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow"
              >
                Create Supervisor Account
              </button>
            </form>
          </div>

        </div>

        {/* Right Side Column: Accounts Board & Audit Trails */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Notifications / Alerts feedback */}
          {(successMsg || errorMsg) && (
            <div className="glass-panel shadow-md rounded-2xl p-4 border dark:border-slate-800">
              {successMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-900/30 rounded-xl text-emerald-400 text-xs font-semibold">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-900/30 rounded-xl text-red-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* Grievance Registry */}
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-500" /> Municipal Grievance Registry
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-darkbg-800 font-extrabold text-slate-400 uppercase">
                {complaints.length} Total
              </span>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {complaints.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">No complaints filed yet.</p>
              ) : (
                complaints.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedComplaint(c)}
                    className="p-3.5 border dark:border-slate-800/60 border-slate-200 rounded-xl text-xs bg-slate-50 dark:bg-darkbg-800/10 hover:scale-[1.01] transition shadow-sm cursor-pointer flex justify-between items-start"
                  >
                    <div className="space-y-1 max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 text-[11px]">{t[lang]?.categories?.[c.category] || c.category}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase ${
                          c.priority === 'critical' ? 'bg-red-500 animate-pulse' : c.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>{c.priority}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium truncate">{c.description}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.address || 'GPS Coordinates'}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-[10px]">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold capitalize ${
                        c.status === 'closed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        c.status === 'citizen_verified' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                        c.status === 'completed' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                      <span className="text-slate-500 text-[9px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Board Accounts */}
          <div className="glass-panel shadow-md rounded-2xl border dark:border-slate-800 overflow-hidden">
            <button 
              onClick={() => setShowUsersBoard(!showUsersBoard)}
              className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-darkbg-800/10 transition"
            >
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" /> Users Board Accounts
              </h3>
              {showUsersBoard ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            
            {showUsersBoard && (
              <div className="p-6 pt-0 border-t dark:border-slate-800/40">
                <div className="overflow-x-auto max-h-[250px] pr-2 mt-4">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b dark:border-slate-800 text-slate-400">
                        <th className="py-2">Name</th>
                        <th className="py-2">Email</th>
                        <th className="py-2">Role</th>
                        <th className="py-2">Department</th>
                        <th className="py-2">Civic Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-darkbg-800/10">
                          <td className="py-2 font-bold">{u.name}</td>
                          <td className="py-2 text-slate-500">{u.email}</td>
                          <td className="py-2"><span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-darkbg-800 font-bold capitalize">{u.role}</span></td>
                          <td className="py-2 text-slate-400">
                            {u.role === 'supervisor' ? (u.department?.name || 'Roads') : 
                             u.role === 'worker' ? (u.Worker?.Department?.name || u.worker?.Department?.name || u.Worker?.department?.name || u.worker?.department?.name || 'Roads') : 
                             '-'}
                          </td>
                          <td className="py-2 text-amber-500 font-extrabold">{u.civicPoints} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Activity Logs Audits */}
          <div className="glass-panel shadow-md rounded-2xl border dark:border-slate-800 overflow-hidden">
            <button 
              onClick={() => setShowAuditLogs(!showAuditLogs)}
              className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-darkbg-800/10 transition"
            >
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" /> Activity Logs & Audit Trail
              </h3>
              {showAuditLogs ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>

            {showAuditLogs && (
              <div className="p-6 pt-0 border-t dark:border-slate-800/40">
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2 mt-4">
                  {auditLogs.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-6">Audit trails clear.</p>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <div 
                        key={log.id || log._id || idx}
                        className="p-3 border dark:border-slate-800/60 rounded-xl text-[11px] leading-relaxed bg-slate-50 dark:bg-darkbg-800/10 flex justify-between items-center"
                      >
                        <div>
                          <span className="font-extrabold text-[9px] uppercase tracking-wider text-brand-500 mr-2">{log.action}</span>
                          <span className="text-slate-400">Entity:</span> <span className="font-bold text-slate-300">{log.entityType} ({log.entityId.substring(0, 8)})</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-300">
            
            <button 
              onClick={() => setSelectedComplaint(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 font-extrabold text-lg"
            >
              ✕
            </button>

            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-base uppercase tracking-wider text-brand-500">{t[lang]?.categories?.[selectedComplaint.category] || selectedComplaint.category}</h3>
                <p className="text-[10px] text-slate-400">ID: {selectedComplaint.id}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold text-white uppercase ${
                selectedComplaint.priority === 'critical' ? 'bg-red-500' : selectedComplaint.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
              }`}>{selectedComplaint.priority}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Citizen Reported Photo</span>
                {selectedComplaint.imageUrlBefore ? (
                  <img src={`http://localhost:5000${selectedComplaint.imageUrlBefore}`} className="w-full h-40 object-cover rounded-xl border dark:border-slate-800" />
                ) : (
                  <div className="w-full h-40 bg-slate-100 dark:bg-darkbg-800 rounded-xl flex items-center justify-center text-slate-400 text-xs">No Photo</div>
                )}
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Repair After Photo</span>
                {selectedComplaint.imageUrlAfter ? (
                  <img src={`http://localhost:5000${selectedComplaint.imageUrlAfter}`} className="w-full h-40 object-cover rounded-xl border dark:border-slate-800" />
                ) : (
                  <div className="w-full h-40 bg-slate-100 dark:bg-darkbg-800 rounded-xl flex items-center justify-center text-slate-400 text-xs">Awaiting Repair</div>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6 bg-slate-50 dark:bg-darkbg-800/40 p-4 rounded-xl border dark:border-slate-800 text-xs">
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400">Description</h4>
                <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{translatedDesc || selectedComplaint.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-400">Reporter Details</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-semibold">{selectedComplaint.citizen?.name || 'Anonymous'}</p>
                  <p className="text-[10px] text-slate-500">{selectedComplaint.citizen?.email}</p>
                </div>
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-400">Assigned Department</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-semibold">{selectedComplaint.department?.name || 'Unassigned'}</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400">Address</h4>
                <p className="text-slate-500 mt-1">{selectedComplaint.address || `GPS: ${selectedComplaint.lat}, ${selectedComplaint.lng}`}</p>
              </div>
            </div>

            <div className="border-t dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Incident Timeline</h4>
              <Timeline currentStatus={selectedComplaint.status} />
            </div>

          </div>
        </div>
      )}

  </Layout>
);
};

export default AdminDashboard;
