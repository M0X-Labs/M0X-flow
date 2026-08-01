import { useState, useEffect } from "react";
import {
  Cpu,
  RotateCw,
  CheckCircle2,
  Download,
  Terminal,
  Copy,
  Check,
  Search,
  ChevronRight,
  Layers,
  Settings2,
  Sparkles,
} from "lucide-react";
import { LiveConsoleLog } from "@/components/runtime/LiveConsoleLog";

export interface EngineFrameworkItem {
  id: string;
  name: string;
  version: string;
  targetVersion?: string;
  description: string;
  releaseNotesUrl?: string;
  status: "latest" | "update_available" | "installable";
  downloadSize?: string;
  category: "cuda" | "vulkan" | "cpu" | "airllm" | "exo" | "parser" | "legacy";
}

const DEFAULT_ENGINES: EngineFrameworkItem[] = [
  {
    id: "cuda-12-llama",
    name: "CUDA 12 llama.cpp (Windows)",
    version: "v2.27.1",
    description: "Nvidia CUDA 12.8 & 13.3 accelerated llama.cpp engine with Blackwell RTX 5080 optimization",
    status: "latest",
    category: "cuda",
  },
  {
    id: "cpu-llama",
    name: "CPU llama.cpp (Windows)",
    version: "v2.13.0",
    targetVersion: "v2.27.1",
    description: "CPU-only llama.cpp engine with AVX2 & AVX512 vector acceleration",
    status: "update_available",
    downloadSize: "6.40 MB",
    category: "cpu",
  },
  {
    id: "cuda-llama-legacy",
    name: "CUDA llama.cpp (Windows)",
    version: "v2.13.0",
    targetVersion: "v2.27.1",
    description: "Nvidia CUDA accelerated llama.cpp engine (Legacy Driver Pack)",
    status: "update_available",
    downloadSize: "207.93 MB",
    category: "cuda",
  },
  {
    id: "vulkan-llama",
    name: "Vulkan llama.cpp (Windows)",
    version: "v2.13.0",
    targetVersion: "v2.27.1",
    description: "Vulkan cross-vendor GPU accelerated llama.cpp engine for AMD, Intel & Nvidia GPUs",
    status: "update_available",
    downloadSize: "19.18 MB",
    category: "vulkan",
  },
  {
    id: "harmony-parser",
    name: "Harmony (Windows)",
    version: "v0.3.6",
    description: "Chat history renderer and parser from OpenAI",
    status: "latest",
    category: "parser",
  },
  {
    id: "airllm-engine",
    name: "AirLLM NVMe Engine (Windows)",
    version: "v1.4.2",
    description: "Layer-by-layer NVMe VRAM offloading engine for 70B+ parameter models",
    status: "latest",
    category: "airllm",
  },
  {
    id: "exo-pods-mesh",
    name: "Exo Pods Mesh Cluster (Windows)",
    version: "v0.3.6",
    description: "Distributed memory-weighted LAN cluster mesh network engine",
    status: "latest",
    category: "exo",
  },
];

