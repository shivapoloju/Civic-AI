import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { ClipboardCheck, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, UserPlus, FileText, Check, AlertOctagon } from 'lucide-react';

const SupervisorDashboard = () => {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [unassignedComplaints, setUnassignedComplaints] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);

  const [selectedAudit, setSelectedAudit] = useState(null);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  
  // AI verification details
  const [aiReport, setAiReport] = useState(null);
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchSupervisorBoard();
  }, []);

  const fetchSupervisorBoard = async () => {
    try {
      setLoading(true);
      
      const [verifs, raised, workers] = await Promise.all([
        axios.get(`${API_URL}/supervisors/pending-verifications`),
        axios.get(`${API_URL}/complaints?status=assigned`), // or raised/unassigned
        axios.get(`${API_URL}/supervisors/available-workers`)
      ]);
      
      // Also fetch raised complaints
      const raisedRes = await axios.get(`${API_URL}/complaints?status=raised`);
      
      setPendingVerifications(verifs.data);
      setUnassignedComplaints([...raisedRes.data, ...raised.data]);
      setAvailableWorkers(workers.data);
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

  return (
    <Layout>
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
                      <h4 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-200 mt-2">{item.category}</h4>
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
                      </div>
                      <h4 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-200 mt-2">{item.category}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[280px]">{item.address}</p>
                    </div>
                    <span className="text-[10px] font-bold text-brand-500 flex items-center gap-1 uppercase tracking-wider">
                      Dispatch <ArrowRight className="w-3.5 h-3.5" />
                    </span>
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

            {/* Before/After side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border dark:border-slate-800 rounded-2xl p-2.5 bg-slate-900">
                <span className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Before: Issue reported</span>
                {selectedAudit.imageUrlBefore ? (
                  <img src={`http://localhost:5000${selectedAudit.imageUrlBefore}`} className="w-full h-48 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-48 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs">No Photo</div>
                )}
              </div>

              <div className="border dark:border-slate-800 rounded-2xl p-2.5 bg-slate-900">
                <span className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">After: Work completed</span>
                {selectedAudit.imageUrlAfter ? (
                  <img src={`http://localhost:5000${selectedAudit.imageUrlAfter}`} className="w-full h-48 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-48 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs">No Photo</div>
                )}
              </div>
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
                  <p className="text-slate-400 leading-relaxed italic">{aiReport.feedback}</p>
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
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border dark:border-slate-800 shadow-2xl relative">
            
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
              <div>Category: <span className="font-bold">{selectedDispatch.category}</span></div>
              <div>Address: <span className="font-semibold text-slate-500">{selectedDispatch.address}</span></div>
              <div>Priority: <span className="font-bold text-orange-500 uppercase">{selectedDispatch.priority}</span></div>
            </div>

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

          </div>
        </div>
      )}
    </Layout>
  );
};

export default SupervisorDashboard;
