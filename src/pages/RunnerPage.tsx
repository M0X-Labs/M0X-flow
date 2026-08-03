import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Cpu,
  HardDrive,
  Network,
  Square,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  X,
  Boxes,
  Sparkles,
  Terminal,
  Zap,
  SlidersHorizontal,
  Check,
  Globe,
  Copy,
  Server,
  Settings,
  Info,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRuntimeStore } from "@/lib/useRuntimeStore";
import { useModelStore } from "@/lib/useModelStore";
import { LiveConsoleLog } from "@/components/runtime/LiveConsoleLog";

export interface ModelLoadConfig {
  apiIdentifier: string;
  autoUnloadIdle: boolean;
  contextLength: number;
  gpuOffloadLayers: number;
  cpuThreads: number;
  evalBatchSize: number;
  physicalBatchSize: number;
  maxConcurrentPredictions: number;
  unifiedKvCache: boolean;
  autoRopeBase: boolean;
  ropeFrequencyBase: number;
  autoRopeScale: boolean;
  ropeFrequencyScale: number;
  offloadKvCacheGpu: boolean;
  keepModelInMemory: boolean;
  tryMmap: boolean;
  randomSeed: boolean;
  seed: string;
  mtpSpeculativeDecoding: boolean;
  mtpMaxDraftTokens: number;
  mtpMinDraftTokens: number;
  flashAttention: boolean;
  enableKQuant: boolean;
  kCacheQuantType: "Q4_0" | "Q8_0" | "F16";
  enableVQuant: boolean;
  vCacheQuantType: "Q4_0" | "Q8_0" | "F16";
  temperature: number;
  topK: number;
  topP: number;
  repeatPenalty: number;
  rememberSettings: boolean;
  showAdvanced: boolean;
}

const DEFAULT_CONFIG: ModelLoadConfig = {
  apiIdentifier: "",
  autoUnloadIdle: false,
  contextLength: 131072,
  gpuOffloadLayers: 42,
  cpuThreads: 1,
  evalBatchSize: 2048,
  physicalBatchSize: 512,
  maxConcurrentPredictions: 4,
  unifiedKvCache: true,
  autoRopeBase: true,
  ropeFrequencyBase: 0,
  autoRopeScale: true,
  ropeFrequencyScale: 0,
  offloadKvCacheGpu: true,
  keepModelInMemory: true,
  tryMmap: true,
  randomSeed: true,
  seed: "Random Seed",
  mtpSpeculativeDecoding: true,
  mtpMaxDraftTokens: 4,
  mtpMinDraftTokens: 0,
  flashAttention: true,
  enableKQuant: true,
  kCacheQuantType: "Q4_0",
  enableVQuant: true,
  vCacheQuantType: "Q4_0",
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  repeatPenalty: 1.1,
  rememberSettings: true,
  showAdvanced: true,
};

