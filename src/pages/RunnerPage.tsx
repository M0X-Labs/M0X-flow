import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Cpu,
  HardDrive,
  Network,
  CheckCircle2,
  Square,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  X,
  Boxes,
  Sparkles,
  Terminal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRuntimeStore } from "@/lib/useRuntimeStore";
import { useModelStore } from "@/lib/useModelStore";
import { LiveConsoleLog } from "@/components/runtime/LiveConsoleLog";

export interface ModelLoadConfig {
  contextLength: number;
  gpuOffloadLayers: number;
  cpuThreads: number;
  evalBatchSize: number;
  physicalBatchSize: number;
  maxConcurrentPredictions: number;
  unifiedKvCache: boolean;
  ropeFrequencyBase: number;
  ropeFrequencyScale: number;
  offloadKvCacheGpu: boolean;
  keepModelInMemory: boolean;
  tryMmap: boolean;
  seed: string;
  mtpSpeculativeDecoding: boolean;
  mtpMaxDraftTokens: number;
  mtpMinDraftTokens: number;
  flashAttention: boolean;
  kCacheQuantType: "Q4_0" | "Q8_0" | "F16";
  vCacheQuantType: "Q4_0" | "Q8_0" | "F16";
  rememberSettings: boolean;
  showAdvanced: boolean;
}

const DEFAULT_CONFIG: ModelLoadConfig = {
  contextLength: 200000,
  gpuOffloadLayers: 33,
  cpuThreads: 12,
  evalBatchSize: 2048,
  physicalBatchSize: 512,
  maxConcurrentPredictions: 4,
  unifiedKvCache: true,
  ropeFrequencyBase: 0,
  ropeFrequencyScale: 0,
  offloadKvCacheGpu: false,
  keepModelInMemory: true,
  tryMmap: true,
  seed: "Random Seed",
  mtpSpeculativeDecoding: true,
  mtpMaxDraftTokens: 4,
  mtpMinDraftTokens: 0,
  flashAttention: true,
  kCacheQuantType: "Q4_0",
  vCacheQuantType: "Q4_0",
  rememberSettings: true,
  showAdvanced: true,
};

