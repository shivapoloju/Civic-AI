import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Hammer, CheckCircle, Navigation, MapPin, Play, CheckSquare, Upload, Compass, CloudLightning, WifiOff, RefreshCw, Trash2 } from 'lucide-react';

const t = {
  en: {
    crewControl: "Crew Control",
    offlineMode: "Offline Mode",
    connected: "Connected",
    technician: "Technician:",
    department: "Department:",
    transmitGps: "Transmit GPS Coordinates",
    assignedDispatches: "Assigned Dispatches",
    noDispatches: "No dispatches assigned to your queue.",
    navigationReady: "Navigation Ready",
    taskDetails: "Task Details",
    status: "Status:",
    address: "Address:",
    acceptTask: "Accept Task",
    markReachedSite: "Mark Reached Location",
    addRepairPhoto: "Add Repair Photo",
    markComplete: "Mark Resolution Complete",
    taskResolved: "Task Resolved",
    photoRemediation: "Photo must clearly show hazard remediation",
    uploadRepairProof: "Upload Repair Proof Photo",
    categories: {
      "Potholes": "Potholes",
      "Water leakage": "Water leakage",
      "Street lights": "Street lights",
      "Open manholes": "Open manholes",
      "Drainage": "Drainage",
      "Fallen trees": "Fallen trees",
      "Illegal dumping": "Illegal dumping",
      "Garbage": "Garbage"
    },
    assignmentRef: "Assignment Reference ID:",
    issuePhoto: "Issue Photo",
    reporter: "Reporter:",
    contact: "Contact:",
    mapNavigation: "Map Navigation",
    incidentDesc: "Incident Description",
    statusMap: {
      "assigned": "Assigned",
      "accepted": "Accepted",
      "working": "In Progress",
      "completed": "Completed"
    }
  },
  hi: {
    crewControl: "क्रू नियंत्रण",
    offlineMode: "ऑफलाइन मोड",
    connected: "ऑनलाइन कनेक्टेड",
    technician: "तकनीशियन:",
    department: "विभाग:",
    transmitGps: "जीपीएस स्थान भेजें",
    assignedDispatches: "सौंपे गए कार्य",
    noDispatches: "आपकी कतार में कोई कार्य नहीं सौंपा गया है।",
    navigationReady: "मार्गदर्शन तैयार",
    taskDetails: "कार्य का विवरण",
    status: "स्थिति:",
    address: "पता:",
    acceptTask: "कार्य स्वीकार करें",
    markReachedSite: "स्थान पर पहुंचने की पुष्टि करें",
    addRepairPhoto: "मरम्मत की फोटो जोड़ें",
    markComplete: "समाधान पूर्ण मार्क करें",
    taskResolved: "समस्या हल हो गई है",
    photoRemediation: "फोटो में स्पष्ट रूप से मरम्मत दिखनी चाहिए",
    uploadRepairProof: "मरम्मत की प्रमाण फोटो अपलोड करें",
    categories: {
      "Potholes": "सड़क के गड्ढे",
      "Water leakage": "पानी का रिसाव",
      "Street lights": "स्ट्रीट लाइट",
      "Open manholes": "खुले मैनहोल",
      "Drainage": "जल निकासी",
      "Fallen trees": "गिरे हुए पेड़",
      "Illegal dumping": "अवैध डंपिंग",
      "Garbage": "कचरा"
    },
    assignmentRef: "असाइनमेंट संदर्भ आईडी:",
    issuePhoto: "समस्या की फोटो",
    reporter: "रिपोर्टर:",
    contact: "संपर्क:",
    mapNavigation: "मानचित्र नेविगेशन",
    incidentDesc: "घटना का विवरण",
    statusMap: {
      "assigned": "सौंप दिया गया",
      "accepted": "स्वीकार किया गया",
      "working": "कार्य प्रगति पर है",
      "completed": "पूरा हो गया"
    }
  },
  te: {
    crewControl: "సిబ్బంది నియంత్రణ",
    offlineMode: "ఆఫ్‌లైన్ మోడ్",
    connected: "ఆన్‌లైన్ కనెక్ట్ చేయబడింది",
    technician: "టెక్నీషియన్:",
    department: "విభాగం:",
    transmitGps: "జీపీఎస్ స్థానాన్ని పంపండి",
    assignedDispatches: "కేటాయించిన పనులు",
    noDispatches: "మీ క్యూలో ఎలాంటి పనులు కేటాయించబడలేదు.",
    navigationReady: "మార్గదర్శకం సిద్ధంగా ఉంది",
    taskDetails: "పని వివరాలు",
    status: "స్థితి:",
    address: "చిరునామా:",
    acceptTask: "పనిని అంగీకరించు",
    markReachedSite: "స్థలానికి చేరుకున్నట్లు గుర్తించు",
    addRepairPhoto: "రిపేరు ఫోటోను జోడించండి",
    markComplete: "పని పూర్తయినట్లు గుర్తించు",
    taskResolved: "సమస్య పరిష్కరించబడింది",
    photoRemediation: "ఫోటో రిపేరు చేసినట్లు స్పష్టంగా చూపించాలి",
    uploadRepairProof: "పని పూర్తయిన రుజువు ఫోటోను అప్‌లోడ్ చేయండి",
    categories: {
      "Potholes": "రోడ్డు గుంతలు",
      "Water leakage": "నీటి లీకేజీ",
      "Street lights": "వీధి దీపాలు",
      "Open manholes": "తెరిచిన మ్యాన్‌హోల్స్",
      "Drainage": "డ్రైనేజీ",
      "Fallen trees": "కూలిపోయిన చెట్లు",
      "Illegal dumping": "అక్రమ డంపింగ్",
      "Garbage": "చెత్త"
    },
    assignmentRef: "అసైన్మెంట్ రిఫరెన్స్ ఐడి:",
    issuePhoto: "సమస్య ఫోటో",
    reporter: "రిపోర్టర్:",
    contact: "సంప్రదించండి:",
    mapNavigation: "మ్యాప్ నావిగేషన్",
    incidentDesc: "సమస్య వివరణ",
    statusMap: {
      "assigned": "కేటాయించబడింది",
      "accepted": "అంగీకరించబడింది",
      "working": "పని జరుగుతోంది",
      "completed": "పూర్తయింది"
    }
  }
};

const WorkerDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [translatedDesc, setTranslatedDesc] = useState('');

  // Form states for repair verification
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [afterImagePreview, setAfterImagePreview] = useState(null);

  // Offline status states
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineLogs, setOfflineLogs] = useState(JSON.parse(localStorage.getItem('offline_logs') || '[]'));
  const [lang, setLang] = useState(localStorage.getItem('civic_lang') || 'en');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;
  const BASE_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

  useEffect(() => {
    if (!selectedTask?.Complaint?.description) {
      setTranslatedDesc('');
      return;
    }
    
    if (lang === 'en') {
      setTranslatedDesc(selectedTask.Complaint.description);
      return;
    }

    const translate = async () => {
      try {
        const res = await axios.post(`${API_URL}/complaints/translate`, {
          text: selectedTask.Complaint.description,
          targetLang: lang
        });
        setTranslatedDesc(res.data.translatedText);
      } catch (err) {
        setTranslatedDesc(selectedTask.Complaint.description);
      }
    };

    translate();
  }, [selectedTask, lang]);

  useEffect(() => {
    fetchWorkerTasks();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleLangUpdate = () => {
      setLang(localStorage.getItem('civic_lang') || 'en');
    };
    window.addEventListener('civic_lang_changed', handleLangUpdate);

    // Run mock location update sequence (simulate worker walking to site)
    const gpsInterval = setInterval(updateLiveGPSPosition, 45000); // 45 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('civic_lang_changed', handleLangUpdate);
      clearInterval(gpsInterval);
    };
  }, []);

  const fetchWorkerTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/workers/tasks`);
      setTasks(res.data.assignments);
      setWorkerProfile(res.data.worker);
    } catch (err) {
      console.error('Failed to load worker board:', err);
    } finally {
      setLoading(false);
    }
  };

  // Broadcast current GPS location to server maps
  const updateLiveGPSPosition = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await axios.post(`${API_URL}/workers/location`, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      } catch (err) {
        console.warn('GPS ping failed:', err.message);
      }
    });
  };

  const handleManualGPSTrigger = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation not supported by browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await axios.post(`${API_URL}/workers/location`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            status: 'available'
          });
          setWorkerProfile(res.data.worker);
          setSuccessMsg('Live location coordinate ping sent to maps room.');
        } catch (err) {
          setErrorMsg('Failed to sync location with server.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setErrorMsg('GPS coordinates query failed.');
        setLoading(false);
      }
    );
  };

  // Timeline transition flow triggers
  const handleTaskStatusChange = async (assignmentId, targetStatus) => {
    if (isOffline) {
      // Save logs locally in localStorage
      const newLog = {
        assignmentId,
        status: targetStatus,
        timestamp: new Date().toISOString()
      };
      const updatedLogs = [...offlineLogs, newLog];
      setOfflineLogs(updatedLogs);
      localStorage.setItem('offline_logs', JSON.stringify(updatedLogs));
      setSuccessMsg(`Working Offline: status '${targetStatus}' saved. Sync when online.`);
      
      // Update local task memory state
      setTasks(prev => prev.map(t => {
        if (t.id === assignmentId) {
          return { ...t, status: targetStatus };
        }
        return t;
      }));
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('status', targetStatus);

      if (targetStatus === 'completed') {
        if (!afterImageFile) {
          setErrorMsg('Please upload a validation picture of the completed repair.');
          setLoading(false);
          return;
        }
        formData.append('imageAfter', afterImageFile);
      }

      const res = await axios.post(`${API_URL}/workers/update-task`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg(`Status successfully updated to: ${targetStatus}`);
      setSelectedTask(null);
      setAfterImageFile(null);
      setAfterImagePreview(null);
      fetchWorkerTasks();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update job status.');
    } finally {
      setLoading(false);
    }
  };

  // Reconcile offline operations when back online
  const handleSyncOfflineData = async () => {
    if (offlineLogs.length === 0) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/workers/sync`, { logs: offlineLogs });
      setSuccessMsg(`Synchronized ${res.data.results.length} cached status updates.`);
      setOfflineLogs([]);
      localStorage.removeItem('offline_logs');
      fetchWorkerTasks();
    } catch (err) {
      setErrorMsg('Failed to sync offline logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleAfterImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAfterImageFile(file);
      setAfterImagePreview(URL.createObjectURL(file));
    }
  };

  const getTaskStatusStyles = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'working': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Status / Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t[lang].crewControl}</h2>
              
              {/* Online/Offline Badge indicators */}
              {isOffline ? (
                <span className="flex items-center gap-1 bg-red-950/40 border border-red-900/30 text-red-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                  <WifiOff className="w-3.5 h-3.5" /> {t[lang].offlineMode}
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                  <Compass className="w-3.5 h-3.5 animate-spin" /> {t[lang].connected}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Network synchronization bar */}
              {offlineLogs.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-amber-500">Un-synced reports ({offlineLogs.length})</h4>
                      <p className="text-[9px] text-slate-400">Offline changes cached locally in device memory.</p>
                    </div>
                    <button 
                      onClick={handleSyncOfflineData}
                      disabled={isOffline || loading}
                      className="p-2 bg-amber-500 text-white rounded-xl hover:scale-105 transition disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-50 dark:bg-darkbg-800/40 border dark:border-slate-800 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t[lang].technician}</span>
                  <span className="font-bold">{workerProfile ? (lang === 'te' ? 'యాక్టివ్ ప్రొఫైల్' : lang === 'hi' ? 'सक्रिय प्रोफाइल' : 'Active Profile') : (lang === 'te' ? 'వెతుకుతోంది...' : lang === 'hi' ? 'खोज रहे हैं...' : 'Searching...')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t[lang].department}</span>
                  <span className="font-bold text-brand-500">{workerProfile?.department?.name || 'Roads & Sanitation'}</span>
                </div>
                {workerProfile && (
                  <div className="flex justify-between text-[10px] text-slate-400 pt-2 border-t dark:border-slate-800">
                    <span>GPS: {workerProfile.lat?.toFixed(5) || 'n/a'}</span>
                    <span>Lng: {workerProfile.lng?.toFixed(5) || 'n/a'}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={handleManualGPSTrigger}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-extrabold rounded-xl shadow flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition"
              >
                <MapPin className="w-4 h-4" />
                <span>{t[lang].transmitGps}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Task Board lists */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Hammer className="w-5 h-5 text-brand-500" />
              <span>{t[lang].assignedDispatches}</span>
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

            {tasks.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-12">{t[lang].noDispatches}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-4 rounded-2xl border dark:border-slate-800 border-slate-200 bg-white/40 dark:bg-darkbg-800/10 hover:scale-[1.01] transition shadow-sm cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-xs uppercase text-brand-500">{task.Complaint?.category}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${getTaskStatusStyles(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-300 font-semibold mb-2">{task.Complaint?.address}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{task.Complaint?.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t[lang].navigationReady}</span>
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Task Details Modal & Verification uploads */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 border dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => {
                setSelectedTask(null);
                setAfterImageFile(null);
                setAfterImagePreview(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 font-extrabold text-lg"
            >
              ✕
            </button>

            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-base uppercase text-brand-500">
                  {t[lang].categories?.[selectedTask.Complaint?.category] || selectedTask.Complaint?.category}
                </h3>
                <p className="text-[10px] text-slate-400">{t[lang].assignmentRef} {selectedTask.id}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${getTaskStatusStyles(selectedTask.status)}`}>
                {t[lang].statusMap?.[selectedTask.status] || selectedTask.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t[lang].issuePhoto}</span>
                {selectedTask.Complaint?.imageUrlBefore ? (
                  <img src={`${BASE_URL}${selectedTask.Complaint.imageUrlBefore}`} className="w-full h-36 object-cover rounded-xl border dark:border-slate-800" />
                ) : (
                  <div className="w-full h-36 bg-slate-100 dark:bg-darkbg-800 rounded-xl flex items-center justify-center text-slate-400 text-xs">No Photo</div>
                )}
              </div>
              <div className="flex flex-col justify-between p-3 bg-slate-50 dark:bg-darkbg-800/40 rounded-xl border dark:border-slate-800 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="font-bold text-slate-400">{t[lang].reporter}</span>
                    <p className="font-semibold">{selectedTask.Complaint?.citizen?.name || 'Citizen'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400">{t[lang].contact}</span>
                    <p className="font-semibold text-slate-500">{selectedTask.Complaint?.citizen?.phone || 'Private'}</p>
                  </div>
                </div>

                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedTask.Complaint?.lat},${selectedTask.Complaint?.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 py-2 bg-slate-200 dark:bg-darkbg-700 hover:scale-[1.01] transition font-bold rounded-lg text-center flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 text-brand-500" /> {t[lang].mapNavigation}
                </a>
              </div>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-darkbg-800/20 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              <span className="font-bold block uppercase text-slate-400 text-[10px] mb-1">{t[lang].incidentDesc}</span>
              {selectedTask.Complaint?.description}
            </div>

            {/* Workflow Control timeline actions */}
            <div className="space-y-3">
              {selectedTask.status === 'assigned' && (
                <button 
                  onClick={() => handleTaskStatusChange(selectedTask.id, 'accepted')}
                  className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-extrabold rounded-xl shadow flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition"
                >
                  <Play className="w-4 h-4 fill-white" /> {t[lang].acceptTask}
                </button>
              )}

              {selectedTask.status === 'accepted' && (
                <button 
                  onClick={() => handleTaskStatusChange(selectedTask.id, 'reached')}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl shadow flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition"
                >
                  <CheckSquare className="w-4 h-4" /> {t[lang].markReachedSite}
                </button>
              )}

              {(selectedTask.status === 'working' || selectedTask.status === 'reached') && (
                <div className="space-y-4 border-t dark:border-slate-800 pt-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t[lang].uploadRepairProof}</label>
                    <div className="border border-dashed dark:border-slate-800 border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden bg-slate-50 dark:bg-darkbg-800/40 min-h-[140px]">
                      {afterImagePreview ? (
                        <>
                          <img src={afterImagePreview} className="absolute inset-0 w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => { setAfterImageFile(null); setAfterImagePreview(null); }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center">
                          <Upload className="w-8 h-8 text-slate-400 mb-1.5" />
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t[lang].addRepairPhoto}</span>
                          <span className="text-[9px] text-slate-400 mt-1">{t[lang].photoRemediation}</span>
                          <input type="file" accept="image/*" onChange={handleAfterImageChange} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleTaskStatusChange(selectedTask.id, 'completed')}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition"
                  >
                    <CheckCircle className="w-4 h-4" /> {t[lang].markComplete}
                  </button>
                </div>
              )}

              {selectedTask.status === 'completed' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center text-xs text-emerald-500 font-bold">
                  ✓ {t[lang].taskResolved}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </Layout>
  );
};

export default WorkerDashboard;