export function RunnerPage() {
  const navigate = useNavigate();
  const {
    hostedModel,
    hostModel,
    unhostModel,
    updateNetworkConfig,
    toggleCloudflare,
    cloudflareUrl,
    cloudflareActive,
  } = useRuntimeStore();
  const { downloadedModels } = useModelStore();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [hostingPort, setHostingPort] = useState<number>(hostedModel?.port || 8080);
  const [customPortInput, setCustomPortInput] = useState<string>(String(hostedModel?.port || 8080));
  const [hostIp, setHostIp] = useState<string>(hostedModel?.hostIp || "127.0.0.1");
  const [lanIp, setLanIp] = useState<string>("192.168.1.105");
  const [isCloudflareOn, setIsCloudflareOn] = useState<boolean>(Boolean(hostedModel?.cloudflareActive || cloudflareActive));

  // Server Settings Popover States
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [isServerRunning, setIsServerRunning] = useState(true);
  const [showEndpoints, setShowEndpoints] = useState(false);
  
  // Toggles inside Server Settings Popover
  const [requireAuth, setRequireAuth] = useState(false);
  const [apiKey, setApiKey] = useState("m0x-secret");
  const [serveLan, setServeLan] = useState(false);
  const [enableAnthropicApi, setEnableAnthropicApi] = useState(true);
  const [allowPerRequestMcps] = useState(true);
  const [allowCallingMcpJson] = useState(false);
  const [enableCors, setEnableCors] = useState(true);
  const [jitModelLoading, setJitModelLoading] = useState(true);
  const [autoUnloadJit, setAutoUnloadJit] = useState(true);
  const [maxIdleTtl, setMaxIdleTtl] = useState(60);
  const [onlyKeepLastJit, setOnlyKeepLastJit] = useState(true);

  // Connection Mode Calculation
  const accessMode = useMemo(() => {
    if (isCloudflareOn || hostedModel?.cloudflareActive || cloudflareActive) return "cloudflare";
    if (serveLan || (hostedModel?.hostIp && hostedModel.hostIp !== "127.0.0.1")) return "lan";
    return "localhost";
  }, [isCloudflareOn, hostedModel, cloudflareActive, serveLan]);

  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const activeCloudflareUrl = hostedModel?.cloudflareUrl || cloudflareUrl;

  // Fetch real LAN IP on load
  useEffect(() => {
    fetch("http://localhost:14321/api/system/network")
      .then((res) => res.json())
      .then((data) => {
        if (data.lan_ip && data.lan_ip !== "0.0.0.0") {
          setLanIp(data.lan_ip);
        }
      })
      .catch(() => null);
  }, []);

  const realModels = useMemo(() => {
    if (downloadedModels && downloadedModels.length > 0) {
      return downloadedModels.map((m) => ({
        id: m.id,
        name: m.name,
        parameterSize: m.parameter_size || (m.name.includes("27B") ? "27B" : m.name.includes("9B") ? "9B" : "7B-70B"),
        weightFormat: m.name.includes("GGUF") ? "GGUF" : "Safetensors",
        quantization: "Q4_K_M",
        maxContext: m.context_window || 131072,
        baseSizeGb: m.size_gb || 4.8,
        ramNeededGb: m.ram_needed_gb || (m.size_gb ? m.size_gb + 2.5 : 7.3),
        vramNeededGb: m.vram_needed_gb || (m.size_gb ? m.size_gb + 1.5 : 6.3),
        gpuLayersMax: m.gpu_layers_max || 99,
      }));
    }
    return [];
  }, [downloadedModels]);

  const [selectedModelId, setSelectedModelId] = useState<string>(realModels[0]?.id || "");
  const [engineMode, setEngineMode] = useState<"standard" | "airllm" | "exo">("standard");
  const [config, setConfig] = useState<ModelLoadConfig>(DEFAULT_CONFIG);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [hasMtpFile, setHasMtpFile] = useState(false);

  const activeModel = realModels.find((m) => m.id === selectedModelId) || realModels[0];
  const isCurrentlyLoaded = Boolean(hostedModel && hostedModel.id);

  const calculateMemory = (model: any, cfg: ModelLoadConfig) => {
    if (!model) return { gpuMem: 0, totalMem: 0, kvMem: 0, weightsMem: 0 };
    const maxLayers = model.gpuLayersMax || 99;
    const offloadRatio = Math.min(1, Math.max(0, cfg.gpuOffloadLayers / maxLayers));
    
    const baseSize = model.baseSizeGb || 4.8;
    
    // Base KV Cache calculation
    let baseKvMem = (cfg.contextLength / 1024) * 0.03;
    if (cfg.flashAttention) baseKvMem *= 0.95; // FA has minor memory overhead reduction
    
    let kMem = baseKvMem / 2;
    let vMem = baseKvMem / 2;
    
    if (cfg.enableKQuant) {
      if (cfg.kCacheQuantType === "Q4_0") kMem *= 0.25; // 16-bit to 4-bit
      else if (cfg.kCacheQuantType === "Q8_0") kMem *= 0.5; // 16-bit to 8-bit
    }
    
    if (cfg.enableVQuant) {
      if (cfg.vCacheQuantType === "Q4_0") vMem *= 0.25;
      else if (cfg.vCacheQuantType === "Q8_0") vMem *= 0.5;
    }
    
    let kvCacheGb = kMem + vMem;
    if (cfg.unifiedKvCache) kvCacheGb *= 0.95;
    
    const gpuMem = (baseSize * offloadRatio) + (offloadRatio > 0 && cfg.offloadKvCacheGpu ? kvCacheGb : 0);
    const cpuMem = (baseSize * (1 - offloadRatio)) + ((offloadRatio === 0 || !cfg.offloadKvCacheGpu) ? kvCacheGb : 0) + 1.5;
    
    return { gpuMem, totalMem: gpuMem + cpuMem, kvMem: kvCacheGb, weightsMem: baseSize };
  };

  const { estimatedGpuGb, estimatedTotalGb, currentKvMem } = useMemo(() => {
    const mem = calculateMemory(activeModel, config);
    return {
      estimatedGpuGb: mem.gpuMem.toFixed(2),
      estimatedTotalGb: mem.totalMem.toFixed(2),
      currentKvMem: mem.kvMem.toFixed(2),
    };
  }, [activeModel, config]);

  const renderMemoryImpact = (key: keyof ModelLoadConfig, onValue: any, offValue: any) => {
    if (!activeModel) return null;
    const memOn = calculateMemory(activeModel, { ...config, [key]: onValue });
    const memOff = calculateMemory(activeModel, { ...config, [key]: offValue });
    
    const vramDelta = memOn.gpuMem - memOff.gpuMem;
    const ramDelta = memOn.totalMem - memOff.totalMem - vramDelta;

    if (Math.abs(vramDelta) < 0.01 && Math.abs(ramDelta) < 0.01) return null;

    const formatDelta = (val: number) => (val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2));
    const vramColor = vramDelta > 0 ? "text-amber-500" : "text-emerald-400";
    const ramColor = ramDelta > 0 ? "text-amber-500" : "text-emerald-400";

    return (
      <div className="flex gap-2 text-[10px] font-mono mt-1 bg-black/20 px-2 py-0.5 rounded w-fit border border-white/5">
        <span className="text-zinc-500">Impact if Enabled:</span>
        {Math.abs(vramDelta) >= 0.01 && (
          <span className={vramColor}>VRAM {formatDelta(vramDelta)} GB</span>
        )}
        {Math.abs(ramDelta) >= 0.01 && (
           <span className={ramColor}>RAM {formatDelta(ramDelta)} GB</span>
        )}
      </div>
    );
  };

  // Check if selected model has an MTP file/folder on backend
  useEffect(() => {
    const targetId = selectedModelId || activeModel?.id;
    if (!targetId) return;
    const modelObj = downloadedModels.find((m) => m.id === targetId || m.name === targetId);

    fetch(`http://localhost:14321/api/model/check-mtp?model_id=${encodeURIComponent(targetId)}`)
      .then((res) => res.json())
      .then((data) => {
        setHasMtpFile(Boolean(data?.has_mtp) || Boolean((modelObj as any)?.has_mtp));
      })
      .catch(() => {
        const name = (activeModel?.name || targetId).toLowerCase();
        setHasMtpFile(
          name.includes("mtp") ||
          name.includes("draft") ||
          name.includes("speculative") ||
          Boolean((modelObj as any)?.has_mtp)
        );
      });
  }, [selectedModelId, activeModel, downloadedModels]);

  const reachableUrl = useMemo(() => {
    if (accessMode === "cloudflare" && activeCloudflareUrl) {
      return activeCloudflareUrl;
    }
    if (accessMode === "lan") {
      return `http://${lanIp}:${hostingPort}`;
    }
    return `http://127.0.0.1:${hostingPort}`;
  }, [accessMode, activeCloudflareUrl, lanIp, hostingPort]);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const handleNumberChange = (key: keyof ModelLoadConfig, value: number, min?: number, max?: number) => {
    let val = value;
    if (min !== undefined && val < min) val = min;
    if (max !== undefined && val > max) val = max;
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const handleConfigToggle = (key: keyof ModelLoadConfig, value: boolean) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      
      if (key === 'flashAttention' && !value) {
        next.enableKQuant = false;
        next.enableVQuant = false;
      }
      
      if ((key === 'enableKQuant' || key === 'enableVQuant') && value) {
        next.flashAttention = true;
      }
      
      return next;
    });
  };

  const handlePortChange = (newPort: number) => {
    setHostingPort(newPort);
    setCustomPortInput(String(newPort));
    if (isCurrentlyLoaded) {
      updateNetworkConfig(newPort, serveLan ? lanIp : "127.0.0.1", isCloudflareOn);
    }
  };

  const handleToggleLan = (enabled: boolean) => {
    setServeLan(enabled);
    const targetIp = enabled ? (lanIp || "0.0.0.0") : "127.0.0.1";
    setHostIp(targetIp);
    if (isCurrentlyLoaded) {
      updateNetworkConfig(hostingPort, targetIp, isCloudflareOn);
    }
  };

  const handleToggleCloudflare = (enabled: boolean) => {
    setIsCloudflareOn(enabled);
    const targetIp = serveLan ? (lanIp || "0.0.0.0") : "127.0.0.1";
    toggleCloudflare(enabled, hostingPort, targetIp);
    if (isCurrentlyLoaded) {
      updateNetworkConfig(hostingPort, targetIp, enabled);
    }
  };

  const handleOpenWizard = (modelId?: string) => {
    if (modelId) {
      setSelectedModelId(modelId);
    } else if (realModels.length > 0 && !selectedModelId) {
      setSelectedModelId(realModels[0].id);
    }
    setWizardStep(1);
    setShowWizard(true);
  };

  const handleLaunchModel = async () => {
    if (!activeModel) return;
    setIsLaunching(true);
    setLaunchError(null);
    
    const serverSettings = {
      requireAuth,
      apiKey,
      serveLan,
      enableAnthropicApi,
      allowPerRequestMcps,
      allowCallingMcpJson,
      enableCors,
      jitModelLoading,
      autoUnloadJit,
      maxIdleTtl,
      onlyKeepLastJit
    };

    try {
      await hostModel(activeModel.id, activeModel.name, engineMode, hostingPort, hostIp, isCloudflareOn, config, serverSettings);
      setShowWizard(false);
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : "Failed to launch model");
    } finally {
      setIsLaunching(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && showWizard && !isLaunching) {
        handleLaunchModel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showWizard, isLaunching, handleLaunchModel]);

  return (
    <div className="flex flex-col h-full bg-[#0b0b0e] text-[#e4e4e7] font-sans select-none overflow-hidden relative">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ================= TOP BAR (LM STUDIO & PROFESSIONAL HYBRID) ================= */}
      <div className="px-6 py-3 bg-[#121216]/90 backdrop-blur-md border-b border-[#27272a] flex items-center justify-between gap-4 shrink-0 z-20 shadow-sm">
        {/* Left Side: Server Status Switch & Settings Buttons */}
        <div className="flex items-center gap-3">
          {/* Server Running Pill with Toggle Switch */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#18181c] border border-[#27272a] text-xs shadow-inner">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isServerRunning ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-500/50" : "bg-zinc-600"}`} />
              <span className="text-xs text-[#a1a1aa] font-medium">Status: <strong className={isServerRunning ? "text-emerald-400 font-semibold" : "text-zinc-400"}>{isServerRunning ? "Running" : "Stopped"}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setIsServerRunning(!isServerRunning)}
              className={`w-9 h-5 rounded-full p-0.5 transition-all duration-200 cursor-pointer relative shadow-inner ${
                isServerRunning ? "bg-emerald-500" : "bg-[#3f3f46]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isServerRunning ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Server Settings Button (Triggers Popover Modal) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowServerSettings(!showServerSettings)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer active:scale-95 ${
                showServerSettings
                  ? "bg-[#27272a] border-[#3f3f46] text-white shadow-md"
                  : "bg-[#18181c] border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] hover:bg-[#202025]"
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>Server Settings</span>
            </button>

            {/* SERVER SETTINGS POPOVER MODAL */}
            <AnimatePresence>
              {showServerSettings && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowServerSettings(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute top-full left-0 mt-2.5 w-[360px] bg-[#16161a]/95 backdrop-blur-xl border border-[#2d2d34] rounded-2xl shadow-2xl z-50 p-4.5 space-y-3.5 text-xs text-[#e4e4e7]"
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#27272a]">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold text-white tracking-tight">API Listener Configuration</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-full border border-zinc-700/50">v1.2</span>
                    </div>

                    {/* Server Port Setting */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[#d4d4d8]">Server Port</span>
                        <span title="Port for local HTTP server listener">
                          <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 transition-colors" />
                        </span>
                      </div>
                      <input
                        type="number"
                        value={customPortInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomPortInput(val);
                          const num = parseInt(val, 10);
                          if (num > 1000 && num <= 65535) {
                            handlePortChange(num);
                          }
                        }}
                        className="w-20 bg-[#101014] border border-[#3f3f46] text-white text-xs font-mono px-2.5 py-1 rounded-lg text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Require Authentication */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-1.5">
                        <span>Require Authentication</span>
                        <Info className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setRequireAuth(!requireAuth)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          requireAuth ? "bg-emerald-500" : "bg-[#3f3f46]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${requireAuth ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* API Key Input (conditional) */}
                    <AnimatePresence>
                      {requireAuth && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center justify-between py-1 overflow-hidden"
                        >
                          <span className="font-medium text-zinc-400">API Key</span>
                          <input
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="m0x-secret"
                            className="w-36 bg-[#101014] border border-[#3f3f46] text-emerald-400 font-bold text-xs px-2 py-1 rounded-lg outline-none focus:border-emerald-500 transition-all"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Serve on Local Network */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-1.5">
                        <span>Serve on Local Network</span>
                        <Info className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleLan(!serveLan)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          serveLan ? "bg-emerald-500" : "bg-[#3f3f46]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${serveLan ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* Cloudflare Tunnel Toggle */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-300 font-medium">Cloudflare Public Tunnel</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleCloudflare(!isCloudflareOn)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          isCloudflareOn ? "bg-amber-500" : "bg-[#3f3f46]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isCloudflareOn ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* Enable Anthropic Claude Messages API */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-purple-300 font-medium">Enable Anthropic API (/v1/messages)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnableAnthropicApi(!enableAnthropicApi)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          enableAnthropicApi ? "bg-purple-500" : "bg-[#3f3f46]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enableAnthropicApi ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>



                    {/* Enable CORS */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-1.5">
                        <span>Enable CORS</span>
                        <Info className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnableCors(!enableCors)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          enableCors ? "bg-emerald-500" : "bg-[#3f3f46]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enableCors ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* Just-in-Time Model Loading */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-1.5">
                        <span>Just-in-Time Model Loading</span>
                        <Info className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setJitModelLoading(!jitModelLoading)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          jitModelLoading ? "bg-emerald-500" : "bg-[#3f3f46]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${jitModelLoading ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* Auto unload unused JIT loaded models */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-1.5">
                        <span>Auto unload unused JIT models</span>
                        <Info className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoUnloadJit(!autoUnloadJit)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          autoUnloadJit ? "bg-emerald-500" : "bg-[#3f3f46]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoUnloadJit ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* Max idle TTL input */}
                    {autoUnloadJit && (
                      <div className="flex items-center justify-between pl-3 border-l-2 border-blue-500/40 text-[11px] py-1 bg-[#121215]/50 rounded-r-lg">
                        <span className="text-zinc-400">Max idle TTL</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={maxIdleTtl}
                            onChange={(e) => setMaxIdleTtl(Number(e.target.value))}
                            className="w-14 bg-[#101014] border border-[#3f3f46] text-white text-xs font-mono px-2 py-0.5 rounded text-center outline-none"
                          />
                          <span className="text-zinc-400">minutes</span>
                        </div>
                      </div>
                    )}

                    {/* Only Keep Last JIT Loaded Model */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-1.5">
                        <span>Only Keep Last JIT Loaded Model</span>
                        <span title="Unloads previous JIT model when loading a new one">
                          <Info className="w-3.5 h-3.5 text-zinc-500" />
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOnlyKeepLastJit(!onlyKeepLastJit)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          onlyKeepLastJit ? "bg-emerald-500" : "bg-[#3f3f46]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${onlyKeepLastJit ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>


        </div>

        {/* Right Side: Reachable at & Load Model Action */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="text-emerald-400 font-sans font-semibold tracking-tight">Reachable at:</span>
            <div className="flex items-center gap-2 bg-[#18181c] border border-[#27272a] px-3 py-1.5 rounded-xl shadow-inner">
              <span className="text-white font-mono font-medium">{reachableUrl}</span>
              <button
                type="button"
                onClick={() => handleCopyText(reachableUrl, "top_url")}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5 hover:bg-zinc-800 rounded"
                title="Copy endpoint URL"
              >
                {copiedLabel === "top_url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenWizard()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition-all duration-200 cursor-pointer active:scale-95 border border-blue-400/30"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Load Model</span>
          </button>
        </div>
      </div>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-[#0b0b0e] relative z-10">
        {/* LOADED MODELS SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Loaded Model Instance</span>
            </h2>
            {isCurrentlyLoaded && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                Active Inference Server
              </span>
            )}
          </div>

          {isCurrentlyLoaded ? (
            <div className="p-5 rounded-2xl bg-[#121216] border border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl hover:border-[#3f3f46] transition-all duration-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
                  <h3 className="text-base font-bold text-white tracking-tight">{hostedModel?.name}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                  <span className="bg-[#18181c] px-2.5 py-1 rounded-lg border border-[#27272a]">Port: <strong className="text-white">{hostedModel?.port || hostingPort}</strong></span>
                  <span className="bg-[#18181c] px-2.5 py-1 rounded-lg border border-[#27272a]">Engine: <strong className="text-emerald-400 uppercase">{hostedModel?.engineMode || engineMode}</strong></span>
                  <span className="bg-[#18181c] px-2.5 py-1 rounded-lg border border-[#27272a]">Mode: <strong className="text-blue-400 uppercase">{accessMode}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/chat")}
                  className="px-4 py-2 rounded-xl bg-[#18181c] hover:bg-[#222228] text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-[#27272a] hover:border-[#3f3f46] active:scale-95 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/runtime")}
                  className="px-4 py-2 rounded-xl bg-[#18181c] hover:bg-[#222228] text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-[#27272a] hover:border-[#3f3f46] active:scale-95 shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                  <span>Hardware HUD</span>
                </button>
                <button
                  type="button"
                  onClick={() => unhostModel()}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-red-500/20 active:scale-95 shadow-sm"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Unload</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-14 px-6 text-center space-y-3.5 rounded-2xl border border-dashed border-[#27272a] bg-[#121216]/40 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#18181c] border border-[#27272a] flex items-center justify-center mx-auto text-zinc-400 shadow-inner">
                <Boxes className="w-6 h-6 text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#d4d4d8] font-semibold tracking-tight">
                  No model currently loaded in memory
                </p>
                <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                  Click <strong className="text-blue-400 font-semibold">+ Load Model</strong> to initialize a GGUF model into VRAM using CUDA or AirLLM streaming.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SUPPORTED ENDPOINTS COLLAPSIBLE SECTION */}
        <div className="rounded-2xl border border-[#27272a] bg-[#121216] overflow-hidden shadow-lg">
          <button
            type="button"
            onClick={() => setShowEndpoints(!showEndpoints)}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-[#18181c] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${showEndpoints ? "rotate-90 text-blue-400" : ""}`} />
              <span className="text-xs font-bold text-[#e4e4e7] tracking-tight">Supported API Endpoints</span>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#18181c] border border-[#27272a] text-[11px] text-blue-400 font-mono">
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">READY</span>
              <span>REST API v1</span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </div>
          </button>

          {showEndpoints && (
            <div className="p-5 border-t border-[#27272a] bg-[#0d0d10] space-y-4 text-xs font-mono">
              <div>
                <div className="text-zinc-400 font-sans font-semibold text-xs mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  OpenAI-Compatible REST Routes:
                </div>
                <div className="space-y-1.5 text-[#e4e4e7] pl-3.5 border-l-2 border-emerald-500/30">
                  <p><span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">GET</span> {reachableUrl}/v1/models</p>
                  <p><span className="text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">POST</span> {reachableUrl}/v1/chat/completions</p>
                  <p><span className="text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">POST</span> {reachableUrl}/v1/completions</p>
                  <p><span className="text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">POST</span> {reachableUrl}/v1/embeddings</p>
                </div>
              </div>

              <div>
                <div className="text-zinc-400 font-sans font-semibold text-xs mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Anthropic Claude SDK Routes:
                </div>
                <div className="space-y-1.5 text-[#e4e4e7] pl-3.5 border-l-2 border-purple-500/30">
                  <p><span className="text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">POST</span> {reachableUrl}/v1/messages</p>
                  <p><span className="text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">POST</span> {reachableUrl}/v1/complete</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DEVELOPER LOGS FOOTER SECTION */}
        <div className="flex-1 flex flex-col rounded-2xl border border-[#27272a] bg-[#121216] overflow-hidden min-h-[300px] shadow-lg">
          <div className="px-5 py-3 border-b border-[#27272a] flex items-center justify-between bg-[#16161a]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white tracking-tight">Developer & System Runtime Logs</span>
            </div>

            <div className="flex items-center gap-3 text-zinc-400">
              <button type="button" className="hover:text-white transition-colors cursor-pointer p-1 hover:bg-[#202025] rounded-lg" title="Options">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <button type="button" className="hover:text-white transition-colors cursor-pointer p-1 hover:bg-[#202025] rounded-lg" title="Clear logs">
                <Trash2 className="w-4 h-4" />
              </button>
              <button type="button" className="hover:text-white transition-colors cursor-pointer p-1 hover:bg-[#202025] rounded-lg" title="Copy logs">
                <Copy className="w-4 h-4" />
              </button>
              <button type="button" className="hover:text-white transition-colors cursor-pointer p-1 hover:bg-[#202025] rounded-lg" title="Collapse console">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-[#09090c] p-3 font-mono text-xs overflow-y-auto">
            <LiveConsoleLog maxHeight="h-full max-h-[350px]" />
          </div>
        </div>
      </div>



      {/* ================= MODEL LAUNCHER WIZARD MODAL ================= */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#16161a] border border-[#2d2d34] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Wizard Header */}
              <div className="px-6 py-4 border-b border-[#27272a] bg-[#1b1b20] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Model Execution Launcher Wizard</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">Step {wizardStep} of 4</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#27272a] cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Wizard Steps Bar */}
              <div className="grid grid-cols-4 border-b border-[#27272a] bg-[#101014] text-xs font-mono shrink-0">
                {[
                  { step: 1, label: "Select Model" },
                  { step: 2, label: "Engine" },
                  { step: 3, label: "Hardware" },
                  { step: 4, label: "Launch" },
                ].map((s) => {
                  const isActive = wizardStep === s.step;
                  const isDone = wizardStep > s.step;
                  return (
                    <div
                      key={s.step}
                      className={`p-3 text-center border-r border-[#27272a] last:border-r-0 font-medium transition-all ${
                        isActive ? "bg-[#16161a] text-emerald-400 font-bold border-b-2 border-b-emerald-500" : isDone ? "text-emerald-500/70" : "text-zinc-500"
                      }`}
                    >
                      {s.step}. {s.label}
                    </div>
                  );
                })}
              </div>

              {/* Wizard Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#121216]">
                {/* STEP 1: Select Model */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">Choose GGUF Model</h4>
                      <p className="text-xs text-zinc-400">Select a model downloaded from local storage.</p>
                    </div>

                    {realModels.length > 0 ? (
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {realModels.map((m) => {
                          const isSelected = selectedModelId === m.id;
                          return (
                            <div
                              key={m.id}
                              onClick={() => setSelectedModelId(m.id)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? "bg-emerald-500/10 border-emerald-500/60 text-white shadow-md"
                                  : "bg-[#18181c] border-[#27272a] text-zinc-400 hover:border-[#3f3f46] hover:bg-[#1e1e24]"
                              }`}
                            >
                              <div className="space-y-1.5 flex-1 pr-4">
                                <div className="text-xs font-bold text-white">{m.name}</div>
                                <div className="text-[10px] font-mono text-zinc-500">{m.id}</div>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                    Size: {m.baseSizeGb} GB
                                  </span>
                                  <span className="text-[9px] uppercase tracking-wider font-semibold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                                    RAM: {m.ramNeededGb} GB
                                  </span>
                                  <span className="text-[9px] uppercase tracking-wider font-semibold text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">
                                    VRAM: {m.vramNeededGb} GB
                                  </span>
                                  <span className="text-[9px] uppercase tracking-wider font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                                    CTX: {m.maxContext >= 1000000 ? `${(m.maxContext / 1000000).toFixed(1)}M` : m.maxContext >= 1000 ? `${Math.round(m.maxContext / 1000)}K` : m.maxContext}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-[#18181c] border border-[#27272a] text-center space-y-3.5">
                        <Boxes className="w-8 h-8 text-zinc-500 mx-auto" />
                        <p className="text-xs text-zinc-400">No downloaded model files found in your local directory.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowWizard(false);
                            navigate("/hub");
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
                        >
                          Go to Model Hub
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: Execution Engine */}
                  {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">Select Execution Engine</h4>
                      <p className="text-xs text-zinc-400">Choose inference backend engine.</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          id: "standard",
                          name: "Standard llama.cpp (CUDA GPU)",
                          desc: "Native CUDA llama-server binary with 100% GPU offload.",
                          icon: Zap,
                        },
                        {
                          id: "airllm",
                          name: "AirLLM NVMe Streaming",
                          desc: "Layer-by-layer NVMe VRAM streaming for limited hardware.",
                          icon: HardDrive,
                        },
                        {
                          id: "exo",
                          name: "Exo Pods Mesh Cluster",
                          desc: "Distributed LAN memory-weighted cluster mesh network.",
                          icon: Network,
                        },
                      ].map((item) => {
                        const isSelected = engineMode === item.id;
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setEngineMode(item.id as any)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-emerald-500/10 border-emerald-500/60 text-white shadow-md"
                                : "bg-[#18181c] border-[#27272a] text-zinc-400 hover:border-[#3f3f46] hover:bg-[#1e1e24]"
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`p-2 rounded-lg ${isSelected ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white">{item.name}</div>
                                <div className="text-[11px] text-zinc-400">{item.desc}</div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Engine-specific warnings */}
                    {engineMode === "airllm" && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-amber-300">
                          <HardDrive className="w-3.5 h-3.5" />
                          <span>AirLLM NVMe Streaming Notice</span>
                        </div>
                        <p className="text-amber-200/80">
                          AirLLM streams weights layer-by-layer from storage. Expect <strong>2-15 tokens/sec</strong> depending on NVMe speed.
                          Best for running 70B+ models on 4-8 GB VRAM. Requires Safetensors or compatible GGUF model format.
                        </p>
                      </div>
                    )}
                    {engineMode === "exo" && (
                      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-blue-300">
                          <Network className="w-3.5 h-3.5" />
                          <span>Exo P2P Cluster Notice</span>
                        </div>
                        <p className="text-blue-200/80">
                          Ensure peer devices on your LAN have <strong>m0x-flow</strong> or <strong>exo</strong> running with Pods enabled.
                          The Exo daemon will start automatically and discover peers on your network.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: Full Model Runner Configuration matching reference UI */}
                {wizardStep === 3 && (
                  <div className="space-y-4 text-xs font-sans">
                    {/* Header: Model Title + Estimated Memory Usage Chips */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight">{activeModel?.name || "Max"}</h3>
                        <p className="text-[11px] text-zinc-400">Configure engine runtime and model parameters</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          Estimated Memory Usage <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700">Beta</span>
                        </span>
                        <span className="bg-[#27272a] text-zinc-200 text-[11px] font-mono px-2 py-1 rounded-md border border-zinc-700">
                          GPU <strong className="text-white">{estimatedGpuGb} GB</strong>
                        </span>
                        <span className="bg-[#27272a] text-zinc-200 text-[11px] font-mono px-2 py-1 rounded-md border border-zinc-700">
                          KV Cache <strong className="text-purple-300">{currentKvMem} GB</strong>
                        </span>
                        <span className="bg-[#27272a] text-zinc-200 text-[11px] font-mono px-2 py-1 rounded-md border border-zinc-700">
                          Total <strong className="text-white">{estimatedTotalGb} GB</strong>
                        </span>
                      </div>
                    </div>

                    {/* Scrollable Form Body */}
                    <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                      {/* 1. API Identifier */}
                      <div className="space-y-1">
                        <label className="font-semibold text-zinc-200">API Identifier</label>
                        <p className="text-[11px] text-zinc-400">Optionally provide an identifier for this model. This will be used in API requests. Leave blank to use the default identifier.</p>
                        <input
                          type="text"
                          placeholder={activeModel?.id || "max"}
                          value={config.apiIdentifier}
                          onChange={(e) => setConfig((prev) => ({ ...prev, apiIdentifier: e.target.value }))}
                          className="w-full bg-[#18181c] border border-[#27272a] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                        />
                      </div>

                      {/* 2. Auto Unload If Idle (TTL) */}
                      <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-zinc-200 flex items-center gap-2">
                            <span>Auto Unload If Idle (TTL)</span>
                            <input
                              type="checkbox"
                              checked={config.autoUnloadIdle}
                              onChange={(e) => setConfig((prev) => ({ ...prev, autoUnloadIdle: e.target.checked }))}
                              className="accent-blue-500 cursor-pointer"
                            />
                          </label>
                        </div>
                        <p className="text-[11px] text-zinc-400">If set, the model will be automatically unloaded after being idle for the specified amount of time.</p>
                      </div>

                      {/* 3. Context Length */}
                      <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-200">Context Length</span>
                            <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleNumberChange("contextLength", activeModel?.maxContext || 131072, 512, activeModel?.maxContext || 131072)}
                              className="text-zinc-400 hover:text-white transition-all cursor-pointer"
                              title="Reset to default"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              value={config.contextLength}
                              onChange={(e) => handleNumberChange("contextLength", Number(e.target.value), 512, activeModel?.maxContext || 131072)}
                              className="w-24 bg-[#101014] border border-[#27272a] rounded-lg px-2 py-1 text-xs text-white text-right font-mono"
                            />
                          </div>
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                          Model supports up to <span className="bg-[#27272a] text-zinc-200 font-mono px-1.5 py-0.5 rounded text-[10px]">{activeModel?.maxContext || 131072}</span> tokens
                        </div>
                        <input
                          type="range"
                          min={512}
                          max={activeModel?.maxContext || 131072}
                          step={512}
                          value={config.contextLength}
                          onChange={(e) => handleNumberChange("contextLength", Number(e.target.value), 512, activeModel?.maxContext || 131072)}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* 4. GPU Offload */}
                      {engineMode !== "airllm" && (
                        <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-200">GPU Offload</span>
                              <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                            </div>
                            <input
                              type="number"
                              value={config.gpuOffloadLayers}
                              onChange={(e) => handleNumberChange("gpuOffloadLayers", Number(e.target.value), 0, activeModel?.gpuLayersMax || 99)}
                              className="w-20 bg-[#101014] border border-[#27272a] rounded-lg px-2 py-1 text-xs text-white text-right font-mono"
                            />
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={activeModel?.gpuLayersMax || 99}
                            value={config.gpuOffloadLayers}
                            onChange={(e) => handleNumberChange("gpuOffloadLayers", Number(e.target.value), 0, activeModel?.gpuLayersMax || 99)}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                            <span className="flex items-center gap-1">
                              💡 Model offload limited to dedicated GPU memory. Actual number of offloaded layers may differ
                            </span>
                            <button type="button" className="text-zinc-300 hover:text-white flex items-center gap-1 border border-zinc-700 px-2 py-0.5 rounded bg-zinc-800/60 cursor-pointer">
                              GPU Settings <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 5. CPU Thread Pool Size */}
                      <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-200">CPU Thread Pool Size</span>
                            <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleNumberChange("cpuThreads", 1, 1, 64)}
                              className="text-zinc-400 hover:text-white transition-all cursor-pointer"
                              title="Reset to default"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              value={config.cpuThreads}
                              onChange={(e) => handleNumberChange("cpuThreads", Number(e.target.value), 1, 64)}
                              className="w-20 bg-[#101014] border border-[#27272a] rounded-lg px-2 py-1 text-xs text-white text-right font-mono"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={32}
                          value={config.cpuThreads}
                          onChange={(e) => handleNumberChange("cpuThreads", Number(e.target.value), 1, 64)}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* 6. Evaluation Batch Size */}
                      <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">Evaluation Batch Size</span>
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                        </div>
                        <input
                          type="number"
                          value={config.evalBatchSize}
                          onChange={(e) => handleNumberChange("evalBatchSize", Number(e.target.value), 1, 8192)}
                          className="w-24 bg-[#101014] border border-[#27272a] rounded-lg px-2 py-1 text-xs text-white text-right font-mono"
                        />
                      </div>

                      {/* 7. Physical Batch Size */}
                      <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">Physical Batch Size</span>
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                        </div>
                        <input
                          type="number"
                          value={config.physicalBatchSize}
                          onChange={(e) => handleNumberChange("physicalBatchSize", Number(e.target.value), 1, 8192)}
                          className="w-24 bg-[#101014] border border-[#27272a] rounded-lg px-2 py-1 text-xs text-white text-right font-mono"
                        />
                      </div>

                      {/* 8. Max Concurrent Predictions */}
                      <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">Max Concurrent Predictions</span>
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                          <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700">Experimental</span>
                        </div>
                        <input
                          type="number"
                          value={config.maxConcurrentPredictions}
                          onChange={(e) => handleNumberChange("maxConcurrentPredictions", Number(e.target.value), 1, 10)}
                          className="w-24 bg-[#101014] border border-[#27272a] rounded-lg px-2 py-1 text-xs text-white text-right font-mono"
                        />
                      </div>

                      {/* 9. Unified KV Cache */}
                      {engineMode === "standard" && (
                        <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-200">Unified KV Cache</span>
                              <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                              <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700">Experimental</span>
                            </div>
                            {renderMemoryImpact("unifiedKvCache", true, false)}
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfig((prev) => ({ ...prev, unifiedKvCache: !prev.unifiedKvCache }))}
                            className={`w-11 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                              config.unifiedKvCache ? "bg-blue-600 justify-end" : "bg-zinc-700 justify-start"
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                          </button>
                        </div>
                      )}

                      {/* 10. RoPE Frequency Base */}
                      <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">RoPE Frequency Base</span>
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                          <input
                            type="checkbox"
                            checked={config.autoRopeBase}
                            onChange={(e) => setConfig((prev) => ({ ...prev, autoRopeBase: e.target.checked }))}
                            className="accent-blue-500 cursor-pointer"
                          />
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">
                          {config.autoRopeBase ? "Auto" : config.ropeFrequencyBase}
                        </span>
                      </div>

                      {/* 11. RoPE Frequency Scale */}
                      <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">RoPE Frequency Scale</span>
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                          <input
                            type="checkbox"
                            checked={config.autoRopeScale}
                            onChange={(e) => setConfig((prev) => ({ ...prev, autoRopeScale: e.target.checked }))}
                            className="accent-blue-500 cursor-pointer"
                          />
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">
                          {config.autoRopeScale ? "Auto" : config.ropeFrequencyScale}
                        </span>
                      </div>

                      {/* 12. Offload KV Cache to GPU Memory */}
                      {engineMode !== "airllm" && (
                        <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-200">Offload KV Cache to GPU Memory</span>
                              <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                            </div>
                            {renderMemoryImpact("offloadKvCacheGpu", true, false)}
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfig((prev) => ({ ...prev, offloadKvCacheGpu: !prev.offloadKvCacheGpu }))}
                            className={`w-11 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                              config.offloadKvCacheGpu ? "bg-blue-600 justify-end" : "bg-zinc-700 justify-start"
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                          </button>
                        </div>
                      )}

                      {/* 13. Keep Model in Memory */}
                      <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">Keep Model in Memory</span>
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, keepModelInMemory: !prev.keepModelInMemory }))}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                            config.keepModelInMemory ? "bg-blue-600 justify-end" : "bg-zinc-700 justify-start"
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                        </button>
                      </div>

                      {/* 14. Try mmap() */}
                      <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">Try mmap()</span>
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, tryMmap: !prev.tryMmap }))}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                            config.tryMmap ? "bg-blue-600 justify-end" : "bg-zinc-700 justify-start"
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                        </button>
                      </div>

                      {/* 15. Seed */}
                      <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">Seed</span>
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                          <input
                            type="checkbox"
                            checked={config.randomSeed}
                            onChange={(e) => setConfig((prev) => ({ ...prev, randomSeed: e.target.checked }))}
                            className="accent-blue-500 cursor-pointer"
                          />
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">
                          {config.randomSeed ? "Random Seed" : config.seed}
                        </span>
                      </div>

                      {/* 16. Flash Attention */}
                      {engineMode !== "airllm" && engineMode !== "exo" && (
                        <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-200">Flash Attention</span>
                              <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                            </div>
                            {renderMemoryImpact("flashAttention", true, false)}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleConfigToggle("flashAttention", true)}
                              className="text-zinc-400 hover:text-white transition-all cursor-pointer"
                              title="Reset to default"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfigToggle("flashAttention", !config.flashAttention)}
                              className={`w-11 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                                config.flashAttention ? "bg-blue-600 justify-end" : "bg-zinc-700 justify-start"
                              }`}
                            >
                              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 17. K Cache Quantization Type */}
                      {engineMode !== "airllm" && engineMode !== "exo" && (
                        <div className={`p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] space-y-2 transition-opacity ${!config.flashAttention ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-zinc-200">K Cache Quantization Type</span>
                                <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                                <input
                                  type="checkbox"
                                  checked={config.enableKQuant}
                                  onChange={(e) => handleConfigToggle("enableKQuant", e.target.checked)}
                                  className="accent-blue-500 cursor-pointer"
                                />
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700">Experimental</span>
                              </div>
                              {renderMemoryImpact("enableKQuant", true, false)}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setConfig((prev) => ({ ...prev, kCacheQuantType: "Q4_0" }))}
                                className="text-zinc-400 hover:text-white transition-all cursor-pointer"
                                title="Reset to default"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <select
                                value={config.kCacheQuantType}
                                onChange={(e) => setConfig((prev) => ({ ...prev, kCacheQuantType: e.target.value as any }))}
                                className="bg-[#101014] border border-[#27272a] rounded-lg px-3 py-1 text-xs text-white font-mono cursor-pointer"
                              >
                                <option value="Q4_0">Q4_0</option>
                                <option value="Q8_0">Q8_0</option>
                                <option value="F16">F16</option>
                              </select>
                            </div>
                          </div>
                          {!config.flashAttention && (
                            <p className="text-[10px] text-zinc-400 font-mono text-amber-500/80">Requires Flash Attention to be enabled.</p>
                          )}
                        </div>
                      )}

                      {/* 18. V Cache Quantization Type */}
                      {engineMode !== "airllm" && engineMode !== "exo" && (
                        <div className={`p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] space-y-2 transition-opacity ${!config.flashAttention ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-zinc-200">V Cache Quantization Type</span>
                                <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                                <input
                                  type="checkbox"
                                  checked={config.enableVQuant}
                                  onChange={(e) => handleConfigToggle("enableVQuant", e.target.checked)}
                                  className="accent-blue-500 cursor-pointer"
                                />
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700">Experimental</span>
                              </div>
                              {renderMemoryImpact("enableVQuant", true, false)}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setConfig((prev) => ({ ...prev, vCacheQuantType: "Q4_0" }))}
                                className="text-zinc-400 hover:text-white transition-all cursor-pointer"
                                title="Reset to default"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <select
                                value={config.vCacheQuantType}
                                onChange={(e) => setConfig((prev) => ({ ...prev, vCacheQuantType: e.target.value as any }))}
                                className="bg-[#101014] border border-[#27272a] rounded-lg px-3 py-1 text-xs text-white font-mono cursor-pointer"
                              >
                                <option value="Q4_0">Q4_0</option>
                                <option value="Q8_0">Q8_0</option>
                                <option value="F16">F16</option>
                              </select>
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-400 pt-1">
                            KV Cache Quantization is an experimental feature that may cause issues with some models. Flash Attention must be enabled for V cache quantization. If you encounter problems, reset to the default "F16".
                          </p>
                        </div>
                      )}

                      {/* 19. MTP Speculative Decoding (Draft Model Acceleration) — Shown ONLY if MTP file exists and engine is standard */}
                      {hasMtpFile && engineMode === "standard" && (
                        <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-200">MTP Speculative Decoding</span>
                              <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                              <span className="bg-purple-900/40 text-purple-300 text-[10px] px-1.5 py-0.5 rounded border border-purple-700/50">MTP Draft Detected</span>
                              <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700">Experimental</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setConfig((prev) => ({ ...prev, mtpSpeculativeDecoding: !prev.mtpSpeculativeDecoding }))}
                              className={`w-11 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                                config.mtpSpeculativeDecoding ? "bg-blue-600 justify-end" : "bg-zinc-700 justify-start"
                              }`}
                            >
                              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                            </button>
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            Auto-detects and loads accompanying MTP draft model (.gguf) sidecar file for 2x-3x faster token generation via speculative decoding.
                          </p>
                          {config.mtpSpeculativeDecoding && (
                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="text-[11px] text-zinc-400 mb-1 block font-medium">Max Draft Tokens:</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={16}
                                  value={config.mtpMaxDraftTokens}
                                  onChange={(e) => handleNumberChange("mtpMaxDraftTokens", Number(e.target.value), 1, 16)}
                                  className="w-full bg-[#101014] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] text-zinc-400 mb-1 block font-medium">Min Draft Tokens:</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={8}
                                  value={config.mtpMinDraftTokens}
                                  onChange={(e) => handleNumberChange("mtpMinDraftTokens", Number(e.target.value))}
                                  className="w-full bg-[#101014] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Controls matching reference UI */}
                    <div className="pt-3 border-t border-[#27272a] flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs">
                        <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.rememberSettings}
                            onChange={(e) => setConfig((prev) => ({ ...prev, rememberSettings: e.target.checked }))}
                            className="accent-blue-500 cursor-pointer"
                          />
                          <span>
                            Remember settings for <span className="bg-[#27272a] text-zinc-200 font-mono px-1.5 py-0.5 rounded text-[11px]">{config.apiIdentifier || activeModel?.id || "max"}</span>
                          </span>
                        </label>

                        <div className="flex items-center gap-2 text-zinc-300">
                          <button
                            type="button"
                            onClick={() => setConfig((prev) => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
                            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-all cursor-pointer ${
                              config.showAdvanced ? "bg-blue-600 justify-end" : "bg-zinc-700 justify-start"
                            }`}
                          >
                            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md" />
                          </button>
                          <span>Show advanced settings</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowWizard(false)}
                          className="px-4 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#323238] text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleLaunchModel}
                          disabled={!activeModel || isLaunching}
                          className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
                        >
                          {isLaunching ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Loading Model...</span>
                            </>
                          ) : (
                            <span>Load Model <span className="text-[10px] opacity-75 font-normal">Ctrl + Enter</span></span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Launch */}
                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">Confirm Parameters</h4>
                      <p className="text-xs text-zinc-400">Review before starting model runner.</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#18181c] border border-[#27272a] space-y-3 text-xs font-mono shadow-inner">
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-sans">Model:</span>
                        <span className="font-bold text-white">{activeModel?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-sans">Engine:</span>
                        <span className="font-bold text-emerald-400 uppercase">{engineMode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-sans">Context Window:</span>
                        <span className="font-bold text-emerald-300">{config.contextLength.toLocaleString()} Tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-sans">Flash Attention:</span>
                        <span className="font-bold text-emerald-300">{config.flashAttention ? "Auto Enabled" : "Disabled"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-sans">GPU Offload Layers:</span>
                        <span className="font-bold text-emerald-300">{config.gpuOffloadLayers} Layers</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-sans">KV Cache Quantization:</span>
                        <span className="font-bold text-purple-300">K: {config.kCacheQuantType} | V: {config.vCacheQuantType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-sans">CPU Threads:</span>
                        <span className="font-bold text-zinc-200">{config.cpuThreads} Threads</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-sans">Port:</span>
                        <span className="font-bold text-blue-400">{hostingPort}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-sans">Reachable Endpoint:</span>
                        <span className="font-bold text-emerald-400">{reachableUrl}</span>
                      </div>
                    </div>

                    {launchError && (
                      <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                        <X className="w-3.5 h-3.5 shrink-0 text-red-400" />
                        <span>{launchError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wizard Footer Nav */}
              <div className="px-6 py-4 border-t border-[#27272a] bg-[#101014] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => Math.max(1, prev - 1) as any)}
                  disabled={wizardStep === 1}
                  className="px-4 py-2 rounded-xl bg-[#18181c] border border-[#27272a] text-xs font-semibold text-zinc-400 hover:text-white hover:border-[#3f3f46] disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => Math.min(4, prev + 1) as any)}
                    disabled={wizardStep === 1 && realModels.length === 0}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-md"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLaunchModel}
                    disabled={!activeModel || isLaunching}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    {isLaunching ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Loading {engineMode === "airllm" ? "AirLLM" : engineMode === "exo" ? "Exo Pods" : "Model"}...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> Launch Model on Port {hostingPort}
                      </>
                    )}
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
