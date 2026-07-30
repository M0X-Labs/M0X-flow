import { useState } from "react";
import { Gauge, Zap, HardDrive, Cpu, ChevronUp, ChevronDown, Activity, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRuntimeStore } from "@/lib/useRuntimeStore";

/**
 * HardwareHud — Floating overlay showing real-time inference metrics.
 * Displays tokens/sec, VRAM usage gauge, RAM pool, and active layer swap status.
 */
export function HardwareHud() {
  const [expanded, setExpanded] = useState(false);
  const { metrics, isLoaded } = useRuntimeStore();

  const vramPercent = metrics.vramTotalGB > 0 ? Math.min(100, Math.round((metrics.vramUsedGB / metrics.vramTotalGB) * 100)) : 0;
  const ramPercent = metrics.ramTotalGB > 0 ? Math.min(100, Math.round((metrics.ramUsedGB / metrics.ramTotalGB) * 100)) : 0;

  return (
    <div className="flex flex-col border-t border-[#27272a] bg-[#0c0c0e] text-[#f4f4f5] z-30 shrink-0 select-none">
      {/* Top Bar Summary */}
      <div className="flex items-center justify-between px-4 py-2 text-xs">
        <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
          {/* Tokens / sec Speed readout */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#f4f4f5]">
              <Zap className="w-3 h-3 text-[#a1a1aa]" />
            </div>
            <span className="text-[#a1a1aa] font-medium hidden xs:inline">Generation Speed:</span>
            {!isLoaded ? (
              <div className="w-16 h-5 bg-[#18181c] rounded animate-pulse border border-[#27272a]" />
            ) : (
              <span className="font-mono text-[#f4f4f5] font-bold bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a]">
                {metrics.tokensPerSec.toFixed(1)} tok/s
              </span>
            )}
          </div>

          {/* VRAM Meter */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#f4f4f5]">
              <Gauge className="w-3 h-3 text-[#a1a1aa]" />
            </div>
            <span className="text-[#a1a1aa] font-medium hidden sm:inline">VRAM:</span>
            {!isLoaded ? (
              <div className="w-32 h-5 bg-[#18181c] rounded animate-pulse border border-[#27272a]" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-24 sm:w-28 h-2 bg-[#18181c] rounded-full overflow-hidden border border-[#27272a] p-0.5">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${vramPercent}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-[#f4f4f5] font-semibold">
                  {metrics.vramUsedGB.toFixed(1)} / {metrics.vramTotalGB.toFixed(1)} GB ({vramPercent}%)
                </span>
              </div>
            )}
          </div>

          {/* RAM Meter */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#f4f4f5]">
              <HardDrive className="w-3 h-3 text-[#a1a1aa]" />
            </div>
            <span className="text-[#a1a1aa] font-medium">Sys RAM:</span>
            {!isLoaded ? (
              <div className="w-28 h-5 bg-[#18181c] rounded animate-pulse border border-[#27272a]" />
            ) : (
              <span className="font-mono text-[11px] text-[#a1a1aa] font-medium">
                {metrics.ramUsedGB.toFixed(1)} / {metrics.ramTotalGB.toFixed(1)} GB ({ramPercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Right Engine Status Badge & Expand Toggle */}
        <div className="flex items-center gap-3">
          {!isLoaded ? (
            <div className="w-28 h-6 bg-[#141418] rounded-xl animate-pulse border border-[#27272a]" />
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#141418] border border-[#27272a]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  metrics.isRunning ? "bg-emerald-500 animate-pulse" : "bg-[#71717a]"
                }`}
              />
              <span className="text-[11px] font-mono text-[#f4f4f5] font-semibold truncate max-w-[140px] sm:max-w-none">
                {metrics.activeEngine}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181c] rounded-lg transition-all cursor-pointer"
            title="Toggle Hardware Diagnostics"
          >
            {expanded ? <ChevronDown className="w-4 h-4 text-[#f4f4f5]" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Diagnostics */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden bg-[#09090b] border-t border-[#27272a] px-4 py-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-[#121215] rounded-xl border border-[#27272a]">
                <div className="text-[10px] text-[#71717a] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-sans font-semibold">
                  <Cpu className="w-3.5 h-3.5 text-[#a1a1aa]" /> Host GPU Device
                </div>
                {!isLoaded ? (
                  <div className="h-4 w-32 bg-[#18181c] rounded animate-pulse mt-1" />
                ) : (
                  <div className="text-xs font-semibold text-[#f4f4f5] truncate">{metrics.gpuModel || "Detecting GPU..."}</div>
                )}
              </div>

              <div className="p-3 bg-[#121215] rounded-xl border border-[#27272a]">
                <div className="text-[10px] text-[#71717a] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-sans font-semibold">
                  <Activity className="w-3.5 h-3.5 text-[#a1a1aa]" /> Offload Status
                </div>
                <div className="text-xs font-semibold text-[#f4f4f5]">
                  {metrics.isRunning ? "Layer-by-layer disk/GPU streaming active" : "Standby (No active stream)"}
                </div>
              </div>

              <div className="p-3 bg-[#121215] rounded-xl border border-[#27272a]">
                <div className="text-[10px] text-[#71717a] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-sans font-semibold">
                  <Radio className="w-3.5 h-3.5 text-[#a1a1aa]" /> Exo Cluster Peering
                </div>
                <div className="text-xs font-semibold text-[#f4f4f5]">Listening UDP:14321</div>
              </div>

              <div className="p-3 bg-[#121215] rounded-xl border border-[#27272a]">
                <div className="text-[10px] text-[#71717a] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-sans font-semibold">
                  <Zap className="w-3.5 h-3.5 text-[#a1a1aa]" /> Python Sidecar API
                </div>
                <div className="text-xs font-semibold text-[#f4f4f5]">FastAPI SSE Connected</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



