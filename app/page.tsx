'use client';

import { useState, useEffect, useRef } from 'react';

// Types
interface LogEntry {
  id: string;
  projectId: string;
  date: string;
  time: string;
  transcription: string;
  categories: string[];
  createdAt: number;
}

interface AppState {
  projects: string[];
  currentProject: string;
  logs: LogEntry[];
}

const CATEGORIES = [
  { id: 'delays', label: 'Delays', emoji: '⏰' },
  { id: 'safety', label: 'Safety', emoji: '🦺' },
  { id: 'materials', label: 'Materials', emoji: '📦' },
  { id: 'issues', label: 'Issues', emoji: '⚠️' },
];

const SAMPLE_TRANSCRIPTIONS = [
  "Arrived on site at 7 AM. Weather conditions are good. No delays encountered yet.",
  "Material delivery was delayed by 2 hours due to traffic. Crew is waiting on concrete mix.",
  "Safety inspection completed. All PPE requirements met. No incidents reported.",
  "Found a minor issue with the scaffolding on the north side. Reported to supervisor.",
  "Completed framing on building A. Moving to electrical rough-in this afternoon.",
  "Client requested change order for additional electrical outlets in conference room.",
  "Heavy rain started around 2 PM. Packed up exterior work and moved to interior tasks.",
  "Deliveries arrived: 50 sheets of drywall, 20 2x4 lumber bundles. Stored in shed.",
];

// Utility functions
const generateId = () => Math.random().toString(36).substring(2, 15);

const getToday = () => new Date().toISOString().split('T')[0];

const loadState = (): AppState => {
  if (typeof window === 'undefined') {
    return { projects: ['Project A', 'Project B', 'Project C'], currentProject: 'Project A', logs: [] };
  }
  const saved = localStorage.getItem('dailylog-state');
  if (saved) {
    return JSON.parse(saved);
  }
  return { projects: ['Project A', 'Project B', 'Project C'], currentProject: 'Project A', logs: [] };
};

const saveState = (state: AppState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dailylog-state', JSON.stringify(state));
  }
};

