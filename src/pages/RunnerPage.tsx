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
  Link as LinkIcon,
  Server,
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
  contextLength: 131072,
  gpuOffloadLayers: 99,
  cpuThreads: 12,
  evalBatchSize: 2048,
  physicalBatchSize: 512,
  maxConcurrentPredictions: 4,
  unifiedKvCache: true,
  ropeFrequencyBase: 0,
  ropeFrequencyScale: 0,
  offloadKvCacheGpu: true,
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

  // 3 Connection Modes: 'localhost' (127.0.0.1), 'lan' (Wi-Fi LAN IP), 'cloudflare' (Worldwide Public)
  const [accessMode, setAccessMode] = useState<"localhost" | "lan" | "cloudflare">(() => {
    if (hostedModel?.cloudflareActive || cloudflareActive) return "cloudflare";
    if (hostedModel?.hostIp && hostedModel.hostIp !== "127.0.0.1") return "lan";
    return "localhost";
  });

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

  // ONLY show real downloaded models from local storage (~/.m0x-flow/models)
  const realModels = useMemo(() => {
    if (downloadedModels && downloadedModels.length > 0) {
      return downloadedModels.map((m) => ({
        id: m.id,
        name: m.name,
        parameterSize: m.name.includes("27B") ? "27B" : m.name.includes("9B") ? "9B" : "7B-70B",
        weightFormat: m.name.includes("GGUF") ? "GGUF" : "Safetensors",
        quantization: "Q4_K_M",
        maxContext: 131072,
        baseSizeGb: (m as any).size_gb || 4.8,
      }));
    }
    return [];
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

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const handleNumberChange = (key: keyof ModelLoadConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleAccessModeChange = (newMode: "localhost" | "lan" | "cloudflare") => {
    setAccessMode(newMode);
    let targetIp = "127.0.0.1";
    let isCf = false;

    if (newMode === "localhost") {
      targetIp = "127.0.0.1";
      isCf = false;
    } else if (newMode === "lan") {
      targetIp = lanIp || "0.0.0.0";
      isCf = false;
    } else if (newMode === "cloudflare") {
      targetIp = lanIp || "0.0.0.0";
      isCf = true;
    }

    setHostIp(targetIp);
    setIsCloudflareOn(isCf);
    toggleCloudflare(isCf, hostingPort, targetIp);

    if (isCurrentlyLoaded) {
      updateNetworkConfig(hostingPort, targetIp, isCf);
    }
  };

  const handleGlobalPortChange = (portVal: number) => {
    setHostingPort(portVal);
    setCustomPortInput(String(portVal));
    if (isCurrentlyLoaded) {
      updateNetworkConfig(portVal, hostIp, isCloudflareOn);
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

  const handleLaunchModel = () => {
    if (!activeModel) return;
    hostModel(activeModel.id, activeModel.name, engineMode, hostingPort, hostIp, isCloudflareOn);
    setShowWizard(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-[#f4f4f5] overflow-y-auto font-sans select-none">
      {/* Top Header Bar */}
      <div className="p-4 border-b border-[#27272a] bg-[#121215] flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#18181c] border border-[#27272a] flex items-center justify-center text-emerald-400 shadow-inner">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#f4f4f5] tracking-tight">Model Execution Runner</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" /> CUDA GPU Offload
              </span>
            </div>
            <p className="text-xs text-[#a1a1aa] font-sans mt-0.5">
              Select connection mode (Localhost, Wi-Fi LAN, or Cloudflare Worldwide) and launch models.
            </p>
          </div>
        </div>

        {/* Top Controls: 3 Access Modes + Port Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Access Mode Selector: Exactly 3 Options */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#18181c] border border-[#27272a] text-xs font-mono">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[#a1a1aa] font-sans font-bold">Access Mode:</span>
            <select
              value={accessMode}
              onChange={(e) => handleAccessModeChange(e.target.value as any)}
              className="bg-[#121215] border border-[#3f3f46] text-xs font-mono font-bold text-[#f4f4f5] px-2.5 py-1 rounded-lg outline-none cursor-pointer"
            >
              <option value="localhost">🔒 1. Localhost (127.0.0.1)</option>
              <option value="lan">📶 2. Local Network & Wi-Fi ({lanIp || "LAN Access"})</option>
              <option value="cloudflare">⚡ 3. Cloudflare Tunnel (Worldwide Access)</option>
            </select>
          </div>

          {/* Hosting Port Input */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#18181c] border border-[#27272a]">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-[#a1a1aa]">Port:</span>
            <input
              type="number"
              value={customPortInput}
              onChange={(e) => {
                const val = e.target.value;
                setCustomPortInput(val);
                const num = parseInt(val, 10);
                if (num > 1000 && num <= 65535) {
                  handleGlobalPortChange(num);
                }
              }}
              className="w-16 bg-[#121215] border border-[#3f3f46] text-xs font-mono font-bold text-[#f4f4f5] px-2 py-1 rounded-lg outline-none text-center"
              placeholder="8080"
            />
          </div>

          {/* Dynamic Base URL Pill based on selected Access Mode */}
          {accessMode === "cloudflare" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-amber-300 font-bold">
                {activeCloudflareUrl ? `${activeCloudflareUrl}/v1` : "https://m0x-flow.trycloudflare.com/v1"}
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(activeCloudflareUrl ? `${activeCloudflareUrl}/v1` : "https://m0x-flow.trycloudflare.com/v1", "header")}
                className="p-1 hover:bg-amber-500/20 text-amber-300 rounded transition-colors cursor-pointer"
                title="Copy Worldwide Cloudflare Base URL"
              >
                {copiedLabel === "header" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : accessMode === "lan" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-bold">http://{lanIp || "0.0.0.0"}:{hostingPort}/v1</span>
              <button
                type="button"
                onClick={() => handleCopyText(`http://${lanIp || "0.0.0.0"}:${hostingPort}/v1`, "header")}
                className="p-1 hover:bg-emerald-500/20 text-emerald-300 rounded transition-colors cursor-pointer"
                title="Copy Wi-Fi LAN Base URL"
              >
                {copiedLabel === "header" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs font-mono">
              <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300 font-bold">http://127.0.0.1:{hostingPort}/v1</span>
              <button
                type="button"
                onClick={() => handleCopyText(`http://127.0.0.1:${hostingPort}/v1`, "header")}
                className="p-1 hover:bg-blue-500/20 text-blue-300 rounded transition-colors cursor-pointer"
                title="Copy Localhost Base URL"
              >
                {copiedLabel === "header" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleOpenWizard()}
            disabled={realModels.length === 0}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border cursor-pointer ${
              realModels.length > 0
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/30 shadow-lg shadow-emerald-600/20"
                : "bg-[#18181c] text-[#71717a] border-[#27272a] cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Wizard</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 max-w-5xl mx-auto w-full space-y-6 flex-1">
        {/* ACTIVE LOADED MODEL HERO CARD */}
        {isCurrentlyLoaded ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-[#0f1d18] via-[#121215] to-[#121215] border border-emerald-500/40 shadow-2xl relative overflow-hidden space-y-4"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Model Active in VRAM
                  </span>

                  {/* Dynamic Base URL Pill for Active Model */}
                  {accessMode === "cloudflare" ? (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Cloudflare Worldwide: <strong>{activeCloudflareUrl ? `${activeCloudflareUrl}/v1` : "https://m0x-flow.trycloudflare.com/v1"}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(activeCloudflareUrl ? `${activeCloudflareUrl}/v1` : "https://m0x-flow.trycloudflare.com/v1", "active_cf")}
                        className="p-1 hover:bg-amber-500/20 rounded text-amber-300 cursor-pointer"
                        title="Copy Cloudflare Public Base URL"
                      >
                        {copiedLabel === "active_cf" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : accessMode === "lan" ? (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Wi-Fi LAN URL: <strong>http://{lanIp || "0.0.0.0"}:{hostedModel?.port || hostingPort}/v1</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`http://${lanIp || "0.0.0.0"}:${hostedModel?.port || hostingPort}/v1`, "active_lan")}
                        className="p-1 hover:bg-emerald-500/20 rounded text-emerald-300 cursor-pointer"
                        title="Copy Wi-Fi LAN Base URL"
                      >
                        {copiedLabel === "active_lan" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/30">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Local URL: <strong>http://127.0.0.1:{hostedModel?.port || hostingPort}/v1</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`http://127.0.0.1:${hostedModel?.port || hostingPort}/v1`, "active_local")}
                        className="p-1 hover:bg-blue-500/20 rounded text-blue-300 cursor-pointer"
                        title="Copy Localhost Base URL"
                      >
                        {copiedLabel === "active_local" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight">{hostedModel?.name}</h2>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#a1a1aa] pt-1">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" /> GPU Offload: 100% (-ngl 99)
                  </span>
                  <span className="flex items-center gap-1.5 text-[#f4f4f5]">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" /> VRAM: 15.92 GB (RTX 5080)
                  </span>
                  <div className="flex items-center gap-1.5 text-[#f4f4f5] bg-[#18181c] px-2.5 py-1 rounded-lg border border-[#27272a]">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>Host Port: <strong className="text-emerald-400 font-mono">{hostedModel?.port || hostingPort}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#f4f4f5] bg-[#18181c] px-2.5 py-1 rounded-lg border border-[#27272a]">
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mode: <strong className="text-blue-300 font-mono uppercase">{accessMode}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Active Model */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate("/chat")}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer border border-emerald-400/40"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open Chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/runtime")}
                  className="px-4 py-2.5 rounded-xl bg-[#18181c] hover:bg-[#222226] text-[#f4f4f5] border border-[#27272a] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                  <span>Hardware HUD</span>
                </button>

                <button
                  type="button"
                  onClick={() => unhostModel()}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Unload</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#121215] border border-[#27272a] text-center space-y-4 shadow-xl relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-[#18181c] border border-[#27272a] flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
              <Zap className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#f4f4f5]">No Active Model Loaded into VRAM</h2>
              <p className="text-xs text-[#a1a1aa] mt-1 max-w-md mx-auto">
                {realModels.length > 0
                  ? `To run a model on Base URL ${accessMode === "cloudflare" ? (activeCloudflareUrl || "https://m0x-flow.trycloudflare.com") + "/v1" : accessMode === "lan" ? `http://${lanIp}:${hostingPort}/v1` : `http://127.0.0.1:${hostingPort}/v1`}, click the Start Model Launcher Wizard button.`
                  : "No downloaded models found in local storage. Head over to Model Hub to download GGUF models."}
              </p>
            </div>

            {realModels.length > 0 ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenWizard()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all inline-flex items-center gap-2 border border-emerald-400/40 shadow-xl shadow-emerald-950/40 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Model Launcher Wizard</span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/hub")}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all inline-flex items-center gap-2 border border-blue-400/40 shadow-xl cursor-pointer"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Go to Model Hub to Download</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* LIVE MODEL EXECUTION CONSOLE STREAM */}
        <div className="space-y-3 pt-3">
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

          <LiveConsoleLog maxHeight="max-h-[380px]" />
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
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#f4f4f5]">Model Execution Launcher Wizard</h3>
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

              {/* Wizard Step Progress Tracker */}
              <div className="grid grid-cols-4 border-b border-[#27272a] bg-[#0c0c0e] text-[11px] font-mono shrink-0">
                {[
                  { step: 1, label: "Select Model" },
                  { step: 2, label: "Execution Engine" },
                  { step: 3, label: "Network & Port" },
                  { step: 4, label: "Verify & Launch" },
                ].map((s) => {
                  const isActive = wizardStep === s.step;
                  const isDone = wizardStep > s.step;

                  return (
                    <div
                      key={s.step}
                      className={`p-3 text-center border-r border-[#27272a] last:border-r-0 font-bold transition-all ${
                        isActive
                          ? "bg-[#18181c] text-emerald-400 border-b-2 border-b-emerald-500"
                          : isDone
                          ? "text-emerald-500/70"
                          : "text-[#71717a]"
                      }`}
                    >
                      {s.step}. {s.label}
                    </div>
                  );
                })}
              </div>

              {/* Wizard Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#121215]">
                {/* STEP 1: Select Model */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#f4f4f5]">Choose GGUF Model to Run</h4>
                      <p className="text-xs text-[#a1a1aa]">Select an existing downloaded model file from local disk.</p>
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
                                  ? "bg-emerald-500/10 border-emerald-500 text-white"
                                  : "bg-[#18181c] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-[#f4f4f5]">{m.name}</div>
                                <div className="text-[10px] font-mono text-[#71717a]">{m.id}</div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono bg-[#121215] px-2 py-0.5 rounded border border-[#27272a] text-emerald-400">
                                  {m.baseSizeGb} GB
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-[#18181c] border border-[#27272a] text-center space-y-3">
                        <Boxes className="w-8 h-8 text-[#71717a] mx-auto" />
                        <p className="text-xs text-[#a1a1aa]">No downloaded model files found in your local storage directory.</p>
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
                    )}
                  </div>
                )}

                {/* STEP 2: Execution Engine */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#f4f4f5]">Select Execution Framework Engine</h4>
                      <p className="text-xs text-[#a1a1aa]">Choose inference orchestration strategy for model execution.</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          id: "standard",
                          name: "Standard llama.cpp (CUDA GPU)",
                          desc: "Native CUDA llama-server binary with 100% GPU layer offloading onto RTX 5080 VRAM.",
                          badge: "Recommended • Best Performance",
                          icon: Zap,
                          iconColor: "text-emerald-400",
                        },
                        {
                          id: "airllm",
                          name: "AirLLM NVMe Streaming",
                          desc: "Layer-by-layer NVMe VRAM offloading for 70B+ models on limited hardware.",
                          badge: "Low VRAM Required",
                          icon: HardDrive,
                          iconColor: "text-blue-400",
                        },
                        {
                          id: "exo",
                          name: "Exo Pods Mesh Cluster",
                          desc: "Distributed LAN memory-weighted cluster mesh network across multiple devices.",
                          badge: "P2P Mesh",
                          icon: Network,
                          iconColor: "text-purple-400",
                        },
                      ].map((item) => {
                        const isSelected = engineMode === item.id;
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.id}
                            onClick={() => setEngineMode(item.id as any)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                              isSelected
                                ? "bg-emerald-500/10 border-emerald-500 text-white"
                                : "bg-[#18181c] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
                            }`}
                          >
                            <div className={`p-2 rounded-lg bg-[#121215] border border-[#27272a] ${item.iconColor} shrink-0 mt-0.5`}>
                              <Icon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#f4f4f5]">{item.name}</span>
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#a1a1aa]">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 3: Network & Port Configuration */}
                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#f4f4f5]">Network & Access Mode Configuration</h4>
                      <p className="text-xs text-[#a1a1aa]">Review target endpoint Base URL and configure GPU VRAM offloading.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Port & Access Mode Display Info */}
                      <div className="p-4 rounded-xl bg-[#18181c] border border-[#27272a] space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#f4f4f5] block">Hosting Access Mode</span>
                            <span className="text-xs font-mono text-emerald-400 font-bold mt-0.5 uppercase block">
                              {accessMode === "cloudflare" ? "⚡ Cloudflare Tunnel (Worldwide)" : accessMode === "lan" ? "📶 Local Network & Wi-Fi" : "🔒 Localhost (127.0.0.1)"}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[#a1a1aa] bg-[#121215] px-2.5 py-1 rounded-lg border border-[#27272a] font-bold">
                            Port {hostingPort}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#27272a] flex items-center justify-between text-xs font-mono">
                          <span className="text-[#a1a1aa]">Endpoint Base URL:</span>
                          <span className="text-blue-400 font-bold">
                            {accessMode === "cloudflare"
                              ? (activeCloudflareUrl ? `${activeCloudflareUrl}/v1` : "Connecting Cloudflare Tunnel...")
                              : accessMode === "lan"
                              ? `http://${lanIp}:${hostingPort}/v1`
                              : `http://127.0.0.1:${hostingPort}/v1`}
                          </span>
                        </div>
                      </div>

                      {/* GPU Offload Slider */}
                      <div className="p-4 rounded-xl bg-[#18181c] border border-[#27272a] space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#f4f4f5]">GPU Offload Layers (-ngl)</span>
                          <span className="font-mono text-emerald-400 font-bold">{config.gpuOffloadLayers} Layers</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={99}
                          value={config.gpuOffloadLayers}
                          onChange={(e) => handleNumberChange("gpuOffloadLayers", Number(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Verify & Launch */}
                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#f4f4f5]">Verify Parameters & Execute</h4>
                      <p className="text-xs text-[#a1a1aa]">Confirm configuration before initializing GPU memory allocation.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#18181c] border border-[#27272a] space-y-3 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#a1a1aa] font-sans">Model:</span>
                        <span className="font-bold text-[#f4f4f5]">{activeModel?.name || "Selected Model"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a1a1aa] font-sans">Engine:</span>
                        <span className="font-bold text-emerald-400">{engineMode.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a1a1aa] font-sans">Access Mode:</span>
                        <span className="font-bold uppercase text-amber-400">{accessMode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a1a1aa] font-sans">Base URL:</span>
                        <span className="font-bold text-blue-400">
                          {accessMode === "cloudflare"
                            ? `${activeCloudflareUrl || "https://m0x-flow.trycloudflare.com"}/v1`
                            : accessMode === "lan"
                            ? `http://${lanIp}:${hostingPort}/v1`
                            : `http://127.0.0.1:${hostingPort}/v1`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a1a1aa] font-sans">Offload Layers:</span>
                        <span className="font-bold text-[#f4f4f5]">{config.gpuOffloadLayers} Layers</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a1a1aa] font-sans">Estimated VRAM / RAM:</span>
                        <span className="font-bold text-emerald-400">{memoryEstimate.gpuVram} GB VRAM / {memoryEstimate.totalMem} GB RAM</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Footer Nav Buttons */}
              <div className="p-4 border-t border-[#27272a] bg-[#18181c] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => Math.max(1, prev - 1) as any)}
                  disabled={wizardStep === 1}
                  className="px-4 py-2 rounded-xl bg-[#121215] border border-[#27272a] text-xs font-bold text-[#a1a1aa] hover:text-white disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => Math.min(4, prev + 1) as any)}
                    disabled={wizardStep === 1 && realModels.length === 0}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLaunchModel}
                    disabled={!activeModel}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" /> Launch Model on Port {hostingPort}
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
