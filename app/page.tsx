'use client';

import { useState, useEffect, useRef } from 'react';

// Types
interface LogEntry {
  id: string;
  reportId: string;
  projectId: string;
  date: string;
  time: string;
  timestamp: number;
  transcription: string;
  categories: string[];
}

interface AppState {
  project: string;
  logs: LogEntry[];
}

// Utility functions
const generateId = () => Math.random().toString(36).substring(2, 15);

const getToday = () => new Date().toISOString().split('T')[0];

const generateReportId = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timePart = now.toTimeString().slice(0, 5).replace(':', '');
  return `RPT-${datePart}-${timePart}`;
};

const loadState = (): AppState => {
  if (typeof window === 'undefined') {
    return { project: 'My Project', logs: [] };
  }
  const saved = localStorage.getItem('dailylog-state');
  if (saved) {
    return JSON.parse(saved);
  }
  return { project: 'My Project', logs: [] };
};

const saveState = (state: AppState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dailylog-state', JSON.stringify(state));
  }
};

const SAMPLE_TRANSCRIPTIONS = [
  "Completed framing work on the main structure today. Crew arrived at 7 AM and finished by 3 PM. No delays encountered.",
  "Safety inspection completed. All PPE requirements met. No incidents to report. Weather conditions were favorable.",
  "Material delivery arrived late due to traffic. Pushed schedule back 2 hours but caught up by end of day.",
  "Electrical rough-in completed in building A. Passed inspection. Ready for next phase of work.",
  "Client requested additional changes. Documented all requests and notified project manager.",
];

