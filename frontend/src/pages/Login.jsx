import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, Shield, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';

const Login = () => {
  const { login, signup, requestOTP, verifyOTP, googleOAuthLogin, user, getDashboardRedirect } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('email'); // 'email', 'otp', 'google'
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [role, setRole] = useState('citizen'); // default signup role
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(getDashboardRedirect(user.role));
    }
  }, [user]);

  const handleError = (err) => {
    setErrorMsg(err.message || 'An error occurred. Please try again.');
    setSuccessMsg('');
    setLoading(false);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !name)) {
      setErrorMsg('Please populate all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      setErrorMsg('');
      if (isRegister) {
        await signup({ name, email, password, role, phone });
        setSuccessMsg('Account registered successfully! Redirecting...');
      } else {
        await login(email, password);
        setSuccessMsg('Login successful! Redirecting...');
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleOTPRequest = async (e) => {
    e.preventDefault();
    if (!phone) {
      setErrorMsg('Please input a valid phone number.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const msg = await requestOTP(phone);
      setOtpSent(true);
      setSuccessMsg(msg);
      setLoading(false);
    } catch (err) {
      handleError(err);
    }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    if (!phone || !otp) {
      setErrorMsg('Please input the verification code.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await verifyOTP(phone, otp);
      setSuccessMsg('OTP Verified! Logging in...');
    } catch (err) {
      handleError(err);
    }
  };

  const handleMockGoogleLogin = async (roleSelection) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const mockProfile = {
        email: `${roleSelection}_demo@civicai.org`,
        name: `Demo ${roleSelection.toUpperCase()}`,
        googleId: `g-${Math.random().toString(36).substr(2, 9)}`
      };
      
      // For demo, we promote the google login user role
      const loggedUser = await googleOAuthLogin(mockProfile);
      
      // If we selected worker/supervisor, we need to promote it on backend
      // But standard mock google signs in as citizen. To allow testing, we can
      // route them to the mock setup directly
      setSuccessMsg(`OAuth success. Authenticated as Citizen!`);
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-darkbg-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Glowing background circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Main Login Card container */}
      <div className="max-w-md w-full glass-panel shadow-2xl rounded-3xl p-8 border border-white/5 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-to-tr from-brand-600 to-brand-500 text-white font-black text-2xl p-4 rounded-2xl shadow-lg shadow-brand-500/20 mb-3 tracking-wider">
            CAI
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Welcome to CivicAI</h2>
          <p className="text-sm text-slate-400 mt-1.5">See it. Report it. Track it. Verify it.</p>
        </div>

        {/* Tab switches */}
        <div className="flex bg-darkbg-800 p-1.5 rounded-2xl mb-6 border border-white/5">
          <button 
            onClick={() => { setActiveTab('email'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'email' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Email Access
          </button>
          <button 
            onClick={() => { setActiveTab('otp'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'otp' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mobile OTP
          </button>
          <button 
            onClick={() => { setActiveTab('google'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'google' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Oauth
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-900/30 rounded-xl text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900/30 rounded-xl text-emerald-400 text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {/* EMAIL LOGIN / REGISTER PANEL */}
        {activeTab === 'email' && (
          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            {isRegister && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Enter your name" 
                    className="w-full pl-10 pr-4 py-2.5 bg-darkbg-800 border border-white/5 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500" 
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com" 
                  className="w-full pl-10 pr-4 py-2.5 bg-darkbg-800 border border-white/5 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500" 
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-10 py-2.5 bg-darkbg-800 border border-white/5 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500" 
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Role Type</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-darkbg-800 border border-white/5 rounded-xl text-slate-200 text-sm focus:outline-none"
                  >
                    <option value="citizen">Citizen</option>
                    <option value="worker">Field Worker</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone (Optional)</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    placeholder="10 digit number" 
                    className="w-full px-3 py-2.5 bg-darkbg-800 border border-white/5 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500" 
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-extrabold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition duration-300 transform active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center mt-4">
              <span className="text-xs text-slate-400">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  type="button" 
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-brand-500 hover:underline font-bold"
                >
                  {isRegister ? 'Sign In' : 'Sign Up'}
                </button>
              </span>
            </div>
          </form>
        )}

        {/* SMS OTP LOGIN PANEL */}
        {activeTab === 'otp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleOTPRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      required
                      placeholder="e.g. +91 9999999999" 
                      className="w-full pl-10 pr-4 py-2.5 bg-darkbg-800 border border-white/5 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500" 
                    />
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition transform active:scale-95 disabled:opacity-50"
                >
                  <span>{loading ? 'Sending...' : 'Request OTP Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleOTPVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Enter 6-Digit Code</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      maxLength="6"
                      value={otp} 
                      onChange={e => setOtp(e.target.value)}
                      required
                      placeholder="******" 
                      className="w-full pl-10 pr-4 py-2.5 bg-darkbg-800 border border-white/5 rounded-xl text-slate-200 text-sm text-center tracking-widest font-black focus:outline-none focus:border-brand-500" 
                    />
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition transform active:scale-95 disabled:opacity-50"
                >
                  <span>{loading ? 'Verifying...' : 'Verify & Log In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    className="text-xs text-brand-500 font-bold hover:underline"
                  >
                    Change phone number
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* GOOGLE OAUTH DEMO SIGN IN PANEL */}
        {activeTab === 'google' && (
          <div className="space-y-5 py-2">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              For evaluation, select a pre-seeded account profile to authenticate via Google simulated OAuth flow:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleMockGoogleLogin('citizen')}
                className="py-3 bg-darkbg-800 border border-white/5 hover:border-brand-500 text-white font-bold text-xs rounded-xl transition flex flex-col items-center gap-1.5 shadow-md"
              >
                <Shield className="w-4 h-4 text-sky-500" />
                <span>Citizen Demo</span>
              </button>
              <button 
                onClick={() => handleMockGoogleLogin('admin')}
                className="py-3 bg-darkbg-800 border border-white/5 hover:border-brand-500 text-white font-bold text-xs rounded-xl transition flex flex-col items-center gap-1.5 shadow-md"
              >
                <Shield className="w-4 h-4 text-red-500" />
                <span>Admin Demo</span>
              </button>
            </div>
            
            <div className="text-center border-t border-white/5 pt-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Pre-seeded Credentials</p>
              <div className="text-[11px] text-slate-400 mt-2 space-y-1">
                <div>Admin: <span className="text-slate-200">admin@civicai.org</span> (Admin@123)</div>
                <div>Supervisor: <span className="text-slate-200">supervisor@civicai.org</span> (Supervisor@123)</div>
                <div>Worker: <span className="text-slate-200">worker@civicai.org</span> (Worker@123)</div>
                <div>Citizen: <span className="text-slate-200">citizen@civicai.org</span> (Citizen@123)</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