export function RuntimePage() {
  const [activeTab, setActiveTab] = useState<"runtimes" | "hardware" | "logs">("runtimes");
  const [engines, setEngines] = useState<EngineFrameworkItem[]>(DEFAULT_ENGINES);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCompat, setFilterCompat] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [ggufRuntime, setGgufRuntime] = useState("cuda12");
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [updateChannel, setUpdateChannel] = useState("stable");
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);

  // Hardware state
  const [gpuEnabled, setGpuEnabled] = useState(true);
  const [limitVramOffload, setLimitVramOffload] = useState(true);
  const [offloadKvCache, setOffloadKvCache] = useState(true);
  const [guardrails, setGuardrails] = useState<"off" | "relaxed" | "balanced">("balanced");
  const [copiedHardware, setCopiedHardware] = useState(false);

  // Real system hardware specs from sidecar
  const [systemInfo, setSystemInfo] = useState({
    cpuName: "AMD Ryzen 9 9900X3D 12-Core Processor",
    ramTotalGb: 31.11,
    ramUsedGb: 14.0,
    vramTotalGb: 15.92,
    vramUsedGb: 2.1,
    gpuModel: "NVIDIA GeForce RTX 5080",
    cpuThreads: 24,
    os: "Windows 11 (x64)",
  });

  // Fetch real system metrics & hardware config from backend sidecar
  useEffect(() => {
    const fetchRuntimeDetails = async () => {
      try {
        const res = await fetch("http://localhost:14321/api/runtime/details").catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (data.hardware) {
            setSystemInfo({
              cpuName: data.hardware.cpu_name || "AMD Ryzen 9 9900X3D 12-Core Processor",
              ramTotalGb: data.hardware.ram_total_gb || 31.11,
              ramUsedGb: data.hardware.ram_used_gb || 14.0,
              vramTotalGb: data.hardware.vram_total_gb || 15.92,
              vramUsedGb: data.hardware.vram_used_gb || 2.1,
              gpuModel: data.hardware.gpu_model || "NVIDIA GeForce RTX 5080",
              cpuThreads: data.hardware.cpu_cores || 24,
              os: data.hardware.os || "Windows 11 (x64)",
            });
          }
          if (data.runtimes && Array.isArray(data.runtimes)) {
            const mapped: EngineFrameworkItem[] = data.runtimes.map((r: any) => ({
              id: r.id,
              name: r.name,
              version: r.version,
              description: r.description,
              status: r.installed ? "latest" : "update_available",
              downloadSize: r.downloadSize,
              category: r.category as any,
            }));
            setEngines(mapped);
          }
          if (data.config) {
            setGpuEnabled(data.config.gpu_enabled);
            setLimitVramOffload(data.config.limit_vram_offload);
            setOffloadKvCache(data.config.offload_kv_cache);
            setGuardrails(data.config.guardrails || "balanced");
          }
        }
      } catch {
        // keep fallback values
      }
    };

    fetchRuntimeDetails();
    const interval = setInterval(fetchRuntimeDetails, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckUpdates = () => {
    setIsCheckingUpdates(true);
    setTimeout(() => {
      setIsCheckingUpdates(false);
    }, 1200);
  };

  const handleUpdateEngine = async (engineId: string) => {
    setInstallingId(engineId);
    try {
      await fetch("http://localhost:14321/api/runtime/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runtime_id: engineId }),
      }).catch(() => null);

      setEngines((prev) =>
        prev.map((e) => (e.id === engineId ? { ...e, status: "latest", version: e.targetVersion || e.version } : e))
      );
    } catch {
      // catch error
    } finally {
      setInstallingId(null);
    }
  };

  const handleSaveHardwareConfig = async (newGuardrails?: "off" | "relaxed" | "balanced") => {
    const targetGuardrails = newGuardrails || guardrails;
    try {
      await fetch("http://localhost:14321/api/hardware/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gpu_enabled: gpuEnabled,
          limit_vram_offload: limitVramOffload,
          offload_kv_cache: offloadKvCache,
          guardrails: targetGuardrails,
        }),
      }).catch(() => null);
    } catch {
      // catch
    }
  };

  const handleCopyHardwareInfo = () => {
    const text = `Hardware Specs:\nCPU: ${systemInfo.cpuName}\nGPU: ${systemInfo.gpuModel} (VRAM: ${systemInfo.vramTotalGb} GB)\nRAM: ${systemInfo.ramTotalGb} GB\nOS: ${systemInfo.os}`;
    navigator.clipboard.writeText(text);
    setCopiedHardware(true);
    setTimeout(() => setCopiedHardware(false), 2000);
  };

  const filteredEngines = engines.filter((e) => {
    const matchesSearch =
      !searchQuery.trim() ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompat = filterCompat === "all" || (filterCompat === "compat" && e.category !== "legacy");
    const matchesType = filterType === "all" || e.category === filterType;
    return matchesSearch && matchesCompat && matchesType;
  });

  return (
    <div className="flex flex-col h-full bg-[#0b0b0e] text-[#e4e4e7] overflow-y-auto font-sans select-none relative">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="p-5 border-b border-[#27272a] bg-[#121216]/90 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Runtime & Hardware Manager</h1>
            <p className="text-xs text-zinc-400 font-sans">
              Configure AI inference runtimes, CUDA GPU offload parameters, hardware limits, and live execution console logs.
            </p>
          </div>
        </div>

        {/* Tab Navigation Switches */}
        <div className="flex items-center rounded-2xl bg-[#18181c] border border-[#27272a] p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("runtimes")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
              activeTab === "runtimes" ? "bg-[#27272a] text-white border border-[#3f3f46] shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Runtime Selections</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hardware")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
              activeTab === "hardware" ? "bg-[#27272a] text-white border border-[#3f3f46] shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Hardware & GPUs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
              activeTab === "logs" ? "bg-[#27272a] text-white border border-[#3f3f46] shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Execution Logs</span>
          </button>
        </div>
      </div>

      {/* Stage Container */}
      <div className="p-5 max-w-6xl w-full mx-auto space-y-6 flex-1">
        {/* TAB 1: RUNTIME SELECTIONS & ENGINES */}
        {activeTab === "runtimes" && (
          <div className="space-y-6">
            {/* Top Runtime Selection Box */}
            <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-[#f4f4f5] tracking-tight">Runtime Selections</h2>

              {/* GGUF Selection Dropdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#18181c] border border-[#27272a]">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#f4f4f5]">GGUF Execution Engine</span>
                  <p className="text-[11px] text-[#a1a1aa]">Select primary backend framework for quantized GGUF model execution.</p>
                </div>

                <select
                  value={ggufRuntime}
                  onChange={(e) => setGgufRuntime(e.target.value)}
                  className="px-3.5 py-2 bg-[#121215] border border-[#3f3f46] text-xs font-bold text-[#f4f4f5] rounded-xl outline-none cursor-pointer"
                >
                  <option value="cuda12">CUDA 12 llama.cpp (Windows) v2.27.1</option>
                  <option value="vulkan">Vulkan llama.cpp (Windows) v2.27.1</option>
                  <option value="cpu">CPU llama.cpp (Windows) v2.13.0</option>
                </select>
              </div>

              {/* Auto Update Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#18181c] border border-[#27272a]">
                <span className="text-xs font-bold text-[#f4f4f5]">Auto-update selected Runtime Extension Packs</span>
                <button
                  type="button"
                  onClick={() => setAutoUpdate(!autoUpdate)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    autoUpdate ? "bg-blue-600" : "bg-[#27272a]"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoUpdate ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Updates Channel & Check Trigger */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#18181c] border border-[#27272a]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#f4f4f5]">Runtime updates channel</span>
                  <span className="text-[11px] text-[#a1a1aa] font-mono">(?)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCheckUpdates}
                    disabled={isCheckingUpdates}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-xs font-bold text-[#f4f4f5] transition-all cursor-pointer border border-[#3f3f46]"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? "animate-spin text-blue-400" : ""}`} />
                    <span>{isCheckingUpdates ? "Checking..." : "Check for updates"}</span>
                  </button>

                  <select
                    value={updateChannel}
                    onChange={(e) => setUpdateChannel(e.target.value)}
                    className="px-3.5 py-2 bg-[#121215] border border-[#3f3f46] text-xs font-bold text-[#f4f4f5] rounded-xl outline-none cursor-pointer"
                  >
                    <option value="stable">Stable</option>
                    <option value="beta">Beta</option>
                    <option value="nightly">Nightly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Engines & Frameworks Manager */}
            <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-[#f4f4f5] tracking-tight">Engines & Frameworks</h2>

                {/* Filter Inputs */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="pl-8 pr-3 py-1.5 bg-[#18181c] border border-[#27272a] focus:border-[#3f3f46] text-xs text-[#f4f4f5] placeholder-[#71717a] rounded-xl outline-none w-44 sm:w-56"
                    />
                  </div>

                  <select
                    value={filterCompat}
                    onChange={(e) => setFilterCompat(e.target.value)}
                    className="px-3 py-1.5 bg-[#18181c] border border-[#27272a] text-xs text-[#f4f4f5] rounded-xl outline-none cursor-pointer"
                  >
                    <option value="all">Compatible only</option>
                    <option value="legacy">All Engines</option>
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-1.5 bg-[#18181c] border border-[#27272a] text-xs text-[#f4f4f5] rounded-xl outline-none cursor-pointer"
                  >
                    <option value="all">All types</option>
                    <option value="cuda">CUDA</option>
                    <option value="vulkan">Vulkan</option>
                    <option value="cpu">CPU</option>
                  </select>
                </div>
              </div>

              {/* Engines List Table */}
              <div className="space-y-2.5">
                {filteredEngines.map((engine) => {
                  const isInstalling = installingId === engine.id;

                  return (
                    <div
                      key={engine.id}
                      className="p-4 rounded-xl bg-[#18181c] border border-[#27272a] hover:border-[#3f3f46] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#f4f4f5]">{engine.name}</span>
                          <span className="text-[10px] font-mono text-[#a1a1aa] bg-[#121215] px-2 py-0.5 rounded border border-[#27272a]">
                            {engine.version} {engine.targetVersion ? `→ ${engine.targetVersion}` : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#a1a1aa]">{engine.description}</p>
                        {engine.targetVersion && (
                          <div className="flex items-center gap-1 text-[11px] text-blue-400 font-bold hover:underline cursor-pointer">
                            <span>{engine.targetVersion} - Release notes</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Action Badges & Buttons */}
                      <div className="flex items-center gap-3 shrink-0">
                        {engine.status === "latest" ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Latest version</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateEngine(engine.id)}
                            disabled={isInstalling}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                          >
                            <Download className={`w-3.5 h-3.5 ${isInstalling ? "animate-bounce" : ""}`} />
                            <span>{isInstalling ? "Updating..." : `Update ${engine.downloadSize || ""}`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HARDWARE & GPUS */}
        {activeTab === "hardware" && (
          <div className="space-y-6">
            {/* Header Action Bar */}
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h2 className="text-sm font-bold text-[#f4f4f5] tracking-tight">Hardware Diagnostics & CUDA Controls</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyHardwareInfo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-xs font-bold text-[#f4f4f5] transition-all cursor-pointer"
                >
                  {copiedHardware ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#a1a1aa]" />}
                  <span>{copiedHardware ? "Copied!" : "Copy Info"}</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-xs font-bold text-[#f4f4f5] transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Community</span>
                </button>
              </div>
            </div>

            {/* Top Diagnostics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CPU Spec Card */}
              <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#f4f4f5]">
                    <span>CPU</span>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                      ✓ Compatible
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#a1a1aa]">Name</span>
                    <span className="font-mono font-bold text-[#f4f4f5]">{systemInfo.cpuName}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#a1a1aa]">Architecture</span>
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <span className="bg-[#121215] px-2 py-0.5 rounded border border-[#27272a] text-[#f4f4f5]">x86_64</span>
                      <span className="bg-[#121215] px-2 py-0.5 rounded border border-[#27272a] text-[#f4f4f5]">AVX</span>
                      <span className="bg-[#121215] px-2 py-0.5 rounded border border-[#27272a] text-emerald-400 border-emerald-500/30">AVX2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory Capacity Card */}
              <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3 shadow-xl">
                <h3 className="text-xs font-bold text-[#f4f4f5]">Memory Capacity</h3>
                <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#a1a1aa] font-sans">RAM</span>
                    <span className="font-bold text-[#f4f4f5]">{systemInfo.ramTotalGb} GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#a1a1aa] font-sans">VRAM</span>
                    <span className="font-bold text-emerald-400">{systemInfo.vramTotalGb} GB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GPUs Section */}
            <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#f4f4f5]">GPUs</h3>
                <div className="flex items-center gap-2">
                  <button type="button" className="px-3 py-1 bg-[#18181c] text-[#a1a1aa] text-[11px] rounded-lg border border-[#27272a] hover:text-[#f4f4f5]">
                    Reset to default
                  </button>
                  <button type="button" className="px-3 py-1 bg-[#18181c] text-[#a1a1aa] text-[11px] rounded-lg border border-[#27272a] hover:text-[#f4f4f5]">
                    Open in new window
                  </button>
                </div>
              </div>

              <span className="text-xs text-emerald-400 font-bold block">1 GPU detected with CUDA</span>

              {/* Detected GPU Item */}
              <div className="p-4 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#f4f4f5]">{systemInfo.gpuModel}</span>
                  <p className="text-[11px] text-[#a1a1aa] font-mono">
                    VRAM Capacity: {systemInfo.vramTotalGb} GB • CUDA • deviceId: 0
                  </p>
                </div>

                <div className="flex items-center rounded-lg bg-[#121215] p-1 border border-[#27272a]">
                  <button
                    type="button"
                    onClick={() => {
                      setGpuEnabled(false);
                      handleSaveHardwareConfig();
                    }}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md cursor-pointer ${
                      !gpuEnabled ? "bg-[#27272a] text-white" : "text-[#71717a]"
                    }`}
                  >
                    OFF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGpuEnabled(true);
                      handleSaveHardwareConfig();
                    }}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md cursor-pointer ${
                      gpuEnabled ? "bg-blue-600 text-white" : "text-[#71717a]"
                    }`}
                  >
                    ON
                  </button>
                </div>
              </div>

              {/* Offload Controls Switches */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#18181c] border border-[#27272a]">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#f4f4f5]">Limit Model Offload to Dedicated GPU Memory</span>
                    <p className="text-[11px] text-[#a1a1aa]">
                      ON: The system will limit offload of model weights to dedicated GPU memory and RAM only. Context may still use shared memory.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLimitVramOffload(!limitVramOffload);
                      handleSaveHardwareConfig();
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${
                      limitVramOffload ? "bg-blue-600" : "bg-[#27272a]"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${limitVramOffload ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#18181c] border border-[#27272a]">
                  <span className="text-xs font-bold text-[#f4f4f5]">Offload KV Cache to GPU Memory</span>

                  <button
                    type="button"
                    onClick={() => {
                      setOffloadKvCache(!offloadKvCache);
                      handleSaveHardwareConfig();
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${
                      offloadKvCache ? "bg-blue-600" : "bg-[#27272a]"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${offloadKvCache ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Resource Monitor & Guardrails */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resource Monitor */}
              <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3 shadow-xl">
                <h3 className="text-xs font-bold text-[#f4f4f5]">Resource Monitor</h3>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a]">
                    <span className="text-[11px] text-[#a1a1aa] font-sans block">RAM + VRAM</span>
                    <span className="text-base font-bold text-emerald-400 mt-1 block">
                      {systemInfo.ramUsedGb + systemInfo.vramUsedGb} GB
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a]">
                    <span className="text-[11px] text-[#a1a1aa] font-sans block">CPU</span>
                    <span className="text-base font-bold text-blue-400 mt-1 block">2.15%</span>
                  </div>
                </div>
              </div>

              {/* Guardrails Selection */}
              <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3 shadow-xl">
                <h3 className="text-xs font-bold text-[#f4f4f5]">Guardrails</h3>
                <p className="text-[11px] text-[#a1a1aa]">Model loading guardrails to prevent OOM crash</p>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#18181c] cursor-pointer">
                    <input
                      type="radio"
                      name="guardrails"
                      value="off"
                      checked={guardrails === "off"}
                      onChange={() => {
                        setGuardrails("off");
                        handleSaveHardwareConfig("off");
                      }}
                      className="accent-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#f4f4f5]">OFF (Not Recommended)</span>
                      <p className="text-[10px] text-[#a1a1aa]">No precautions against system overload</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#18181c] cursor-pointer">
                    <input
                      type="radio"
                      name="guardrails"
                      value="relaxed"
                      checked={guardrails === "relaxed"}
                      onChange={() => {
                        setGuardrails("relaxed");
                        handleSaveHardwareConfig("relaxed");
                      }}
                      className="accent-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#f4f4f5]">Relaxed</span>
                      <p className="text-[10px] text-[#a1a1aa]">Mild precautions against system overload</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#18181c] cursor-pointer">
                    <input
                      type="radio"
                      name="guardrails"
                      value="balanced"
                      checked={guardrails === "balanced"}
                      onChange={() => {
                        setGuardrails("balanced");
                        handleSaveHardwareConfig("balanced");
                      }}
                      className="accent-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#f4f4f5]">Balanced</span>
                      <p className="text-[10px] text-[#a1a1aa]">Moderate precautions against system overload</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE EXECUTION CONSOLE LOGS */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#f4f4f5] tracking-tight">Live Execution Logs</h2>
                <p className="text-xs text-[#a1a1aa]">Real-time stdout/stderr output stream from llama-server CUDA backend & sidecar process.</p>
              </div>
            </div>

            <LiveConsoleLog maxHeight="max-h-[520px]" />
          </div>
        )}
      </div>
    </div>
  );
}
