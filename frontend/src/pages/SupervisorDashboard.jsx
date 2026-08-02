import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import Timeline from '../components/Timeline';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, UserPlus, FileText, Check, AlertOctagon, ClipboardList, Activity, Shield } from 'lucide-react';

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

const SupervisorDashboard = () => {
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;
  const BASE_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [unassignedComplaints, setUnassignedComplaints] = useState([]);
  const [lang, setLang] = useState(localStorage.getItem('civic_lang') || 'en');
  const [translatedFeedback, setTranslatedFeedback] = useState('');
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [aiReport, setAiReport] = useState(null);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    const handleLangUpdate = () => {
      setLang(localStorage.getItem('civic_lang') || 'en');
    };
    window.addEventListener('civic_lang_changed', handleLangUpdate);
    return () => window.removeEventListener('civic_lang_changed', handleLangUpdate);
  }, []);

  useEffect(() => {
    const desc = selectedDispatch?.description || selectedAudit?.description || selectedComplaint?.description;
    if (!desc) {
      setTranslatedDesc('');
      return;
    }
    
    if (lang === 'en') {
      setTranslatedDesc(desc);
      return;
    }

    const translate = async () => {
      try {
        const res = await axios.post(`${API_URL}/complaints/translate`, {
          text: desc,
          targetLang: lang
        });
        setTranslatedDesc(res.data.translatedText);
      } catch (err) {
        setTranslatedDesc(desc);
      }
    };

    translate();
  }, [selectedDispatch, selectedAudit, selectedComplaint, lang]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!aiReport?.feedback) {
      setTranslatedFeedback('');
      return;
    }
    
    if (lang === 'en') {
      setTranslatedFeedback(aiReport.feedback);
      return;
    }

    const translate = async () => {
      try {
        const res = await axios.post(`${API_URL}/complaints/translate`, {
          text: aiReport.feedback,
          targetLang: lang
        });
        setTranslatedFeedback(res.data.translatedText);
      } catch (err) {
        setTranslatedFeedback(aiReport.feedback);
      }
    };

    translate();
  }, [aiReport, lang]);
  const [aiLoading, setAiLoading] = useState(false);

  // Dispatch details
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  // Supervisor Action inputs
  const [feedback, setFeedback] = useState('');
  const [decision, setDecision] = useState(''); // 'approve', 'send_back'

  // Add Worker form states
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchSupervisorBoard();
  }, []);

  const fetchSupervisorBoard = async () => {
    try {
      setLoading(true);
      
      const [verifs, raised, workers, allComplaints] = await Promise.all([
        axios.get(`${API_URL}/supervisors/pending-verifications`),
        axios.get(`${API_URL}/complaints?status=assigned`), // or raised/unassigned
        axios.get(`${API_URL}/supervisors/available-workers`),
        axios.get(`${API_URL}/complaints`)
      ]);
      
      // Also fetch raised complaints
      const raisedRes = await axios.get(`${API_URL}/complaints?status=raised`);
      
      setPendingVerifications(verifs.data);
      setUnassignedComplaints([...raisedRes.data, ...raised.data]);
      setAvailableWorkers(workers.data);
      setComplaints(allComplaints.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Triggers visual comparative evaluation via FastAPI
  const handleAIInspectionCheck = async () => {
    if (!selectedAudit) return;
    try {
      setAiLoading(true);
      setErrorMsg('');
      setAiReport(null);

      const res = await axios.post(`${API_URL}/supervisors/compare-images`, {
        complaintId: selectedAudit.id
      });
      setAiReport(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'AI image verification check failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // Submit Audit decision (Approve/Send Back)
  const handleAuditDecision = async (e) => {
    e.preventDefault();
    if (!decision) {
      setErrorMsg('Please specify your audit decision.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const score = aiReport ? aiReport.confidenceScore : 1.0;

      await axios.post(`${API_URL}/supervisors/verify-decision`, {
        complaintId: selectedAudit.id,
        decision,
        feedback,
        confidenceScore: score
      });

      setSuccessMsg(`Decision '${decision}' filed and logged.`);
      setSelectedAudit(null);
      setAiReport(null);
      setFeedback('');
      setDecision('');
      fetchSupervisorBoard();
    } catch (err) {
      setErrorMsg('Failed to record verification result.');
    } finally {
      setLoading(false);
    }
  };

  // Dispatch work assignment
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId) {
      setErrorMsg('Please choose a field worker.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      await axios.post(`${API_URL}/supervisors/assign-worker`, {
        complaintId: selectedDispatch.id,
        workerId: selectedWorkerId
      });

      setSuccessMsg('Field worker dispatched successfully.');
      setSelectedDispatch(null);
      setSelectedWorkerId('');
      fetchSupervisorBoard();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Dispatch error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Add Worker submit
  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!workerName || !workerEmail || !workerPassword || !workerPhone) {
      setErrorMsg('All fields are required to create a worker account.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await axios.post(`${API_URL}/supervisors/worker`, {
        name: workerName,
        email: workerEmail,
        password: workerPassword,
        phone: workerPhone
      });

      setSuccessMsg(res.data.message);
      setWorkerName('');
      setWorkerEmail('');
      setWorkerPassword('');
      setWorkerPhone('');
      fetchSupervisorBoard();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create worker account.');
    } finally {
      setLoading(false);
    }
  };

  const deptComplaints = user?.departmentId
    ? complaints.filter(c => c.departmentId === user.departmentId)
    : complaints;

  return (
    <Layout>
      {/* Live Metrics Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        
        {/* Unassigned */}
        <div className="glass-panel p-6 rounded-2xl border dark:border-slate-800 flex justify-between items-center shadow bg-gradient-to-br from-brand-500/10 to-brand-500/5">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Unassigned</span>
            <span className="text-3xl font-black text-brand-500 mt-1 block">
              {deptComplaints.filter(c => c.status === 'raised').length}
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
              {deptComplaints.filter(c => c.status === 'assigned' || c.status === 'worker_assigned').length}
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
              {deptComplaints.filter(c => c.status === 'worker_reached' || c.status === 'work_started' || c.status === 'citizen_rejected').length}
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
              {deptComplaints.filter(c => c.status === 'completed' || c.status === 'citizen_verified' || c.status === 'closed').length}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Audit Tasks Pending Verification */}
        <div className="space-y-6">
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-5 h-5 text-emerald-500" />
              <span>Verify Completed Works</span>
            </h2>

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900/30 rounded-xl text-emerald-400 text-xs font-semibold">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-900/30 rounded-xl text-red-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {pendingVerifications.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-12">No pending verifications in your department queue.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {pendingVerifications.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => { setSelectedAudit(item); setAiReport(null); }}
                    className="p-4 rounded-xl border dark:border-slate-800 border-slate-200 bg-white/40 dark:bg-darkbg-800/20 hover:scale-[1.01] transition shadow-sm cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      {item.status === 'citizen_rejected' ? (
                        <span className="font-extrabold text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Rejected by {item.citizen?.name || `Citizen ID: ${item.citizenId.substring(0, 8)}`}
                        </span>
                      ) : (
                        <span className="font-extrabold text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Ready for review
                        </span>
                      )}
                      <h4 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-200 mt-2">
                        {t[lang]?.categories?.[item.category] || item.category}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium truncate max-w-[280px] mt-1">{item.description}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[280px]">{item.address}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Dispatch center */}
        <div className="space-y-6">
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-brand-500" />
              <span>Dispatcher & Routing Center</span>
            </h2>

            {unassignedComplaints.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-12">No unassigned complaints available.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {unassignedComplaints.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedDispatch(item)}
                    className="p-4 rounded-xl border dark:border-slate-800 border-slate-200 bg-white/40 dark:bg-darkbg-800/20 hover:scale-[1.01] transition shadow-sm cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase ${
                          item.priority === 'critical' ? 'bg-red-500 animate-pulse' : item.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>{item.priority}</span>
                        {item.isFake && (
                          <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse uppercase tracking-wider">
                            ⚠️ Flagged: Dummy Image
                          </span>
                        )}
                        {(item.Assignments?.[0]?.isAutoAssigned || item.assignments?.[0]?.isAutoAssigned) && (
                          <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse uppercase tracking-wider">
                            ⚡ Auto Assigned
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-200 mt-2">
                        {t[lang]?.categories?.[item.category] || item.category}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium truncate max-w-[280px] mt-1">{item.description}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[280px]">{item.address}</p>
                    </div>
                    {item.status === 'assigned' ? (
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                          Assigned
                        </span>
                        <span className="text-[8px] text-slate-400 capitalize mt-0.5">
                          {item.Assignments?.[0]?.worker?.User?.name || item.assignments?.[0]?.worker?.User?.name || 'Worker'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-brand-500 flex items-center gap-1 uppercase tracking-wider">
                        Dispatch <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Field Worker Form */}
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800 mt-6">
            <h2 className="text-base font-bold flex items-center gap-2 mb-4 text-slate-300">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              <span>Create Field Worker</span>
            </h2>

            <form onSubmit={handleAddWorker} className="space-y-3.5">
              <div>
                <input 
                  type="text" 
                  value={workerName}
                  onChange={e => setWorkerName(e.target.value)}
                  required
                  placeholder="Full Name" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <input 
                  type="email" 
                  value={workerEmail}
                  onChange={e => setWorkerEmail(e.target.value)}
                  required
                  placeholder="Email Address" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <input 
                  type="password" 
                  value={workerPassword}
                  onChange={e => setWorkerPassword(e.target.value)}
                  required
                  placeholder="Password" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <input 
                  type="text" 
                  value={workerPhone}
                  onChange={e => setWorkerPhone(e.target.value)}
                  required
                  placeholder="Phone Number" 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                />
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
        </div>

      </div>

      {/* Department Grievance Registry */}
      <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800 mt-8 text-slate-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-500" /> Department Grievance Registry
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-darkbg-800 font-extrabold text-slate-400 uppercase">
            {deptComplaints.length} Total
          </span>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {deptComplaints.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6">No complaints filed in your department yet.</p>
          ) : (
            deptComplaints.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedComplaint(c)}
                className="p-3.5 border dark:border-slate-800/60 border-slate-200 rounded-xl text-xs bg-slate-50 dark:bg-darkbg-800/10 hover:scale-[1.01] transition shadow-sm cursor-pointer flex justify-between items-start"
              >
                <div className="space-y-1 max-w-[70%] text-left">
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
                  <img src={`${BASE_URL}${selectedComplaint.imageUrlBefore}`} className="w-full h-40 object-cover rounded-xl border dark:border-slate-800" />
                ) : (
                  <div className="w-full h-40 bg-slate-100 dark:bg-darkbg-800 rounded-xl flex items-center justify-center text-slate-400 text-xs">No Photo</div>
                )}
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Repair After Photo</span>
                {selectedComplaint.imageUrlAfter ? (
                  <img src={`${BASE_URL}${selectedComplaint.imageUrlAfter}`} className="w-full h-40 object-cover rounded-xl border dark:border-slate-800" />
                ) : (
                  <div className="w-full h-40 bg-slate-100 dark:bg-darkbg-800 rounded-xl flex items-center justify-center text-slate-400 text-xs">Awaiting Repair</div>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6 bg-slate-50 dark:bg-darkbg-800/40 p-4 rounded-xl border dark:border-slate-800 text-xs text-left">
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400">Description</h4>
                <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{translatedDesc || selectedComplaint.description}</p>
              </div>
              {selectedComplaint.aiDescription && (
                <div className="border-t dark:border-slate-800/60 pt-3">
                  <h4 className="font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                    <span>✨ AI Detailed Report</span>
                  </h4>
                  <p className="text-slate-300 mt-1 leading-relaxed font-mono text-[11px] whitespace-pre-line">{selectedComplaint.aiDescription}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-400">Reporter Details</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-semibold">{selectedComplaint.citizen?.name || 'Anonymous'}</p>
                  <p className="text-[10px] text-slate-500">{selectedComplaint.citizen?.phone || 'No phone'}</p>
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

            <div className="border-t dark:border-slate-800 pt-4 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Incident Timeline</h4>
              <Timeline currentStatus={selectedComplaint.status} />
            </div>

          </div>
        </div>
      )}

      {/* Verification Inspection Modal popups */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 border dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => { setSelectedAudit(null); setAiReport(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 font-extrabold text-lg"
            >
              ✕
            </button>

            <h3 className="font-extrabold text-base uppercase text-brand-500 border-b dark:border-slate-800 pb-3 mb-4">
              Repair quality inspection audit
            </h3>

            <div className="p-3.5 bg-slate-50 dark:bg-darkbg-800/40 border dark:border-slate-800 rounded-xl text-xs space-y-1 mb-4">
              <div className="font-bold text-slate-400 uppercase text-[9px] mb-1">Grievance Info</div>
              <div>Category: <span className="font-bold">{t[lang]?.categories?.[selectedAudit.category] || selectedAudit.category}</span></div>
              <div>Address: <span className="font-semibold text-slate-500">{selectedAudit.address}</span></div>
              <div>Description: <span className="font-semibold text-slate-300">{translatedDesc || selectedAudit.description}</span></div>
              {selectedAudit.aiDescription && (
                <div className="mt-2 pt-2 border-t dark:border-slate-800/60">
                  <div className="font-bold text-indigo-400 uppercase text-[9px] flex items-center gap-1 mb-1">
                    <span>✨ AI Detailed Report</span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed font-mono text-[10px]">{selectedAudit.aiDescription}</p>
                </div>
              )}
            </div>

            {/* Before/After side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border dark:border-slate-800 rounded-2xl p-2.5 bg-slate-900">
                <span className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Before: Issue reported</span>
                {selectedAudit.imageUrlBefore ? (
                  <img src={`${BASE_URL}${selectedAudit.imageUrlBefore}`} className="w-full h-48 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-48 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs">No Photo</div>
                )}
              </div>

              <div className="border dark:border-slate-800 rounded-2xl p-2.5 bg-slate-900">
                <span className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">After: Work completed</span>
                {selectedAudit.imageUrlAfter ? (
                  <img src={`${BASE_URL}${selectedAudit.imageUrlAfter}`} className="w-full h-48 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-48 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs">No Photo</div>
                )}
              </div>
            </div>

            {/* Timeline Progress */}
            <div className="mt-4 mb-6 border-t dark:border-slate-800 pt-4">
              <span className="block text-[10px] font-extrabold uppercase text-slate-400 mb-2">Workflow Progress Timeline</span>
              <Timeline currentStatus={selectedAudit.status} />
            </div>

            {/* AI Diagnostics report panel */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">AI Repair validation</span>
                <button 
                  onClick={handleAIInspectionCheck}
                  disabled={aiLoading}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white font-extrabold rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-white" />
                  <span>{aiLoading ? 'Inspecting...' : 'Run AI Quality Assessment'}</span>
                </button>
              </div>

              {aiReport && (
                <div className={`p-4 rounded-2xl border ${
                  aiReport.repairApproved 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                } text-xs space-y-2`}>
                  <div className="flex justify-between items-center font-bold">
                    <span className="flex items-center gap-1">
                      {aiReport.repairApproved ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                      {aiReport.repairApproved ? 'Repair Resolution Matches original area' : 'AI detected incomplete resolution'}
                    </span>
                    <span className="text-[10px] uppercase px-2 py-0.5 bg-slate-900 border dark:border-slate-800 rounded">
                      Confidence: {(aiReport.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed italic">{translatedFeedback || aiReport.feedback}</p>
                </div>
              )}
            </div>

            {/* Decision Forms */}
            <form onSubmit={handleAuditDecision} className="border-t dark:border-slate-800 pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Verification decision</label>
                <select 
                  value={decision} 
                  onChange={e => setDecision(e.target.value)}
                  className="w-full px-3 py-2.5 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none"
                >
                  <option value="">Choose verification decision...</option>
                  <option value="approve">Approve resolution & Notify Citizen</option>
                  <option value="send_back">Send back to worker (Re-work needed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Feedback review remarks</label>
                <textarea 
                  rows="3" 
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Explain comments for approval or send-back instructions..." 
                  className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl shadow text-xs uppercase tracking-wider transition"
              >
                Log Verification Review Audit
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Dispatch Modal Popups */}
      {selectedDispatch && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 border dark:border-slate-800 shadow-2xl relative">
            
            <button 
              onClick={() => { setSelectedDispatch(null); setSelectedWorkerId(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 font-extrabold text-lg"
            >
              ✕
            </button>

            <h3 className="font-extrabold text-base uppercase text-brand-500 border-b dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Dispatch Field Worker
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-darkbg-800/40 border dark:border-slate-800 rounded-xl text-xs space-y-1 mb-4">
              <div className="font-bold text-slate-400 uppercase text-[9px] mb-1">Grievance Info</div>
              <div>Category: <span className="font-bold">{t[lang]?.categories?.[selectedDispatch.category] || selectedDispatch.category}</span></div>
              <div>Address: <span className="font-semibold text-slate-500">{selectedDispatch.address}</span></div>
              <div>Priority: <span className="font-bold text-orange-500 uppercase">{selectedDispatch.priority}</span></div>
              <div>Description: <span className="font-semibold text-slate-300">{translatedDesc || selectedDispatch.description}</span></div>
              {selectedDispatch.aiDescription && (
                <div className="mt-2 pt-2 border-t dark:border-slate-800/60">
                  <div className="font-bold text-indigo-400 uppercase text-[9px] flex items-center gap-1 mb-1">
                    <span>✨ AI Detailed Report</span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed font-mono text-[10px]">{selectedDispatch.aiDescription}</p>
                </div>
              )}
            </div>

            {/* Timeline Progress */}
            <div className="mb-4 border-t dark:border-slate-800 pt-3">
              <span className="block text-[10px] font-extrabold uppercase text-slate-400 mb-2">Workflow Progress Timeline</span>
              <Timeline currentStatus={selectedDispatch.status} />
            </div>

            {selectedDispatch.status === 'assigned' || selectedDispatch.status === 'worker_assigned' ? (
              <div className="p-4 bg-brand-500/10 border border-brand-500/20 text-brand-500 rounded-xl text-xs space-y-2 mb-4">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                  <span>⚡ Auto Dispatch Active</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  This municipal task has been automatically matched and assigned to worker:{' '}
                  <strong className="text-brand-400">
                    {selectedDispatch.Assignments?.[0]?.worker?.User?.name || selectedDispatch.assignments?.[0]?.worker?.User?.name || 'Municipal crew member'}
                  </strong>.
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  Crew re-assignment is blocked because auto-dispatch has resolved this grievance.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDispatchSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Crew</label>
                  <select 
                    value={selectedWorkerId}
                    onChange={e => setSelectedWorkerId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none"
                  >
                    <option value="">Select available crew member...</option>
                    {availableWorkers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.User?.name} ({w.Department?.name}) - {w.status}
                      </option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl shadow text-xs uppercase tracking-wider transition"
                >
                  Dispatch Job Crew
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </Layout>
  );
};

export default SupervisorDashboard;