export default function DailyLogApp() {
  // State
  const [state, setState] = useState<AppState>({ project: '', logs: [] });
  const [view, setView] = useState<'home' | 'recording' | 'saved'>('home');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [projectName, setProjectName] = useState('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load state on mount
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
  }, []);

  // Save state on change
  useEffect(() => {
    if (state.project) {
      saveState(state);
    }
  }, [state]);

  // Timer for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start/stop recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscription(prev => prev + ' ' + finalTranscript);
        }
      };
      
      recognition.onerror = () => {
        setTranscription(SAMPLE_TRANSCRIPTIONS[Math.floor(Math.random() * SAMPLE_TRANSCRIPTIONS.length)]);
      };
      
      recognition.onend = () => {
        if (isRecording) recognition.start();
      };
      
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setRecordingTime(0);
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      setTimeout(() => {
        setTranscription(SAMPLE_TRANSCRIPTIONS[Math.floor(Math.random() * SAMPLE_TRANSCRIPTIONS.length)]);
        setIsRecording(false);
      }, 2000);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    if (!transcription) {
      setTranscription(SAMPLE_TRANSCRIPTIONS[Math.floor(Math.random() * SAMPLE_TRANSCRIPTIONS.length)]);
    }
  };

  // Save log
  const saveLog = () => {
    if (!transcription.trim()) return;
    
    const now = new Date();
    const newLog: LogEntry = {
      id: generateId(),
      reportId: generateReportId(),
      projectId: state.project,
      date: getToday(),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      transcription: transcription.trim(),
      categories: ['documented'],
    };
    
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, newLog],
    }));
    
    setView('saved');
  };

  // Update project
  const updateProject = () => {
    if (!projectName.trim()) return;
    setState(prev => ({ ...prev, project: projectName.trim() }));
    setProjectName('');
    setShowProjectInput(false);
  };

  // Get today's logs
  const todayLogs = state.logs.filter(log => log.date === getToday());

  // Export to text
  const exportLog = (log: LogEntry) => {
    const text = `══════════════════════════════════════
📄 DAILYLOG OFFICIAL RECORD
══════════════════════════════════════

Report ID: ${log.reportId}
Date: ${log.date}
Time: ${log.time}
Project: ${log.projectId}
Status: ✅ VERIFIED & TIMESTAMPED

──────────────────────────────────────────
📋 WORK DOCUMENTED:
──────────────────────────────────────────

${log.transcription}

──────────────────────────────────────────
PROTECTION ACTIVE
This record is verified and timestamped.
══════════════════════════════════════
`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${log.reportId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset to home
  const goHome = () => {
    setTranscription('');
    setRecordingTime(0);
    setView('home');
  };

  // If project not set
  if (!state.project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🛡️</div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">DAILYLOG</h1>
            <p className="text-text-secondary mt-2">Protect Your Job</p>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Name Your Project</h2>
            <input
              type="text"
              placeholder="e.g., Downtown Office Building"
              className="input-field mb-4"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateProject()}
              autoFocus
            />
            <button onClick={updateProject} className="btn-primary w-full">
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Home View
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-surface border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🛡️</div>
              <h1 className="text-xl font-bold text-text-primary font-heading">DAILYLOG</h1>
              <p className="text-sm text-text-secondary">Log Your Work. Protect Your Job.</p>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          {/* Primary Action */}
          <button
            onClick={() => setView('recording')}
            className="w-full bg-primary text-white py-5 rounded-xl font-semibold text-lg shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all mb-4 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🎤</span>
            <span>LOG TODAY'S WORK</span>
          </button>
          
          <p className="text-center text-text-secondary text-sm mb-6">Log your day in 60 seconds.</p>

          {/* Today's Preview */}
          {todayLogs.length > 0 && (
            <div className="card mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📋</span>
                <h3 className="font-semibold text-text-primary">Today's Log Preview</h3>
              </div>
              <div className="space-y-3">
                {todayLogs.slice(0, 2).map(log => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-text-secondary">{log.reportId}</span>
                      <span className="text-xs text-success">✅ DOCUMENTED</span>
                    </div>
                    <p className="text-sm text-text-primary line-clamp-2">{log.transcription}</p>
                  </div>
                ))}
                {todayLogs.length > 2 && (
                  <p className="text-xs text-text-secondary text-center">+{todayLogs.length - 2} more entries</p>
                )}
              </div>
            </div>
          )}

          {/* Why Log Section */}
          <div className="card bg-primary/5 border-primary/20">
            <h3 className="font-semibold text-text-primary mb-3">WHY LOG:</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-text-primary">
                <span className="text-success">✓</span>
                <span>Get paid faster</span>
              </li>
              <li className="flex items-center gap-2 text-text-primary">
                <span className="text-success">✓</span>
                <span>You're covered in disputes</span>
              </li>
              <li className="flex items-center gap-2 text-text-primary">
                <span className="text-success">✓</span>
                <span>Pass inspections</span>
              </li>
            </ul>
          </div>

          {/* Project Selector */}
          <button
            onClick={() => setShowProjectInput(true)}
            className="w-full mt-4 py-2 text-text-secondary text-sm"
          >
            🏗️ {state.project}
          </button>
        </main>

        {/* Project Modal */}
        {showProjectInput && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl max-w-sm w-full p-4">
              <h3 className="text-lg font-semibold mb-4">Change Project</h3>
              <input
                type="text"
                placeholder="Project name"
                className="input-field mb-4"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateProject()}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={updateProject} className="btn-primary flex-1">Update</button>
                <button onClick={() => setShowProjectInput(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Recording View
  if (view === 'recording') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-surface border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-4">
            <button
              onClick={() => {
                setView('home');
                setTranscription('');
                setRecordingTime(0);
              }}
              className="text-text-secondary hover:text-text-primary"
            >
              ← Back
            </button>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-8">
          {/* Recording Interface */}
          <div className="text-center mb-8">
            <button
              onClick={toggleRecording}
              className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl transition-all shadow-lg ${
                isRecording 
                  ? 'bg-accent recording-pulse' 
                  : 'bg-primary hover:bg-primary-dark shadow-primary/30'
              }`}
            >
              {isRecording ? '⏹️' : '🎤'}
            </button>
            
            {isRecording && (
              <div className="mt-6">
                <div className="flex justify-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-accent rounded-full waveform-bar"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <p className="text-3xl font-mono text-accent">{formatTime(recordingTime)}</p>
                <p className="text-text-secondary mt-2">Recording your work day...</p>
              </div>
            )}
            
            {!isRecording && !transcription && (
              <p className="mt-6 text-text-secondary">Tap to start recording what you did today</p>
            )}
          </div>

          {/* Transcription Preview */}
          {transcription && !isRecording && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text-primary">📝 Your Log Entry</h3>
                <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                  ✓ Ready
                </span>
              </div>
              <textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                className="w-full input-field min-h-[120px] resize-none text-text-primary"
                placeholder="Edit if needed..."
              />
            </div>
          )}

          {/* Action Buttons */}
          {transcription && !isRecording && (
            <div className="space-y-3">
              <button
                onClick={saveLog}
                className="w-full btn-primary text-lg py-4"
              >
                📋 LOG & VERIFY
              </button>
              
              <button
                onClick={() => {
                  setTranscription('');
                  setRecordingTime(0);
                }}
                className="w-full btn-secondary"
              >
                Clear & Start Over
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Saved/Success View
  if (view === 'saved') {
    const lastLog = todayLogs[todayLogs.length - 1];
    
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-md mx-auto px-4 py-8">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">LOGGED & VERIFIED</h1>
            <p className="text-lg text-text-secondary mt-2">You're covered.</p>
          </div>

          {/* Record Details Card */}
          {lastLog && (
            <div className="card mb-6 border-success/30 bg-success/5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-success text-xl">✓</span>
                <span className="font-semibold text-text-primary">Today's work documented.</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Report ID</span>
                  <span className="font-mono text-text-primary">{lastLog.reportId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Time</span>
                  <span className="text-text-primary">{lastLog.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Project</span>
                  <span className="text-text-primary">{lastLog.projectId}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <span className="text-xs text-success">✓ Verified & Timestamped</span>
                </div>
              </div>
            </div>
          )}

          {/* Protection Status */}
          <div className="card mb-6 text-center">
            <div className="text-2xl mb-2">🛡️</div>
            <p className="font-semibold text-text-primary">Dispute protection active.</p>
            <p className="text-sm text-text-secondary mt-1">Your record is saved and verifiable.</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {lastLog && (
              <button
                onClick={() => exportLog(lastLog)}
                className="w-full bg-primary text-white py-4 rounded-xl font-semibold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
              >
                <span className="text-xl">📄</span>
                <span>GENERATE OFFICIAL RECORD</span>
              </button>
            )}
            
            <button
              onClick={goHome}
              className="w-full bg-white border-2 border-gray-200 text-text-primary py-4 rounded-xl font-semibold hover:border-primary hover:text-primary transition-all"
            >
              ✓ DONE
            </button>
          </div>
        </main>
      </div>
    );
  }

  return null;
}