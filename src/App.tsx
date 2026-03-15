import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Cloud, 
  CloudOff, 
  CloudAlert, 
  Camera, 
  Bluetooth, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft,
  ChevronRight,
  Phone,
  Hospital,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, Patient, TestRecord, TestType, SyncStatus } from './types';

// --- Mock Data & Helpers ---
const STORAGE_KEY = 'chp_test_records';

const saveRecord = (record: TestRecord) => {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...existing]));
};

const getRecords = (): TestRecord[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

// --- Components ---

const SyncIndicator = ({ status, pendingCount }: { status: SyncStatus, pendingCount: number }) => {
  const config = {
    synced: { icon: Cloud, color: 'text-success-green', label: 'Synced' },
    pending: { icon: CloudAlert, color: 'text-yellow-500', label: `Pending (${pendingCount})` },
    offline: { icon: CloudOff, color: 'text-alert-red', label: 'Offline' }
  };
  const { icon: Icon, color, label } = config[status];
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm border border-gray-100 ${color}`}>
      <Icon size={18} />
      <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<AppState>('dashboard');
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Current Session State
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestType | null>(null);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [testResult, setTestResult] = useState<'Positive' | 'Negative' | null>(null);

  useEffect(() => {
    setRecords(getRecords());
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const syncStatus: SyncStatus = useMemo(() => {
    if (!isOnline) return 'offline';
    const pending = records.filter(r => !r.synced).length;
    return pending > 0 ? 'pending' : 'synced';
  }, [isOnline, records]);

  const pendingCount = records.filter(r => !r.synced).length;

  const startNewTest = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    setView('patient-entry');
  };

  const handlePatientSubmit = (patient: Patient) => {
    setCurrentPatient(patient);
    setView('diagnostic-hub');
  };

  const handleStartAnalysis = () => {
    setView('analysis');
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTestResult(Math.random() > 0.7 ? 'Positive' : 'Negative');
        setView('result');
      }
      setAnalysisProgress(progress);
    }, 600);
  };

  const handleFinalSubmit = () => {
    if (currentPatient && selectedTest && testResult) {
      const newRecord: TestRecord = {
        id: Math.random().toString(36).substr(2, 9),
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        testType: selectedTest,
        timestamp: Date.now(),
        status: testResult,
        synced: isOnline,
      };
      saveRecord(newRecord);
      setRecords(getRecords());
      
      // Reset
      setCurrentPatient(null);
      setSelectedTest(null);
      setIsDeviceConnected(false);
      setAnalysisProgress(0);
      setTestResult(null);
      setView('dashboard');
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col shadow-2xl bg-app-bg relative overflow-hidden">
      {/* Top Bar */}
      <header className="p-4 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 z-10">
        <h1 className="text-xl font-black text-medical-blue tracking-tight">CHP ASSIST</h1>
        <SyncIndicator status={syncStatus} pendingCount={pendingCount} />
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 space-y-6"
            >
              {/* Hero Section */}
              <button 
                onClick={startNewTest}
                className="w-full bg-medical-blue text-white p-8 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform"
              >
                <div className="bg-white/20 p-4 rounded-full">
                  <Plus size={48} strokeWidth={3} />
                </div>
                <span className="text-2xl font-black uppercase tracking-widest">Start New Test</span>
              </button>

              {/* Recent Activity */}
              <section className="space-y-4">
                <div className="flex justify-between items-end">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Recent Activity</h2>
                  <span className="text-xs font-bold text-medical-blue">View All</span>
                </div>
                <div className="space-y-3">
                  {records.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                      No recent tests found.
                    </div>
                  ) : (
                    records.slice(0, 5).map(record => (
                      <div key={record.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg">{record.patientName}</p>
                          <p className="text-sm text-gray-500 font-medium">{record.testType} • {new Date(record.timestamp).toLocaleDateString()}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${record.status === 'Positive' ? 'bg-alert-red/10 text-alert-red' : 'bg-success-green/10 text-success-green'}`}>
                          {record.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {view === 'patient-entry' && (
            <motion.div 
              key="patient-entry"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-4 space-y-6"
            >
              <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-medical-blue font-bold">
                <ArrowLeft size={20} /> Back to Dashboard
              </button>

              <div className="bg-gray-900 aspect-video rounded-3xl flex flex-col items-center justify-center text-white gap-4 relative overflow-hidden group">
                <Camera size={48} className="text-medical-blue animate-pulse" />
                <p className="font-bold tracking-widest uppercase text-sm">Scan Patient QR</p>
                <div className="absolute inset-0 border-2 border-medical-blue/30 m-4 rounded-2xl"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-medical-blue/50 animate-[scan_2s_infinite]"></div>
              </div>

              <form className="space-y-2" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handlePatientSubmit({
                  id: 'P-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
                  name: formData.get('name') as string,
                  age: formData.get('age') as string,
                  phone: formData.get('phone') as string,
                  consent: formData.get('consent') === 'on'
                });
              }}>
                <div className="floating-label-group">
                  <input type="text" name="name" placeholder=" " required />
                  <label>Full Patient Name</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="floating-label-group">
                    <input type="number" name="age" placeholder=" " required />
                    <label>Age</label>
                  </div>
                  <div className="floating-label-group">
                    <input type="tel" name="phone" placeholder=" " required pattern="[0-9]{10}" />
                    <label>Phone Number</label>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border-2 border-gray-100 space-y-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" name="consent" id="consent" required className="mt-1 w-6 h-6 rounded border-gray-300 text-medical-blue focus:ring-medical-blue" />
                    <label htmlFor="consent" className="text-sm font-medium text-gray-700">
                      I confirm that the patient has provided informed consent for this diagnostic test.
                    </label>
                  </div>
                  <button type="button" className="text-xs font-bold text-medical-blue uppercase tracking-widest underline">Read Consent Script</button>
                </div>

                <button type="submit" className="w-full bg-medical-blue text-white py-4 rounded-2xl font-black uppercase tracking-widest text-lg shadow-lg mt-4">
                  Continue to Diagnostic
                </button>
              </form>
            </motion.div>
          )}

          {view === 'diagnostic-hub' && (
            <motion.div 
              key="diagnostic-hub"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-4 space-y-6"
            >
              <button onClick={() => setView('patient-entry')} className="flex items-center gap-2 text-medical-blue font-bold">
                <ArrowLeft size={20} /> Patient Info
              </button>

              <div className="space-y-2">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">1. Device Connection</h2>
                <button 
                  onClick={() => setIsDeviceConnected(!isDeviceConnected)}
                  className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${isDeviceConnected ? 'bg-success-green/5 border-success-green' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isDeviceConnected ? 'bg-success-green text-white' : 'bg-gray-100 text-gray-400 animate-pulse'}`}>
                      <Bluetooth size={24} />
                    </div>
                    <div className="text-left">
                      <p className={`font-black uppercase tracking-tight ${isDeviceConnected ? 'text-success-green' : 'text-gray-400'}`}>
                        {isDeviceConnected ? 'Connected to BioScanner v2' : 'Searching for Device...'}
                      </p>
                      {isDeviceConnected && <p className="text-xs font-bold text-success-green/70">Battery: 84% • Signal: Strong</p>}
                    </div>
                  </div>
                  {isDeviceConnected && <CheckCircle2 className="text-success-green" />}
                </button>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">2. Select Test Type</h2>
                <div className="grid grid-cols-2 gap-4">
                  {(['Malaria', 'Blood Glucose', 'Typhoid', 'HIV'] as TestType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedTest(type)}
                      className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${selectedTest === type ? 'bg-medical-blue border-medical-blue text-white shadow-lg scale-105' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                      <span className="text-3xl">
                        {type === 'Malaria' ? '🦟' : type === 'Blood Glucose' ? '🩸' : type === 'Typhoid' ? '🌡️' : '🎗️'}
                      </span>
                      <span className="font-black uppercase text-xs tracking-widest">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                disabled={!isDeviceConnected || !selectedTest}
                onClick={handleStartAnalysis}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-lg shadow-lg transition-all ${isDeviceConnected && selectedTest ? 'bg-medical-blue text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Start Analysis
              </button>
            </motion.div>
          )}

          {view === 'analysis' && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 flex flex-col items-center justify-center min-h-[70vh] space-y-12"
            >
              <div className="relative">
                <div className="w-48 h-48 rounded-full border-4 border-medical-blue/20 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full border-4 border-medical-blue border-t-transparent animate-spin"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl">🔬</span>
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="flex justify-between items-end">
                  <p className="font-black text-medical-blue uppercase tracking-widest">Analyzing Sample...</p>
                  <p className="font-mono font-bold text-medical-blue">{Math.round(analysisProgress)}%</p>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-medical-blue"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysisProgress}%` }}
                  />
                </div>
                <div className="h-20 overflow-hidden text-center">
                  <AnimatePresence mode="wait">
                    <motion.p 
                      key={Math.floor(analysisProgress / 25)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs font-bold text-gray-400 uppercase tracking-widest"
                    >
                      {analysisProgress < 25 ? 'Calibrating sensor...' : 
                       analysisProgress < 50 ? 'Reading biomarkers...' :
                       analysisProgress < 75 ? 'Verifying data integrity...' :
                       'Finalizing results...'}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 space-y-6"
            >
              <div className={`p-8 rounded-[40px] text-white flex flex-col items-center gap-4 text-center shadow-xl ${testResult === 'Positive' ? 'bg-alert-red' : 'bg-success-green'}`}>
                {testResult === 'Positive' ? <AlertTriangle size={64} /> : <CheckCircle2 size={64} />}
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter">{selectedTest} {testResult}</h2>
                  <p className="font-bold opacity-80 uppercase tracking-widest mt-2">Patient: {currentPatient?.name}</p>
                </div>
              </div>

              {testResult === 'Positive' && (
                <div className="p-6 bg-white rounded-3xl border-2 border-alert-red/20 space-y-4">
                  <div className="flex items-center gap-3 text-alert-red">
                    <Hospital size={24} />
                    <h3 className="font-black uppercase tracking-widest">Referral Recommended</h3>
                  </div>
                  <p className="text-sm font-bold text-gray-600">Nearest Facility: <span className="text-gray-900">St. Mary's District Hospital</span></p>
                  <button className="w-full bg-alert-red text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Phone size={20} /> Call Facility
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <button 
                  onClick={handleFinalSubmit}
                  className="w-full bg-medical-blue text-white py-5 rounded-2xl font-black uppercase tracking-widest text-lg shadow-lg"
                >
                  Submit to MOH
                </button>
                <div className="flex items-center justify-center gap-2 text-success-green font-bold text-sm">
                  <CheckCircle2 size={16} /> Data Saved Locally
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation (Dashboard Only) */}
      {view === 'dashboard' && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 flex justify-around items-center">
          <button className="flex flex-col items-center gap-1 text-medical-blue">
            <div className="bg-medical-blue/10 p-2 rounded-xl"><Plus size={24} /></div>
            <span className="text-[10px] font-black uppercase">Tests</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <div className="p-2 rounded-xl"><ChevronRight size={24} /></div>
            <span className="text-[10px] font-black uppercase">Sync</span>
          </button>
        </nav>
      )}
    </div>
  );
}
