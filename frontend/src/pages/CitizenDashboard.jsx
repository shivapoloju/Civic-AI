import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import Timeline from '../components/Timeline';
import InteractiveMap from '../components/InteractiveMap';
import { Camera, Mic, Square, Trash2, MapPin, PlusCircle, History, Award, CheckCircle, FileText, Star, Sparkles } from 'lucide-react';

const t = {
  en: {
    reportIssue: "Report Urban Issue",
    addPhoto: "Add Photo",
    addPhotoSub: "Potholes, Garbage etc.",
    voiceRecord: "Voice Record",
    voiceRecordSub: "EN, HI, TE supported",
    incidentLocation: "Incident Location",
    autoGps: "Auto GPS",
    category: "Category",
    chooseCategory: "Choose Category...",
    description: "Description",
    enterDetails: "Enter details of the issue...",
    submitGrievance: "Submit Grievance",
    submitting: "Analyzing & Routing...",
    tracker: "Grievance Tracker",
    fetching: "Fetching records...",
    noGrievances: "You haven't reported any grievances yet.",
    categories: {
      "Potholes": "Pothole",
      "Garbage": "Garbage Accumulation",
      "Water leakage": "Water Leakage",
      "Street lights": "Street Light Failure",
      "Open manholes": "Open Manhole",
      "Drainage": "Drainage Overflow",
      "Fallen trees": "Fallen Tree",
      "Illegal dumping": "Illegal Dumping"
    }
  },
  hi: {
    reportIssue: "शहरी समस्या की रिपोर्ट करें",
    addPhoto: "फोटो जोड़ें",
    addPhotoSub: "सड़क के गड्ढे, कचरा आदि।",
    voiceRecord: "आवाज रिकॉर्ड करें",
    voiceRecordSub: "अंग्रेजी, हिंदी, तेलुगु समर्थित",
    incidentLocation: "घटना का स्थान",
    autoGps: "ऑटो जीपीएस",
    category: "श्रेणी",
    chooseCategory: "श्रेणी चुनें...",
    description: "विवरण",
    enterDetails: "समस्या का विवरण दर्ज करें...",
    submitGrievance: "शिकायत दर्ज करें",
    submitting: "विश्लेषण और प्रेषण...",
    tracker: "शिकायत ट्रैकर",
    fetching: "रिकॉर्ड प्राप्त किए जा रहे हैं...",
    noGrievances: "आपने अभी तक कोई शिकायत दर्ज नहीं की है।",
    categories: {
      "Potholes": "सड़क के गड्ढे",
      "Garbage": "कचरा संचय",
      "Water leakage": "पानी का रिसाव",
      "Street lights": "स्ट्रीट लाइट खराब",
      "Open manholes": "खुला मैनहोल",
      "Drainage": "नाली का पानी बहना",
      "Fallen trees": "गिरे हुए पेड़",
      "Illegal dumping": "अवैध रूप से कचरा फेंकना"
    }
  },
  te: {
    reportIssue: "పట్టణ సమస్యను నివేదించండి",
    addPhoto: "ఫోటోను జోడించండి",
    addPhotoSub: "రోడ్డు గుంతలు, చెత్త మొదలైనవి.",
    voiceRecord: "వాయిస్ రికార్డ్",
    voiceRecordSub: "ఇంగ్లీష్, హిందీ, తెలుగు సపోర్ట్",
    incidentLocation: "సమస్య జరిగిన స్థలం",
    autoGps: "ఆటో జీపీఎస్",
    category: "వర్గం",
    chooseCategory: "వర్గాన్ని ఎంచుకోండి...",
    description: "వివరణ",
    enterDetails: "సమస్య యొక్క వివరాలను నమోదు చేయండి...",
    submitGrievance: "ఫిర్యాదును సమర్పించండి",
    submitting: "విశ్లేషిస్తోంది & రూట్ చేస్తోంది...",
    tracker: "ఫిర్యాదుల ట్రాకర్",
    fetching: "వివరాలను సేకరిస్తోంది...",
    noGrievances: "మీరు ఇంకా ఎలాంటి ఫిర్యాదులను నివేదించలేదు.",
    categories: {
      "Potholes": "రోడ్డు గుంతలు",
      "Garbage": "చెత్త కుప్పలు",
      "Water leakage": "నీటి లీకేజీ",
      "Street lights": "వీధి దీపాల వైఫల్యం",
      "Open manholes": "తెరిచిన మ్యాన్‌హోల్స్",
      "Drainage": "డ్రైనేజీ సమస్యలు",
      "Fallen trees": "కూలిపోయిన చెట్లు",
      "Illegal dumping": "అక్రమ చెత్త వేయడం"
    }
  }
};

const CitizenDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // Reporting Form States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [lang, setLang] = useState(localStorage.getItem('civic_lang') || 'en');
  
  // Voice Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voicePreview, setVoicePreview] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Citizen Rating states
  const [score, setScore] = useState(5);
  const [review, setReview] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Live Camera & Image Analysis states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedIssue, setDetectedIssue] = useState(null);
  const videoRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchCitizenComplaints();
  }, []);

  const fetchCitizenComplaints = async () => {
    try {
      setFetching(true);
      const res = await axios.get(`${API_URL}/complaints`);
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  // Open live camera stream
  const startCamera = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      setErrorMsg('Failed to open camera. Please grant permission or upload instead.');
    }
  };

  // Capture snapshot frame
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "live_capture.jpg", { type: "image/jpeg" });
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        stopCamera();
        runImageAnalysis(file);
      }
    }, 'image/jpeg');
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // AI Classification engine client fetcher
  const runImageAnalysis = async (file) => {
    try {
      setLoading(true);
      setErrorMsg('');
      setDetectedIssue(null);
      
      const formData = new FormData();
      formData.append('image', file, file.name);

      const res = await axios.post(`${API_URL}/complaints/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const analysis = res.data;
      if (analysis) {
        setDetectedIssue({
          category: analysis.category || 'Garbage',
          confidence: analysis.confidenceScore || 0.95,
          description: analysis.description || 'AI analyzed image.'
        });
        if (analysis.category) {
          setCategory(analysis.category);
        }
        if (analysis.description) {
          setDescription(analysis.description);
        }
      }
    } catch (err) {
      console.warn('AI analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Capture user's exact current location coordinates
  const handleGPSAutoCapture = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));
        setErrorMsg('');
        
        // Reverse Geocoding via OpenStreetMap Nominatim API (Free)
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          setAddress(res.data.display_name || `Lat: ${latitude}, Lng: ${longitude}`);
        } catch {
          setAddress(`Lat: ${latitude}, Lng: ${longitude}`);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setErrorMsg('Failed to fetch location. Please pick manually on the map.');
        setLoading(false);
      }
    );
  };

  // Handle map selection coordinates
  const handleMapPinSelected = async (clickedLat, clickedLng) => {
    setLat(clickedLat.toFixed(6));
    setLng(clickedLng.toFixed(6));
    
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickedLat}&lon=${clickedLng}`);
      setAddress(res.data.display_name || `Selected Coordinates`);
    } catch {
      setAddress(`Lat: ${clickedLat}, Lng: ${clickedLng}`);
    }
  };

  // Image upload handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      runImageAnalysis(file);
    }
  };

  // Voice recording routines
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setVoiceBlob(audioBlob);
        setVoicePreview(URL.createObjectURL(audioBlob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // stop stream tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Submit Complaint Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!lat || !lng) {
      setErrorMsg('Please select a location on the map or tap Auto GPS.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const formData = new FormData();
      formData.append('lat', lat);
      formData.append('lng', lng);
      formData.append('address', address);
      if (category) formData.append('category', category);
      if (description) formData.append('description', description);

      if (imageFile) {
        formData.append('image', imageFile, imageFile.name);
      }
      if (voiceBlob) {
        formData.append('voice', voiceBlob, 'voice.wav');
      }

      await axios.post(`${API_URL}/complaints`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg('Complaint registered. Our AI engine has classified and routed your report.');
      
      // Reset form
      setImageFile(null);
      setImagePreview(null);
      setVoiceBlob(null);
      setVoicePreview(null);
      setLat('');
      setLng('');
      setAddress('');
      setCategory('');
      setDescription('');
      setDetectedIssue(null);
      
      fetchCitizenComplaints();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to file complaint.');
    } finally {
      setLoading(false);
    }
  };

  // Finalize Verification Rating or Rejection
  const handleRatingSubmit = async (e, rejected = false) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await axios.post(`${API_URL}/complaints/rate`, {
        complaintId: selectedComplaint.id,
        score: rejected ? 1 : score,
        review: review || (rejected ? 'Rejected by citizen.' : 'Verified by citizen.'),
        rejected
      });
      
      if (rejected) {
        setSuccessMsg(lang === 'te' ? 'పని తిరస్కరించబడింది. సమీక్ష కోసం సూపర్‌వైజర్‌కు పంపబడింది.' : lang === 'hi' ? 'काम खारिज कर दिया गया। समीक्षा के लिए सुपरवाइजर को भेजा गया।' : 'Work resolution rejected. Sent to supervisor for investigation review.');
      } else {
        setSuccessMsg(lang === 'te' ? 'పని ధృవీకరించబడింది! ధన్యవాదాలు.' : lang === 'hi' ? 'काम सत्यापित हो गया! धन्यवाद।' : 'Thank you for verifying the work! Civic Points added.');
      }
      
      setSelectedComplaint(null);
      fetchCitizenComplaints();
      if (!rejected) {
        window.location.reload();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Language Selector */}
      <div className="flex justify-end gap-2 mb-6">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">Language / భాష / भाषा:</label>
        <select 
          value={lang} 
          onChange={e => {
            const l = e.target.value;
            setLang(l);
            localStorage.setItem('civic_lang', l);
          }} 
          className="px-3 py-1 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-slate-300 text-xs font-bold focus:outline-none"
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="te">తెలుగు (Telugu)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Reporting Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-brand-500" />
              <span>{t[lang].reportIssue}</span>
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

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Media Uploads Grid */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* Photo Upload / Capture area */}
                <div className="border border-dashed dark:border-slate-800 border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden bg-slate-50 dark:bg-darkbg-800/40 min-h-[120px]">
                  {isCameraActive ? (
                    <div className="absolute inset-0 w-full h-full bg-black flex flex-col items-center justify-center">
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                      <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1.5">
                        <button 
                          type="button" 
                          onClick={captureSnapshot}
                          className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-extrabold uppercase rounded shadow"
                        >
                          Capture
                        </button>
                        <button 
                          type="button" 
                          onClick={stopCamera}
                          className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-extrabold uppercase rounded shadow"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : imagePreview ? (
                    <>
                      <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => { setImageFile(null); setImagePreview(null); setDetectedIssue(null); }}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full hover:scale-105 shadow z-10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <label className="cursor-pointer flex flex-col items-center">
                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t[lang].addPhoto}</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">{t[lang].addPhotoSub}</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                      <button 
                        type="button"
                        onClick={startCamera}
                        className="mt-1.5 px-2 py-0.5 bg-brand-500 hover:bg-brand-600 text-white text-[8px] font-extrabold uppercase rounded shadow transition"
                      >
                        Live Camera
                      </button>
                    </div>
                  )}
                </div>

                {/* Voice Upload area */}
                <div className="border border-dashed dark:border-slate-800 border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center text-center relative bg-slate-50 dark:bg-darkbg-800/40 min-h-[120px]">
                  {voicePreview ? (
                    <div className="flex flex-col items-center w-full">
                      <audio src={voicePreview} controls className="w-full h-8 scale-90" />
                      <button 
                        type="button" 
                        onClick={() => { setVoiceBlob(null); setVoicePreview(null); }}
                        className="mt-2 flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase tracking-wider"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      {isRecording ? (
                        <button 
                          type="button" 
                          onClick={stopRecording}
                          className="p-3 bg-red-500 text-white rounded-full animate-pulse shadow-md"
                        >
                          <Square className="w-4 h-4 fill-white" />
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          onClick={startRecording}
                          className="p-3 bg-brand-500 text-white rounded-full hover:scale-105 shadow-md"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-2">
                        {isRecording ? (lang === 'te' ? 'రికార్డ్ అవుతోంది...' : lang === 'hi' ? 'रिकॉर्डिंग...' : 'Recording...') : t[lang].voiceRecord}
                      </span>
                      <span className="text-[8px] text-slate-400 mt-0.5">{t[lang].voiceRecordSub}</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Coordinates picking */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{t[lang].incidentLocation}</label>
                <div className="flex gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Latitude" 
                      value={lat} 
                      readOnly 
                      className="px-3 py-2 bg-darkbg-800/50 border dark:border-slate-800 rounded-xl text-xs text-slate-300"
                    />
                    <input 
                      type="text" 
                      placeholder="Longitude" 
                      value={lng} 
                      readOnly 
                      className="px-3 py-2 bg-darkbg-800/50 border dark:border-slate-800 rounded-xl text-xs text-slate-300"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleGPSAutoCapture}
                    className="px-3 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-brand-600 transition"
                  >
                    <MapPin className="w-3.5 h-3.5" /> {t[lang].autoGps}
                  </button>
                </div>
                {address && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">Address: {address}</p>
                )}
              </div>

              {/* AI Detection results notification */}
              {detectedIssue && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-start gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 animate-spin" />
                  <div className="text-xs">
                    <span className="font-extrabold text-purple-400 block uppercase tracking-wider text-[9px]">
                      AI Auto-Detection Diagnostics
                    </span>
                    <p className="text-slate-300 mt-1">
                      Identified Hazard: <span className="font-extrabold text-white text-sm capitalize">{t[lang].categories[detectedIssue.category] || detectedIssue.category}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Confidence: {(detectedIssue.confidence * 100).toFixed(0)}% • Category dropdown populated.
                    </p>
                  </div>
                </div>
              )}

              {/* Manual category override */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{t[lang].category}</label>
                <select 
                  value={category} 
                  required
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-darkbg-800/40 border dark:border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none"
                >
                  <option value="">{t[lang].chooseCategory}</option>
                  <option value="Potholes">{t[lang].categories["Potholes"]}</option>
                  <option value="Garbage">{t[lang].categories["Garbage"]}</option>
                  <option value="Water leakage">{t[lang].categories["Water leakage"]}</option>
                  <option value="Street lights">{t[lang].categories["Street lights"]}</option>
                  <option value="Open manholes">{t[lang].categories["Open manholes"]}</option>
                  <option value="Drainage">{t[lang].categories["Drainage"]}</option>
                  <option value="Fallen trees">{t[lang].categories["Fallen trees"]}</option>
                  <option value="Illegal dumping">{t[lang].categories["Illegal dumping"]}</option>
                </select>
              </div>

              {/* Text Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{t[lang].description}</label>
                <textarea 
                  rows="3" 
                  value={description} 
                  required
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t[lang].enterDetails} 
                  className="w-full px-3 py-2 bg-darkbg-800/40 border dark:border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-extrabold rounded-xl shadow flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition transform active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? t[lang].submitting : t[lang].submitGrievance}</span>
              </button>

            </form>
          </div>
        </div>

        {/* Right column: Interactive map & active complaint tracker */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Map display */}
          <div className="glass-panel shadow-md rounded-2xl p-4 border dark:border-slate-800 h-[320px]">
            <InteractiveMap 
              complaints={complaints}
              onMapClick={handleMapPinSelected}
              selectedCoord={lat && lng ? { lat: Number(lat), lng: Number(lng) } : null}
              onComplaintSelect={(c) => setSelectedComplaint(c)}
            />
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              * Tap anywhere on the map to set report coordinates. Red pins indicates critical alerts.
            </p>
          </div>

          {/* User History tracker lists */}
          <div className="glass-panel shadow-md rounded-2xl p-6 border dark:border-slate-800">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-emerald-500" />
              <span>{t[lang].tracker}</span>
            </h2>

            {fetching ? (
              <p className="text-slate-400 text-xs text-center py-8">{t[lang].fetching}</p>
            ) : complaints.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">{t[lang].noGrievances}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
                {complaints.map((c) => (
                  <div 
                    key={c.id || c._id} 
                    onClick={() => setSelectedComplaint(c)}
                    className="p-3.5 rounded-xl border dark:border-slate-800 border-slate-200 bg-white/40 dark:bg-darkbg-800/20 hover:scale-[1.01] transition shadow-sm cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400">{c.category}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase ${
                        c.priority === 'critical' ? 'bg-red-500 animate-pulse' : c.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>{c.priority}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">{c.address}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t dark:border-slate-800 pt-2">
                      <span>Status: <span className="font-bold capitalize text-slate-600 dark:text-slate-300">{c.status.replace('_', ' ')}</span></span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Detail Tracking Modal popups */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setSelectedComplaint(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 font-extrabold text-lg"
            >
              ✕
            </button>

            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-base uppercase tracking-wider text-brand-500">{selectedComplaint.category}</h3>
                <p className="text-[10px] text-slate-400">ID: {selectedComplaint.id}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold text-white uppercase ${
                selectedComplaint.priority === 'critical' ? 'bg-red-500' : selectedComplaint.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
              }`}>{selectedComplaint.priority}</span>
            </div>

            {/* Media details layout */}
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

            <div className="space-y-3 mb-6 bg-slate-50 dark:bg-darkbg-800/40 p-4 rounded-xl border dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{selectedComplaint.description}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Address</h4>
                <p className="text-xs text-slate-500 mt-1">{selectedComplaint.address}</p>
              </div>
            </div>

            {/* Timeline Progress */}
            <div className="border-t dark:border-slate-800 pt-4 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Incident Timeline</h4>
              <Timeline currentStatus={selectedComplaint.status} />
            </div>

            {/* Rating Forms (Only when completed) */}
            {selectedComplaint.status === 'completed' && (
              <form onSubmit={handleRatingSubmit} className="border-t dark:border-slate-800 pt-4 space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-500">Repair verification available</h5>
                    <p className="text-[10px] text-slate-400">The field crew completed work. Please verify and rate the repair work. Your rating will be sent to the supervisor for final approval.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-400">Score Resolution:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button 
                        key={val}
                        type="button" 
                        onClick={() => setScore(val)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star className={`w-5 h-5 ${val <= score ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <textarea 
                    rows="2" 
                    value={review}
                    onChange={e => setReview(e.target.value)}
                    placeholder="Provide optional review comments..." 
                    className="w-full px-3 py-2 bg-darkbg-800 border dark:border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow text-xs uppercase tracking-wider transition"
                  >
                    {lang === 'te' ? 'రిపేరు ధృవీకరించు' : lang === 'hi' ? 'मरम्मत सत्यापित करें' : 'Verify & Close'}
                  </button>
                  <button 
                    type="button"
                    disabled={loading}
                    onClick={(e) => handleRatingSubmit(e, true)}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl shadow text-xs uppercase tracking-wider transition"
                  >
                    {lang === 'te' ? 'పనిని తిరస్కరించు' : lang === 'hi' ? 'कार्य अस्वीकार करें' : 'Reject Repair'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </Layout>
  );
};

export default CitizenDashboard;
