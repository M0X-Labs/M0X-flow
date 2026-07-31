import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Cpu, Network, Info, ShieldCheck, ChevronDown, Monitor, CheckCircle2 } from "lucide-react";

export type EngineMode = "standard" | "airllm" | "exo";

interface EngineToggleProps {
  mode?: EngineMode;
  onModeChange?: (mode: EngineMode) => void;
}

/**
 * EngineToggle — 3-Way Pill Switcher with Device Compatibility Breakdown:
 * 1. Standard (llama.cpp / GGUF — Recommended for 99% of devices)
 * 2. AirLLM (Single-device layer-by-layer offloading)
 * 3. Exo Pods (P2P multi-device cluster pooling)
 */
export function EngineToggle({ mode = "standard", onModeChange }: EngineToggleProps) {
  const [showCompatibility, setShowCompatibility] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-3 px-4 bg-[#09090b] border-b border-[#27272a] select-none z-20 shrink-0">
      <div className="relative flex items-center rounded-full bg-[#121215] border border-[#27272a] p-1 max-w-2xl w-full">
        {/* Option 1: Standard (GGUF / llama.cpp) */}
        <button
          type="button"
          onClick={() => onModeChange?.("standard")}
          className={`relative flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-full text-xs font-bold z-10 transition-all cursor-pointer ${
            mode === "standard" ? "text-white" : "text-[#a1a1aa] hover:text-[#f4f4f5]"
          }`}
        >
          {mode === "standard" && (
            <motion.div
              layoutId="engineTogglePill"
              className="absolute inset-0 rounded-full bg-[#27272a] border border-[#3f3f46]"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
          <Zap className={`w-3.5 h-3.5 z-10 ${mode === "standard" ? "text-emerald-400" : "text-[#a1a1aa]"}`} />
          <span className="z-10 truncate tracking-tight">Standard (llama.cpp)</span>
          <span className="hidden sm:inline-block z-10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ml-0.5">
            Best Compatibility
          </span>
        </button>

        {/* Option 2: AirLLM (Layered NVMe Offload) */}
        <button
          type="button"
          onClick={() => onModeChange?.("airllm")}
          className={`relative flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-full text-xs font-bold z-10 transition-all cursor-pointer ${
            mode === "airllm" ? "text-white" : "text-[#a1a1aa] hover:text-[#f4f4f5]"
          }`}
        >
          {mode === "airllm" && (
            <motion.div
              layoutId="engineTogglePill"
              className="absolute inset-0 rounded-full bg-[#27272a] border border-[#3f3f46]"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
          <Cpu className={`w-3.5 h-3.5 z-10 ${mode === "airllm" ? "text-blue-400" : "text-[#a1a1aa]"}`} />
          <span className="z-10 truncate tracking-tight">AirLLM (Layer NVMe)</span>
        </button>

        {/* Option 3: Exo Pods (P2P Cluster) */}
        <button
          type="button"
          onClick={() => onModeChange?.("exo")}
          className={`relative flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-full text-xs font-bold z-10 transition-all cursor-pointer ${
            mode === "exo" ? "text-white" : "text-[#a1a1aa] hover:text-[#f4f4f5]"
          }`}
        >
          {mode === "exo" && (
            <motion.div
              layoutId="engineTogglePill"
              className="absolute inset-0 rounded-full bg-[#27272a] border border-[#3f3f46]"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
          <Network className={`w-3.5 h-3.5 z-10 ${mode === "exo" ? "text-purple-400" : "text-[#a1a1aa]"}`} />
          <span className="z-10 truncate tracking-tight">Exo Pods (P2P Mesh)</span>
        </button>
      </div>

      {/* Mode Sub-Bar & Compatibility Drawer Toggle */}
      <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-[#a1a1aa] font-sans px-3 py-1.5 rounded-full bg-[#121215] border border-[#27272a] max-w-2xl w-full">
        <div className="flex items-center gap-2 truncate">
          <Info className="w-3.5 h-3.5 text-[#a1a1aa] shrink-0" />
          <span className="font-medium truncate">
            {mode === "standard"
              ? "Standard Mode (llama.cpp): Native cross-device acceleration for Windows, macOS, Linux, CUDA, Vulkan & Metal."
              : mode === "airllm"
              ? "AirLLM Mode: Streams weights layer-by-layer from storage to run 70B+ models on 4GB VRAM."
              : "Exo Pods Mode: Pools VRAM across local Wi-Fi & LAN devices into a unified computing mesh."}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowCompatibility(!showCompatibility)}
          className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 rounded-md border border-emerald-500/20 shrink-0 cursor-pointer transition-colors"
        >
          <Monitor className="w-3 h-3" />
          <span>Device Info</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showCompatibility ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Expandable Device Compatibility Matrix */}
      <AnimatePresence>
        {showCompatibility && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden max-w-2xl w-full mt-2"
          >
            <div className="p-3.5 rounded-xl bg-[#121215] border border-[#27272a] text-xs space-y-3 text-[#a1a1aa]">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-[#f4f4f5]">Cross-Device Compatibility Guide</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                  Recommended: llama.cpp
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-[#18181c] border border-[#27272a]">
                  <div className="flex items-center gap-1.5 font-bold text-[#f4f4f5]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>llama.cpp (Standard)</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[#a1a1aa]">
                    <strong className="text-emerald-400">Best Device Compatibility:</strong> Native on Windows, macOS (Metal), Linux. Supports NVIDIA CUDA, AMD Vulkan/ROCm, Intel SYCL, and CPU AVX2.
                  </p>
                </div>

                <div className="p-2 rounded bg-[#18181c] border border-[#27272a]">
                  <div className="flex items-center gap-1.5 font-bold text-[#f4f4f5]">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>vLLM Engine</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[#a1a1aa]">
                    <strong className="text-yellow-400">Enterprise Linux:</strong> High-throughput server engine. Requires Linux + NVIDIA CUDA. (Requires WSL2 on Windows, no macOS Metal).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
