import React, { useState, useRef, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Trash2,
  Zap,
  Play,
  RotateCcw,
  Search,
  Activity,
  Flame,
  ArrowUpRight,
  TrendingDown,
  Download,
  Info,
  Copy,
  Check,
  Bot,
  Loader2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ChemicalLogEvent, EventSeverity, ChemicalState } from '../types';
import { generateAIStudioPayloadWrapper } from '../utils/aiStudioPayload';
import { SeverityFilter, SeverityToggleState } from './SeverityFilter';
import { soundEngine } from '../utils/audio';

interface SimulationHistoryLogProps {
  events: ChemicalLogEvent[];
  onTriggerOaeSpike: () => void;
  onTriggerRemediation: () => void;
  onStepStorySequence: () => void;
  onClearEvents: () => void;
  currentChemicalState: ChemicalState;
  onLiveAIInference?: () => Promise<void>;
  apiKey?: string;
}

export const SimulationHistoryLog: React.FC<SimulationHistoryLogProps> = ({
  events,
  onTriggerOaeSpike,
  onTriggerRemediation,
  onStepStorySequence,
  onClearEvents,
  currentChemicalState,
  onLiveAIInference,
  apiKey,
}) => {
  // Severity Filter toggles for Critical, Warning, Resolved, Nominal
  const [severityFilters, setSeverityFilters] = useState<SeverityToggleState>({
    critical: true,
    warning: true,
    resolved: true,
    nominal: true,
    info: true,
  });

  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [isInferring, setIsInferring] = useState<boolean>(false);
  const [engineStatus, setEngineStatus] = useState<{ text: string; color: string }>({
    text: '● AGENT SYNCED',
    color: '#34A853',
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevEventCountRef = useRef<number>(events.length);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState<boolean>(true);

  // Auto-scroll to bottom when new events arrive if enabled, and trigger auditory feedback for critical events
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }

    // Check if new events were added
    if (events.length > prevEventCountRef.current) {
      const addedEvents = events.slice(prevEventCountRef.current);
      const hasCritical = addedEvents.some((e) => e.severity === 'critical');
      if (hasCritical && audioFeedbackEnabled) {
        soundEngine.playCriticalAlarm();
      }
    }
    prevEventCountRef.current = events.length;
  }, [events, autoScroll, audioFeedbackEnabled]);

  const handleToggleSeverity = (severity: EventSeverity) => {
    setSeverityFilters((prev) => ({
      ...prev,
      [severity]: !prev[severity],
    }));
  };

  const handleSelectAllSeverities = () => {
    setSeverityFilters({
      critical: true,
      warning: true,
      resolved: true,
      nominal: true,
      info: true,
    });
  };

  const handleClearAllSeverities = () => {
    setSeverityFilters({
      critical: false,
      warning: false,
      resolved: false,
      nominal: false,
      info: false,
    });
  };

  // Filter events based on active severity toggles and search query
  const filteredEvents = events.filter((ev) => {
    // Check if event severity is enabled in the SeverityFilter
    if (!severityFilters[ev.severity]) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchMsg = ev.message.toLowerCase().includes(q);
      const matchCat = ev.category.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchCat) return false;
    }

    return true;
  });

  // Severity counts
  const severityCounts: Record<EventSeverity, number> = {
    critical: events.filter((e) => e.severity === 'critical').length,
    warning: events.filter((e) => e.severity === 'warning').length,
    resolved: events.filter((e) => e.severity === 'resolved').length,
    nominal: events.filter((e) => e.severity === 'nominal').length,
    info: events.filter((e) => e.severity === 'info').length,
  };

  const exportLogAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `oae_simulation_history_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copyAIStudioPayload = () => {
    const payload = generateAIStudioPayloadWrapper({
      ph: currentChemicalState.pH,
      pco2: currentChemicalState.pCO2,
      intake: 250,
    });
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleRunLiveAI = async () => {
    if (isInferring) return;
    setIsInferring(true);
    setEngineStatus({ text: '⏳ TRANSMITTING TELEMETRY...', color: '#FBBC05' });

    try {
      if (onLiveAIInference) {
        await onLiveAIInference();
      } else if (typeof (window as any).executeLiveAIStudioInference === 'function') {
        await (window as any).executeLiveAIStudioInference();
      } else {
        // Fallback simulation step
        onStepStorySequence();
      }
      setEngineStatus({ text: '● AGENT SYNCED', color: '#34A853' });
    } catch {
      setEngineStatus({ text: '● SYSTEM OFFLINE / DISCONNECTED', color: '#EA4335' });
    } finally {
      setIsInferring(false);
    }
  };

  const getSeverityStyle = (severity: EventSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          border: 'border-l-4 border-l-[#EA4335]',
          bg: 'bg-[#EA4335]/10',
          badge: 'bg-[#EA4335]/20 text-[#EA4335] border border-[#EA4335]/50',
          icon: <AlertOctagon className="w-3.5 h-3.5 text-[#EA4335]" />,
          label: 'CRITICAL ANOMALY',
        };
      case 'warning':
        return {
          border: 'border-l-4 border-l-[#FBBC05]',
          bg: 'bg-[#FBBC05]/10',
          badge: 'bg-[#FBBC05]/20 text-[#FBBC05] border border-[#FBBC05]/50',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#FBBC05]" />,
          label: 'THRESHOLD WARNING',
        };
      case 'resolved':
        return {
          border: 'border-l-4 border-l-[#34A853]',
          bg: 'bg-[#34A853]/10',
          badge: 'bg-[#34A853]/20 text-[#34A853] border border-[#34A853]/50',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#34A853]" />,
          label: 'HEURISTIC RESOLVED',
        };
      case 'nominal':
        return {
          border: 'border-l-4 border-l-[#4285F4]',
          bg: 'bg-[#4285F4]/10',
          badge: 'bg-[#4285F4]/20 text-[#4285F4] border border-[#4285F4]/50',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-[#4285F4]" />,
          label: 'SYSTEM NOMINAL',
        };
      case 'info':
      default:
        return {
          border: 'border-l-4 border-l-cyan-500',
          bg: 'bg-cyan-950/20',
          badge: 'bg-cyan-900/30 text-cyan-300 border border-cyan-800',
          icon: <Info className="w-3.5 h-3.5 text-cyan-400" />,
          label: 'STREAM LOG',
        };
    }
  };

  return (
    <div className="flex flex-col gap-3 font-mono text-slate-200 h-full">
      {/* Sub-header banner: Google Research // OAE-MIND Engine status */}
      <div className="p-3 bg-[#090d16] rounded-lg border border-[#4285F4]/40 flex flex-col gap-2 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#4285F4]" />
            <span className="text-[11px] font-bold tracking-wider text-white uppercase">
              Google Research // OAE-MIND Engine
            </span>
          </div>
          <div
            id="engine-status"
            className="flex items-center gap-1.5 text-[10px] font-bold transition-colors"
            style={{ color: engineStatus.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: engineStatus.color }}
            />
            <span>{engineStatus.text}</span>
          </div>
        </div>

        {/* Live chemical snapshot strip */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-1 rounded border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">pH:</span>
            <span
              className={`font-bold ${
                currentChemicalState.pH > 8.65
                  ? 'text-[#EA4335]'
                  : currentChemicalState.pH > 8.35
                  ? 'text-[#34A853]'
                  : 'text-cyan-400'
              }`}
            >
              {currentChemicalState.pH.toFixed(3)}
            </span>
          </div>
          <div className="bg-slate-950/60 p-1 rounded border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">TA:</span>
            <span className="text-cyan-300 font-bold">{currentChemicalState.totalAlkalinity}</span>
          </div>
          <div className="bg-slate-950/60 p-1 rounded border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Ω_arag:</span>
            <span
              className={`font-bold ${
                currentChemicalState.aragoniteSaturation > 4.5
                  ? 'text-[#EA4335]'
                  : currentChemicalState.aragoniteSaturation > 3.8
                  ? 'text-[#FBBC05]'
                  : 'text-[#34A853]'
              }`}
            >
              {currentChemicalState.aragoniteSaturation.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Simulation Interactive Control Triggers & Action Buttons Panel */}
      <div className="flex flex-col gap-1.5 bg-[#090d16] p-2.5 rounded-lg border border-slate-800">
        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
          <span>Simulation Trigger Controls</span>
          <span className="text-[9px] text-cyan-400">Event Injection Engine</span>
        </div>

        {/* Primary Action Buttons Panel */}
        <div className="grid grid-cols-2 gap-1.5 btn-panel">
          <button
            onClick={handleRunLiveAI}
            disabled={isInferring}
            className="btn-action flex items-center justify-center gap-1.5 py-2 px-2 rounded bg-gradient-to-r from-blue-900 to-indigo-950 border border-[#4285F4]/70 hover:border-[#4285F4] text-white text-[11px] font-bold tracking-wider transition active:scale-[0.98] shadow-sm disabled:opacity-50"
            title="Calls Google AI Studio Endpoint directly using live 3D metrics"
          >
            {isInferring ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4285F4]" />
            ) : (
              <Bot className="w-3.5 h-3.5 text-[#4285F4]" />
            )}
            <span>🤖 Run Live AI Prediction</span>
          </button>

          <button
            onClick={onTriggerOaeSpike}
            className="btn-action flex items-center justify-center gap-1.5 py-2 px-2 rounded bg-slate-700/80 hover:bg-slate-700 border border-slate-600 hover:border-red-400 text-white text-[11px] font-bold tracking-wider transition active:scale-[0.98] shadow-sm"
            style={{ background: '#334155' }}
            title="Inject local chemical excursion spike simulation"
          >
            <Zap className="w-3.5 h-3.5 text-[#EA4335] fill-current" />
            <span>⚠️ Inject Local Spike</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            onClick={onTriggerRemediation}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-gradient-to-r from-emerald-950 to-slate-900 border border-[#34A853]/70 hover:border-[#34A853] text-[#34A853] hover:text-white text-[10px] font-bold tracking-wider transition active:scale-[0.98]"
            title="Trigger AI neural heuristic stabilization and dilution bypass"
          >
            <ShieldCheck className="w-3 h-3" />
            <span>AI REMEDIATION</span>
          </button>

          <button
            onClick={onStepStorySequence}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-[10px] font-bold tracking-wider transition active:scale-[0.98]"
            title="Step to next narrative chapter and apply telemetry modifier"
          >
            <Play className="w-3 h-3 fill-current text-cyan-400" />
            <span>▶ STEP CHAPTER</span>
          </button>
        </div>
      </div>

      {/* Severity Filter Component Toggle & Search Bar */}
      <div className="flex flex-col gap-2">
        {/* Dedicated Severity Filter Component: allows users to toggle visibility by 'Critical', 'Warning', 'Resolved', 'Nominal' */}
        <SeverityFilter
          activeFilters={severityFilters}
          onToggleSeverity={handleToggleSeverity}
          onSelectAll={handleSelectAllSeverities}
          onClearAll={handleClearAllSeverities}
          counts={severityCounts}
          totalCount={events.length}
        />

        {/* Search and Action Bar */}
        <div className="flex items-center justify-between gap-1 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
          <div className="relative flex-1">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chemical events..."
              className="w-full bg-slate-900 border border-slate-800 rounded pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={copyAIStudioPayload}
              className={`p-1.5 rounded border text-[10px] flex items-center gap-1 transition ${
                copiedPayload
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
              }`}
              title="Copy Google AI Studio Payload Wrapper JSON"
            >
              {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[9px] font-bold">API PAYLOAD</span>
            </button>
            <button
              onClick={exportLogAsJson}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Export event log to JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClearEvents}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title="Clear event history log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-scroll & Auditory Feedback toggle strip */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
        <span>Displaying {filteredEvents.length} of {events.length} recorded events</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nextState = !audioFeedbackEnabled;
              setAudioFeedbackEnabled(nextState);
              if (nextState) soundEngine.playCriticalAlarm();
            }}
            className={`flex items-center gap-1 transition px-1.5 py-0.5 rounded border text-[9px] ${
              audioFeedbackEnabled
                ? 'border-red-500/50 bg-red-950/40 text-red-300 hover:bg-red-950/80'
                : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-400'
            }`}
            title={audioFeedbackEnabled ? 'Auditory alarm active for Critical events (click to mute)' : 'Auditory alarm muted (click to enable)'}
          >
            {audioFeedbackEnabled ? (
              <>
                <Volume2 className="w-3 h-3 text-[#EA4335] animate-pulse" />
                <span>CRITICAL ALARM ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3 text-slate-500" />
                <span>ALARM MUTED</span>
              </>
            )}
          </button>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3 accent-cyan-500 rounded cursor-pointer"
            />
            <span className="hover:text-slate-300">Auto-scroll</span>
          </label>
        </div>
      </div>

      {/* Timestamped Scrollable Feed */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[460px]"
      >
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
            <Clock className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-400">No events match filter</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Toggle severity buttons (Critical, Warning, Resolved, Nominal) or inject an OAE spike.
            </p>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const style = getSeverityStyle(ev.severity);
            return (
              <div
                key={ev.id}
                className={`${style.border} ${style.bg} p-3 rounded-r-md border-y border-r border-slate-800/80 transition-all hover:brightness-110 shadow-sm`}
              >
                {/* Header: Timestamp, Severity, Category */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {style.icon}
                    <span className="text-[10px] font-bold text-slate-400">
                      [{ev.timestamp}]
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {ev.relativeTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {ev.severity === 'critical' && (
                      <button
                        onClick={() => soundEngine.playCriticalAlarm()}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-900/40 hover:bg-red-800/60 border border-red-700/60 text-red-200 text-[8px] font-bold transition"
                        title="Replay Critical Alarm Audio"
                      >
                        <Volume2 className="w-2.5 h-2.5 text-red-400" />
                        <span>SIREN</span>
                      </button>
                    )}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${style.badge}`}>
                      {style.label}
                    </span>
                  </div>
                </div>

                {/* Event Title */}
                <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-1 leading-snug">
                  {ev.title}
                </h4>

                {/* Event Narrative Body */}
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans mb-2">
                  {ev.message}
                </p>

                {/* HUD Metric Strip */}
                {ev.metrics && (
                  <div className="text-[10px] text-[#00f5ff] font-bold bg-black/40 p-1.5 rounded border border-cyan-500/20 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>METRICS //</span>
                    {ev.metrics.pH !== undefined && <span>pH: {ev.metrics.pH.toFixed(2)}</span>}
                    {ev.metrics.totalAlkalinity !== undefined && (
                      <span>TA: {ev.metrics.totalAlkalinity} µmol/kg</span>
                    )}
                    {ev.metrics.pCO2 !== undefined && <span>pCO₂: {ev.metrics.pCO2} ppm</span>}
                    {ev.metrics.omega !== undefined && (
                      <span>Ω_arag: {ev.metrics.omega.toFixed(2)}</span>
                    )}
                    {ev.metrics.co2Rate !== undefined && (
                      <span>Yield: {ev.metrics.co2Rate.toFixed(2)} t/d</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
