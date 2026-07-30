import { motion } from "framer-motion";
import { Zap, Cpu, Network, Info } from "lucide-react";

export type EngineMode = "standard" | "airllm" | "exo";

interface EngineToggleProps {
  mode?: EngineMode;
  onModeChange?: (mode: EngineMode) => void;
}

/**
 * EngineToggle — 3-Way Pill Switcher:
 * 1. Standard (GGUF / llama.cpp / vLLM)
 * 2. AirLLM (Single-device layer-by-layer offloading)
 * 3. Exo Pods (P2P multi-device cluster pooling)
 */
export function EngineToggle({ mode = "standard", onModeChange }: EngineToggleProps) {
  return (
    <div className="flex flex-col items-center justify-center py-3 px-4 bg-[#09090b] border-b border-[#27272a] select-none z-20 shrink-0">
      <div className="relative flex items-center rounded-full bg-[#121215] border border-[#27272a] p-1 max-w-2xl w-full">
        {/* Option 1: Standard (GGUF / llama / vLLM) */}
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
          <Zap className={`w-3.5 h-3.5 z-10 ${mode === "standard" ? "text-white" : "text-[#a1a1aa]"}`} />
          <span className="z-10 truncate tracking-tight">Standard (GGUF / llama)</span>
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
          <Cpu className={`w-3.5 h-3.5 z-10 ${mode === "airllm" ? "text-white" : "text-[#a1a1aa]"}`} />
          <span className="z-10 truncate tracking-tight">AirLLM (Layered NVMe)</span>
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
          <Network className={`w-3.5 h-3.5 z-10 ${mode === "exo" ? "text-white" : "text-[#a1a1aa]"}`} />
          <span className="z-10 truncate tracking-tight">Exo Pods (P2P Mesh)</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2 text-[11px] text-[#a1a1aa] font-sans px-3 py-1 rounded-full bg-[#121215] border border-[#27272a]">
        <Info className="w-3.5 h-3.5 text-[#a1a1aa] shrink-0" />
        <span className="font-medium">
          {mode === "standard"
            ? "Standard Mode: High throughput direct GPU/CPU execution using llama.cpp acceleration."
            : mode === "airllm"
            ? "AirLLM Mode: Streams weights layer-by-layer from NVMe storage into 4GB VRAM to run 70B+ models."
            : "Exo Pods Mode: Pools VRAM across local Wi-Fi & LAN devices into a unified computing mesh."}
        </span>
      </div>
    </div>
  );
}