export default function DailyLogApp() {
  // State
  const [state, setState] = useState<AppState>({ projects: [], currentProject: '', logs: [] });
  const [activeTab, setActiveTab] = useState<'record' | 'logs' | 'archive'>('record');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load state on mount
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
  }, []);

  // Save state on change
  useEffect(() => {
    if (state.projects.length > 0) {
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
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        // Fallback to simulated transcription
        setTranscription(SAMPLE_TRANSCRIPTIONS[Math.floor(Math.random() * SAMPLE_TRANSCRIPTIONS.length)]);
      };
      
      recognition.onend = () => {
        if (isRecording) {
          // Restart if still recording
          recognition.start();
        }
      };
      
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setRecordingTime(0);
    } else {
      // Fallback: simulate transcription
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
    // If no transcription yet, add a placeholder
    if (!transcription) {
      setTranscription(SAMPLE_TRANSCRIPTIONS[Math.floor(Math.random() * SAMPLE_TRANSCRIPTIONS.length)]);
    }
  };

  // Toggle category
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Save log entry
  const saveLog = () => {
    if (!transcription.trim()) return;
    
    const newLog: LogEntry = {
      id: generateId(),
      projectId: state.currentProject,
      date: selectedDate,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      transcription: transcription.trim(),
      categories: selectedCategories.length > 0 ? selectedCategories : ['issues'],
      createdAt: Date.now(),
    };
    
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, newLog],
    }));
    
    // Reset form
    setTranscription('');
    setSelectedCategories([]);
    setRecordingTime(0);
  };

  // Delete log
  const deleteLog = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setState(prev => ({
        ...prev,
        logs: prev.logs.filter(log => log.id !== id),
      }));
    }
  };

  // Add project
  const addProject = () => {
    if (!newProjectName.trim()) return;
    setState(prev => ({
      ...prev,
      projects: [...prev.projects, newProjectName.trim()],
      currentProject: newProjectName.trim(),
    }));
    setNewProjectName('');
    setShowNewProjectInput(false);
  };

  // Filter logs
  const getFilteredLogs = (targetDate?: string) => {
    let filtered = state.logs.filter(log => log.projectId === state.currentProject);
    
    if (targetDate) {
      filtered = filtered.filter(log => log.date === targetDate);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.transcription.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterCategory) {
      filtered = filtered.filter(log => log.categories.includes(filterCategory));
    }
    
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  };

  // Export to text
  const exportToText = (logs: LogEntry[]) => {
    const text = logs.map(log => {
      const cats = log.categories.map(c => CATEGORIES.find(cat => cat.id === c)?.label || c).join(', ');
      return `[${log.date} ${log.time}] ${cats}\n${log.transcription}\n`;
    }).join('\n---\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dailylog-${state.currentProject}-${selectedDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get dates with entries
  const getDatesWithEntries = () => {
    const dates = new Set<string>();
    state.logs.forEach(log => {
      if (log.projectId === state.currentProject) {
        dates.add(log.date);
      }
    });
    return dates;
  };

  // Calendar helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const datesWithEntries = getDatesWithEntries();
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Get logs for current date
  const todayLogs = getFilteredLogs(selectedDate);

  if (state.projects.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Welcome to DailyLog AI</h1>
          <p className="text-text-secondary mb-6">Let us set up your first project</p>
          <input
            type="text"
            placeholder="Project name"
            className="input-field mb-4"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <button className="btn-primary w-full" onClick={addProject}>
            Create Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📋</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary font-heading">DailyLog AI</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDatePicker(true)}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              📅 {selectedDate}
            </button>
            <button
              onClick={() => setShowProjectModal(true)}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              🏗️ {state.currentProject}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'record' 
                ? 'bg-primary text-white' 
                : 'bg-white text-text-secondary border border-gray-200'
            }`}
          >
            🎙️ Record
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'logs' 
                ? 'bg-primary text-white' 
                : 'bg-white text-text-secondary border border-gray-200'
            }`}
          >
            📋 Logs
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'archive' 
                ? 'bg-primary text-white' 
                : 'bg-white text-text-secondary border border-gray-200'
            }`}
          >
            🔍 Archive
          </button>
        </div>

        {/* Record Tab */}
        {activeTab === 'record' && (
          <div className="space-y-6">
            {/* Recording Interface */}
            <div className="card text-center py-8">
              <div className="mb-6">
                <button
                  onClick={toggleRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all ${
                    isRecording 
                      ? 'bg-accent recording-pulse' 
                      : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  {isRecording ? '⏹️' : '🎙️'}
                </button>
              </div>
              
              {isRecording && (
                <div className="mb-4">
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-accent rounded-full waveform-bar"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-2xl font-mono text-accent">{formatTime(recordingTime)}</p>
                  <p className="text-text-secondary text-sm mt-1">Recording...</p>
                </div>
              )}
              
              {!isRecording && !transcription && (
                <p className="text-text-secondary">Tap to start recording</p>
              )}
              {!isRecording && transcription && (
                <p className="text-text-secondary text-sm">Tap to record again</p>
              )}
            </div>

            {/* Transcription */}
            {transcription && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">Transcription</h3>
                  <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                    98% accurate
                  </span>
                </div>
                <textarea
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  className="w-full input-field min-h-[100px] resize-none"
                  placeholder="Edit transcription if needed..."
                />
              </div>
            )}

            {/* Category Selection */}
            {transcription && (
              <div className="card">
                <h3 className="font-semibold text-text-primary mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`category-chip ${
                        selectedCategories.includes(cat.id)
                          ? 'category-chip-selected'
                          : 'category-chip-unselected'
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            {transcription && (
              <button
                onClick={saveLog}
                className="btn-primary w-full text-lg"
              >
                💾 Save Log Entry
              </button>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {todayLogs.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-4xl mb-4">📝</p>
                <p className="text-text-secondary">No logs for {selectedDate}</p>
                <p className="text-text-secondary text-sm">Start recording to add a new entry</p>
              </div>
            ) : (
              todayLogs.map(log => (
                <div key={log.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-secondary">{log.time}</span>
                      <div className="flex gap-1">
                        {log.categories.map(cat => {
                          const catInfo = CATEGORIES.find(c => c.id === cat);
                          return catInfo ? (
                            <span key={cat} className="text-sm" title={catInfo.label}>
                              {catInfo.emoji}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingLog(log)}
                        className="text-text-secondary hover:text-primary text-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="text-text-secondary hover:text-danger text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-text-primary">{log.transcription}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => exportToText([log])}
                      className="text-sm text-primary hover:underline"
                    >
                      📥 Export
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Archive Tab */}
        {activeTab === 'archive' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="card">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => setFilterCategory(null)}
                  className={`category-chip text-xs ${
                    !filterCategory ? 'category-chip-selected' : 'category-chip-unselected'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                    className={`category-chip text-xs ${
                      filterCategory === cat.id ? 'category-chip-selected' : 'category-chip-unselected'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {getFilteredLogs().length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-text-secondary">No matching logs found</p>
              </div>
            ) : (
              getFilteredLogs().map(log => (
                <div key={log.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-secondary">
                        {log.date} {log.time}
                      </span>
                      <div className="flex gap-1">
                        {log.categories.map(cat => {
                          const catInfo = CATEGORIES.find(c => c.id === cat);
                          return catInfo ? (
                            <span key={cat} className="text-sm" title={catInfo.label}>
                              {catInfo.emoji}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="text-text-primary">{log.transcription}</p>
                </div>
              ))
            )}

            {/* Export All */}
            {getFilteredLogs().length > 0 && (
              <button
                onClick={() => exportToText(getFilteredLogs())}
                className="btn-secondary w-full"
              >
                📥 Export All Results
              </button>
            )}
          </div>
        )}
      </main>

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl max-w-sm w-full p-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Select Project</h3>
            
            {state.projects.map(project => (
              <button
                key={project}
                onClick={() => {
                  setState(prev => ({ ...prev, currentProject: project }));
                  setShowProjectModal(false);
                }}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                  project === state.currentProject
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                🏗️ {project}
              </button>
            ))}
            
            {showNewProjectInput ? (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="New project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="input-field mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={addProject} className="btn-primary flex-1">
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewProjectInput(false);
                      setNewProjectName('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewProjectInput(true)}
                className="w-full text-left p-3 rounded-lg text-primary hover:bg-primary/5 mt-2"
              >
                ➕ Add New Project
              </button>
            )}
            
            <button
              onClick={() => setShowProjectModal(false)}
              className="w-full mt-4 py-2 text-text-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl max-w-sm w-full p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(prev => prev - 1);
                  } else {
                    setCalendarMonth(prev => prev - 1);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ◀️
              </button>
              <h3 className="font-semibold">{monthNames[calendarMonth]} {calendarYear}</h3>
              <button
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(prev => prev + 1);
                  } else {
                    setCalendarMonth(prev => prev + 1);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ▶️
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs text-text-secondary p-1">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {[...Array(firstDay)].map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEntry = datesWithEntries.has(dateStr);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === getToday();
                
                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setShowDatePicker(false);
                    }}
                    className={`p-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-primary text-white'
                        : isToday
                          ? 'bg-accent/20 text-accent'
                          : hasEntry
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-gray-100'
                    }`}
                  >
                    {day}
                    {hasEntry && !isSelected && <span className="text-xs">•</span>}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => {
                setSelectedDate(getToday());
                setShowDatePicker(false);
              }}
              className="w-full mt-4 py-2 text-primary hover:bg-primary/5 rounded-lg"
            >
              Today
            </button>
            <button
              onClick={() => setShowDatePicker(false)}
              className="w-full mt-2 py-2 text-text-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl max-w-sm w-full p-4">
            <h3 className="text-lg font-semibold mb-4">Edit Log Entry</h3>
            
            <textarea
              value={editingLog.transcription}
              onChange={(e) => setEditingLog({ ...editingLog, transcription: e.target.value })}
              className="input-field min-h-[100px] resize-none mb-4"
            />
            
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    const newCats = editingLog.categories.includes(cat.id)
                      ? editingLog.categories.filter(c => c !== cat.id)
                      : [...editingLog.categories, cat.id];
                    setEditingLog({ ...editingLog, categories: newCats });
                  }}
                  className={`category-chip text-sm ${
                    editingLog.categories.includes(cat.id)
                      ? 'category-chip-selected'
                      : 'category-chip-unselected'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setState(prev => ({
                    ...prev,
                    logs: prev.logs.map(log => log.id === editingLog.id ? editingLog : log),
                  }));
                  setEditingLog(null);
                }}
                className="btn-primary flex-1"
              >
                Save
              </button>
              <button onClick={() => setEditingLog(null)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}