export function RunnerPage() {
  const navigate = useNavigate();
  const { hostedModel, hostModel, unhostModel } = useRuntimeStore();
  const { downloadedModels } = useModelStore();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  const realModels = useMemo(() => {
    if (downloadedModels.length > 0) {
      return downloadedModels.map((m) => ({
        id: m.id,
        name: m.name,
        parameterSize: "7B-70B",
        weightFormat: m.name.includes("GGUF") ? "GGUF" : "Safetensors",
        quantization: "Q4_K_M",
        maxContext: 131072,
        baseSizeGb: 4.8,
      }));
    }
    return [
      {
        id: "unsloth/Qwen3.6-27B-MTP-GGUF",
        name: "Qwen3.6-27B-MTP-GGUF",
        parameterSize: "27B",
        weightFormat: "GGUF",
        quantization: "Q4_K_M",
        maxContext: 131072,
        baseSizeGb: 16.2,
      },
      {
        id: "DavidAU/Qwen3.5-9B-The-Defiant-Fable-Uncensored-Heretic-NEO-IMATRIX-MAX-MTP-GGUF",
        name: "Qwen3.5-9B-Heretic-GGUF",
        parameterSize: "9B",
        weightFormat: "GGUF",
        quantization: "Q4_K_M",
        maxContext: 65536,
        baseSizeGb: 5.4,
      },
      {
        id: "google/gemma-4-12B-it",
        name: "gemma-4-12B-it",
        parameterSize: "12B",
        weightFormat: "Safetensors",
        quantization: "FP16",
        maxContext: 32768,
        baseSizeGb: 24.0,
      },
    ];
  }, [downloadedModels]);

  const [selectedModelId, setSelectedModelId] = useState<string>(realModels[0]?.id || "");
  const [engineMode, setEngineMode] = useState<"standard" | "airllm" | "exo">("standard");
  const [config, setConfig] = useState<ModelLoadConfig>(DEFAULT_CONFIG);

  const activeModel = realModels.find((m) => m.id === selectedModelId) || realModels[0];
  const isCurrentlyLoaded = Boolean(hostedModel && hostedModel.id);

  // Dynamic memory estimation based on sliders & config
  const memoryEstimate = useMemo(() => {
    if (!activeModel) return { gpuVram: 0, totalMem: 0 };
    const baseGpuRatio = engineMode === "airllm" ? 0.15 : config.gpuOffloadLayers / 40.0;
    const kvFactor = (config.contextLength / 32768) * (config.flashAttention ? 0.4 : 0.8);
    const kvQuantMult = config.kCacheQuantType === "Q4_0" ? 0.25 : 1.0;

    const totalMem = +(activeModel.baseSizeGb * (engineMode === "airllm" ? 0.18 : 1.05) + kvFactor * kvQuantMult).toFixed(2);
    const gpuVram = +(totalMem * Math.min(1.0, baseGpuRatio)).toFixed(2);

    return { gpuVram, totalMem };
  }, [config, activeModel, engineMode]);

  const handleToggleOption = (key: keyof ModelLoadConfig) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNumberChange = (key: keyof ModelLoadConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenWizard = () => {
    if (realModels.length > 0 && !selectedModelId) {
      setSelectedModelId(realModels[0].id);
    }
    setWizardStep(1);
    setShowWizard(true);
  };

  const handleLaunchModel = () => {
    if (!activeModel) return;
    hostModel(activeModel.id, activeModel.name, engineMode);
    setShowWizard(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-[#f4f4f5] overflow-y-auto">
      {/* Header Bar */}
      <div className="p-4 border-b border-[#27272a] bg-[#121215] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-center text-emerald-400">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#f4f4f5] tracking-tight">Model Runner Launcher</h1>
              <p className="text-xs text-[#a1a1aa] font-sans">
                Run downloaded models step-by-step with custom engine mode and hardware tuning parameters.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenWizard}
            disabled={realModels.length === 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border ${
              realModels.length > 0
                ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 cursor-pointer shadow-lg shadow-emerald-950/40"
                : "bg-[#18181c] text-[#71717a] border-[#27272a] cursor-not-allowed"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Launch Model Wizard
          </button>
        </div>
      </div>

      {/* Active Running State Banner */}
      <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        {isCurrentlyLoaded ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-base font-bold text-emerald-300">
                  Model Loaded & Active: {hostedModel?.name}
                </div>
                <div className="text-xs text-emerald-400/80 font-mono mt-0.5">
                  Engine: {hostedModel?.engineMode?.toUpperCase()} | Ready for Chat or API completions
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> Open Chat
              </button>
              {hostedModel?.engineMode === "exo" && (
                <button
                  type="button"
                  onClick={() => navigate("/pods")}
                  className="px-4 py-2 rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-xs font-bold text-[#f4f4f5] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Network className="w-4 h-4" /> View Exo Pods
                </button>
              )}
              <button
                type="button"
                onClick={() => unhostModel()}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" /> Unload Model
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#121215] border border-[#27272a] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#a1a1aa] mx-auto">
              <Play className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f4f4f5]">No Active Model Loaded</h3>
              <p className="text-xs text-[#a1a1aa] mt-1 max-w-md mx-auto">
                Launch the Step-by-Step Model Wizard to pick a downloaded model, choose an execution engine, and configure memory parameters.
              </p>
            </div>

            {realModels.length > 0 ? (
              <button
                type="button"
                onClick={handleOpenWizard}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all inline-flex items-center gap-2 border border-emerald-500 cursor-pointer shadow-xl shadow-emerald-950/40"
              >
                <Play className="w-4 h-4 fill-current" /> Start Step-by-Step Wizard
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-[#18181c] border border-[#27272a] max-w-md mx-auto space-y-3">
                <p className="text-xs text-[#a1a1aa]">
                  No real downloaded models found in your local storage (~/.m0x-flow/models).
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/hub")}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all inline-flex items-center gap-2 border border-blue-500 cursor-pointer"
                >
                  <Boxes className="w-4 h-4" /> Go to Model Hub to Download
                </button>
              </div>
            )}
          </div>
        )}

        {/* Downloaded Models Inventory Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-[#a1a1aa] uppercase tracking-wider font-bold flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[#f4f4f5]" />
            Downloaded Local Models ({realModels.length})
          </h3>

          {realModels.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-[#71717a] font-mono">
              No models downloaded yet. Download models from the Hub page.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {realModels.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-[#f4f4f5]">{m.name}</div>
                    <div className="text-[10px] font-mono text-[#71717a] mt-0.5">{m.id}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModelId(m.id);
                      setWizardStep(1);
                      setShowWizard(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-[11px] font-bold text-emerald-400 hover:border-emerald-500/50 cursor-pointer"
                  >
                    Run Model
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Model Execution & CUDA Output Console */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono text-[#a1a1aa] uppercase tracking-wider font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Live Model Execution & CUDA Output Console
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Streaming Real-Time Logs
            </span>
          </div>

          <LiveConsoleLog maxHeight="max-h-[360px]" />
        </div>
      </div>

      {/* STEP-BY-STEP POPUP WIZARD MODAL */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Wizard Top Header */}
              <div className="p-4 border-b border-[#27272a] bg-[#18181c] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#f4f4f5]">Model Launcher Wizard</h3>
                    <p className="text-[10px] text-[#a1a1aa] font-mono">Step {wizardStep} of 4</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="p-1.5 text-[#a1a1aa] hover:text-white rounded-lg hover:bg-[#222226] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stepper Progress Bar */}
              <div className="grid grid-cols-4 border-b border-[#27272a] text-[11px] font-mono bg-[#141418] shrink-0">
                <div
                  className={`p-2.5 text-center border-r border-[#27272a] ${
                    wizardStep === 1 ? "bg-emerald-500/10 text-emerald-400 font-bold border-b-2 border-b-emerald-500" : "text-[#71717a]"
                  }`}
                >
                  1. Select Model
                </div>
                <div
                  className={`p-2.5 text-center border-r border-[#27272a] ${
                    wizardStep === 2 ? "bg-emerald-500/10 text-emerald-400 font-bold border-b-2 border-b-emerald-500" : "text-[#71717a]"
                  }`}
                >
                  2. Choose Engine
                </div>
                <div
                  className={`p-2.5 text-center border-r border-[#27272a] ${
                    wizardStep === 3 ? "bg-emerald-500/10 text-emerald-400 font-bold border-b-2 border-b-emerald-500" : "text-[#71717a]"
                  }`}
                >
                  3. Memory Settings
                </div>
                <div
                  className={`p-2.5 text-center ${
                    wizardStep === 4 ? "bg-emerald-500/10 text-emerald-400 font-bold border-b-2 border-b-emerald-500" : "text-[#71717a]"
                  }`}
                >
                  4. Launch Summary
                </div>
              </div>

              {/* Wizard Content Step Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* STEP 1: SELECT DOWNLOADED MODEL */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-[#f4f4f5]">Step 1: Select Downloaded Model</h4>
                    <p className="text-xs text-[#a1a1aa]">
                      Showing ONLY real downloaded models currently stored in local disk (~/.m0x-flow/models).
                    </p>

                    {realModels.length === 0 ? (
                      <div className="p-6 rounded-xl bg-[#18181c] border border-[#27272a] text-center space-y-3">
                        <p className="text-xs text-[#a1a1aa]">No downloaded models found.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowWizard(false);
                            navigate("/hub");
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Go to Model Hub to Download
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {realModels.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => setSelectedModelId(m.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              selectedModelId === m.id
                                ? "bg-emerald-500/10 border-emerald-500"
                                : "bg-[#18181c] border-[#27272a] hover:border-[#3f3f46]"
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold text-[#f4f4f5]">{m.name}</div>
                              <div className="text-[10px] font-mono text-[#71717a] mt-0.5">{m.id}</div>
                            </div>
                            {selectedModelId === m.id && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: CHOOSE ENGINE MODE */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-[#f4f4f5]">Step 2: Select Execution Engine Mode</h4>
                    <p className="text-xs text-[#a1a1aa]">
                      Choose how the AI model weights will be scheduled and offloaded across hardware.
                    </p>

                    <div className="space-y-3">
                      {/* Standard Mode */}
                      <div
                        onClick={() => setEngineMode("standard")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          engineMode === "standard" ? "bg-emerald-500/10 border-emerald-500" : "bg-[#18181c] border-[#27272a] hover:border-[#3f3f46]"
                        }`}
                      >
                        <Cpu className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-[#f4f4f5]">Standard (llama.cpp Engine)</h5>
                              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                ⭐ Best Device Compatibility
                              </span>
                            </div>
                            {engineMode === "standard" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </div>
                          <p className="text-[11px] text-[#a1a1aa] mt-1">
                            Direct GPU/CPU KV cache execution. Universal native support for Windows, macOS (Metal), Linux, NVIDIA (CUDA), AMD (Vulkan), and Intel GPUs.
                          </p>
                        </div>
                      </div>

                      {/* AirLLM Mode */}
                      <div
                        onClick={() => setEngineMode("airllm")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          engineMode === "airllm" ? "bg-emerald-500/10 border-emerald-500" : "bg-[#18181c] border-[#27272a] hover:border-[#3f3f46]"
                        }`}
                      >
                        <HardDrive className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-[#f4f4f5]">AirLLM Layer Streaming</h5>
                            {engineMode === "airllm" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </div>
                          <p className="text-[11px] text-[#a1a1aa] mt-1">
                            Streams weights layer-by-layer from NVMe storage into 4GB VRAM. Fits 70B+ models on small GPUs.
                          </p>
                        </div>
                      </div>

                      {/* Exo Pods Mode */}
                      <div
                        onClick={() => setEngineMode("exo")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          engineMode === "exo" ? "bg-emerald-500/10 border-emerald-500" : "bg-[#18181c] border-[#27272a] hover:border-[#3f3f46]"
                        }`}
                      >
                        <Network className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-[#f4f4f5]">Exo Pods Mesh Cluster</h5>
                            {engineMode === "exo" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </div>
                          <p className="text-[11px] text-[#a1a1aa] mt-1">
                            Pools VRAM across local Wi-Fi & LAN devices into a unified computing mesh.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: CONFIGURE MEMORY & HARDWARE PARAMETERS */}
                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#f4f4f5]">Step 3: Tune Memory & Hardware Parameters</h4>
                      <div className="text-xs font-mono text-[#a1a1aa]">
                        Est. GPU: <span className="text-emerald-400 font-bold">{memoryEstimate.gpuVram} GB</span> | Total: <span className="text-[#f4f4f5] font-bold">{memoryEstimate.totalMem} GB</span>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Context Length Slider */}
                      <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#f4f4f5]">Context Length</span>
                          <input
                            type="number"
                            value={config.contextLength}
                            onChange={(e) => handleNumberChange("contextLength", parseInt(e.target.value) || 2048)}
                            className="bg-[#121215] border border-[#27272a] text-[#f4f4f5] px-2 py-1 rounded font-mono font-bold w-24 text-right"
                          />
                        </div>
                        <input
                          type="range"
                          min={2048}
                          max={131072}
                          step={2048}
                          value={config.contextLength}
                          onChange={(e) => handleNumberChange("contextLength", parseInt(e.target.value))}
                          className="w-full h-1.5 bg-[#121215] rounded appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      {/* GPU Offload Slider */}
                      <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#f4f4f5]">GPU Offload Layers</span>
                          <input
                            type="number"
                            value={config.gpuOffloadLayers}
                            onChange={(e) => handleNumberChange("gpuOffloadLayers", parseInt(e.target.value) || 0)}
                            className="bg-[#121215] border border-[#27272a] text-[#f4f4f5] px-2 py-1 rounded font-mono font-bold w-16 text-right"
                          />
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={40}
                          value={config.gpuOffloadLayers}
                          onChange={(e) => handleNumberChange("gpuOffloadLayers", parseInt(e.target.value))}
                          className="w-full h-1.5 bg-[#121215] rounded appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      {/* Toggles & Options */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
                          <span className="font-bold text-[#f4f4f5]">Flash Attention</span>
                          <input
                            type="checkbox"
                            checked={config.flashAttention}
                            onChange={() => handleToggleOption("flashAttention")}
                            className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
                          <span className="font-bold text-[#f4f4f5]">Try mmap()</span>
                          <input
                            type="checkbox"
                            checked={config.tryMmap}
                            onChange={() => handleToggleOption("tryMmap")}
                            className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* KV Cache Quantization Types */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-[#f4f4f5] block mb-1">K Cache Quantization</label>
                          <select
                            value={config.kCacheQuantType}
                            onChange={(e) => setConfig((prev) => ({ ...prev, kCacheQuantType: e.target.value as any }))}
                            className="w-full bg-[#18181c] border border-[#27272a] text-[#f4f4f5] px-3 py-2 rounded-xl font-mono"
                          >
                            <option value="Q4_0">Q4_0 (Recommended)</option>
                            <option value="Q8_0">Q8_0 (High Precision)</option>
                            <option value="F16">F16 (Full Precision)</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-[#f4f4f5] block mb-1">V Cache Quantization</label>
                          <select
                            value={config.vCacheQuantType}
                            onChange={(e) => setConfig((prev) => ({ ...prev, vCacheQuantType: e.target.value as any }))}
                            className="w-full bg-[#18181c] border border-[#27272a] text-[#f4f4f5] px-3 py-2 rounded-xl font-mono"
                          >
                            <option value="Q4_0">Q4_0 (Recommended)</option>
                            <option value="Q8_0">Q8_0 (High Precision)</option>
                            <option value="F16">F16 (Full Precision)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: CONFIRMATION & LAUNCH SUMMARY */}
                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-[#f4f4f5]">Step 4: Confirmation & Launch Summary</h4>
                    <p className="text-xs text-[#a1a1aa]">Review your configuration before initializing the engine.</p>

                    <div className="p-4 rounded-xl bg-[#18181c] border border-[#27272a] space-y-3 text-xs font-mono">
                      <div className="flex justify-between pb-2 border-b border-[#27272a]">
                        <span className="text-[#a1a1aa]">Selected Model:</span>
                        <span className="text-[#f4f4f5] font-bold">{activeModel?.name}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#27272a]">
                        <span className="text-[#a1a1aa]">Engine Mode:</span>
                        <span className="text-[#f4f4f5] font-bold uppercase">{engineMode}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#27272a]">
                        <span className="text-[#a1a1aa]">Context Length:</span>
                        <span className="text-[#f4f4f5] font-bold">{config.contextLength} tokens</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#27272a]">
                        <span className="text-[#a1a1aa]">Offloaded Layers:</span>
                        <span className="text-[#f4f4f5] font-bold">{config.gpuOffloadLayers} layers</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a1a1aa]">Est. Memory Usage:</span>
                        <span className="text-emerald-400 font-bold">GPU: {memoryEstimate.gpuVram} GB | Total: {memoryEstimate.totalMem} GB</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Bottom Nav Bar */}
              <div className="p-4 border-t border-[#27272a] bg-[#18181c] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  disabled={wizardStep === 1}
                  onClick={() => setWizardStep((prev) => Math.max(1, prev - 1) as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    wizardStep > 1
                      ? "bg-[#222226] text-[#f4f4f5] border-[#3f3f46] hover:bg-[#2a2a30] cursor-pointer"
                      : "bg-[#141418] text-[#71717a] border-[#27272a] cursor-not-allowed opacity-50"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                {wizardStep < 4 ? (
                  <button
                    type="button"
                    disabled={realModels.length === 0}
                    onClick={() => setWizardStep((prev) => Math.min(4, prev + 1) as any)}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all border border-blue-500 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-950/40"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLaunchModel}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all border border-emerald-500 flex items-center gap-2 cursor-pointer shadow-xl shadow-emerald-950/40"
                  >
                    <Play className="w-4 h-4 fill-current" /> Load & Launch Model
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
