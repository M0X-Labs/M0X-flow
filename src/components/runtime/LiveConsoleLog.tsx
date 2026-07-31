import { useState, useEffect, useRef } from "react";
import { Terminal, Trash2, Copy, Check, Search, ArrowDownCircle } from "lucide-react";

export interface LogEntry {
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

interface LiveConsoleLogProps {
  maxHeight?: string;
  autoScrollEnabled?: boolean;
}

export function LiveConsoleLog({ maxHeight = "max-h-[380px]", autoScrollEnabled = true }: LiveConsoleLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(autoScrollEnabled);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Poll live logs from sidecar backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:14321/api/system/logs").catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (data.logs && Array.isArray(data.logs)) {
            setLogs(data.logs);
          }
        }
      } catch {
        // silent catch
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === "ALL" || log.level === filterLevel;
    const matchesSearch =
      !searchQuery.trim() ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const handleCopyLogs = () => {
    const logText = filteredLogs.map((l) => `[${l.timestamp}] [${l.level}] [${l.source}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="flex flex-col rounded-2xl bg-[#09090b] border border-[#27272a] overflow-hidden select-text font-mono text-xs shadow-2xl">
      {/* Terminal Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#121215] border-b border-[#27272a] select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="flex items-center gap-1.5 ml-2 text-[#f4f4f5] font-bold">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Model Execution & CUDA Hardware Console</span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {logs.length} Lines
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-[#71717a] absolute left-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter logs..."
              className="pl-7 pr-2 py-1 bg-[#18181c] border border-[#27272a] focus:border-[#3f3f46] text-[11px] text-[#f4f4f5] placeholder-[#71717a] rounded-lg outline-none w-32 sm:w-44 transition-all"
            />
          </div>

          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-2 py-1 bg-[#18181c] border border-[#27272a] text-[11px] text-[#f4f4f5] rounded-lg outline-none cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>

          {/* Auto Scroll Toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              autoScroll ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-[#18181c] border-[#27272a] text-[#71717a]"
            }`}
            title={autoScroll ? "Auto-scroll Enabled" : "Auto-scroll Disabled"}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyLogs}
            className="p-1.5 bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-[#a1a1aa] hover:text-[#f4f4f5] rounded-lg transition-colors cursor-pointer"
            title="Copy Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClearLogs}
            className="p-1.5 bg-[#18181c] hover:bg-red-500/20 border border-[#27272a] hover:border-red-500/30 text-[#a1a1aa] hover:text-red-400 rounded-lg transition-colors cursor-pointer"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Output Stream */}
      <div
        ref={logContainerRef}
        className={`p-3.5 overflow-y-auto space-y-1.5 font-mono text-[11px] leading-relaxed bg-[#060608] ${maxHeight}`}
      >
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-[#71717a] font-sans">
            No live execution log lines matching filters. Run a model to stream real-time logs.
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const isErr = log.level === "ERROR";
            const isWarn = log.level === "WARN";
            const isCuda = log.source === "llama-server" || log.source === "cuda_server";

            return (
              <div key={index} className="flex items-start gap-2 hover:bg-[#121215] px-1.5 py-0.5 rounded transition-colors">
                <span className="text-[#52525b] shrink-0 font-mono select-none">[{log.timestamp}]</span>

                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase shrink-0 select-none ${
                    isErr
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : isWarn
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}
                >
                  {log.level}
                </span>

                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 select-none ${
                    isCuda
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-[#18181c] text-[#a1a1aa] border border-[#27272a]"
                  }`}
                >
                  {log.source}
                </span>

                <span className={`break-all ${isErr ? "text-red-300 font-bold" : isWarn ? "text-yellow-300" : isCuda ? "text-emerald-300" : "text-[#d4d4d8]"}`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
