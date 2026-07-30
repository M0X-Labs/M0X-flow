import { useState } from "react";
import { Settings, HardDrive, Network, Cpu, Check, RefreshCw, ShieldAlert, FolderOpen } from "lucide-react";

/**
 * SettingsPage — System Settings at /settings.
 * Provides controls for model storage paths, sidecar API port, Exo network parameters, and diagnostics.
 */
export function SettingsPage() {
  const [modelDir, setModelDir] = useState("C:\\Users\\xlyre_bk3u4vp\\.m0x-flow\\models");
  const [sidecarPort, setSidecarPort] = useState("14321");
  const [exoPort, setExoPort] = useState("5678");
  const [manualPeer, setManualPeer] = useState("");
  const [saved, setSaved] = useState(false);
  const [testingSidecar, setTestingSidecar] = useState(false);
  const [sidecarResult, setSidecarResult] = useState<string | null>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTestSidecar = async () => {
    setTestingSidecar(true);
    setSidecarResult(null);
    try {
      const res = await fetch(`http://localhost:${sidecarPort}/health`).catch(() => null);
      if (res && res.ok) {
        setSidecarResult("Connected (FastAPI Sidecar Healthy)");
      } else {
        setSidecarResult("Sidecar non-responsive on port " + sidecarPort);
      }
    } catch {
      setSidecarResult("Connection refused");
    } finally {
      setTestingSidecar(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto bg-[#09090b]">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#f4f4f5]">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-[#f4f4f5] tracking-tight">
              System Preferences
            </h1>
          </div>
          <p className="text-xs text-[#a1a1aa] mt-1 font-sans">
            Configure m0x-flow engine parameters, model storage locations, and local sidecar ports.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold transition-all border border-[#3f3f46] cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{saved ? "Preferences Saved!" : "Save Changes"}</span>
        </button>
      </div>

      {/* Storage Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#a1a1aa]" /> Storage Settings
        </h2>
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 font-sans">
              LLM Model Weights Directory (Safetensors / GGUF)
            </label>
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={modelDir}
                onChange={(e) => setModelDir(e.target.value)}
                className="flex-1 bg-[#18181c] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-xl border border-[#27272a] focus:outline-none focus:border-[#3f3f46] transition-all"
              />
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-[#f4f4f5] transition-all cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#a1a1aa]" /> Browse
              </button>
            </div>
            <p className="text-[11px] text-[#71717a] mt-2 font-sans">
              Downloaded Hugging Face model checkpoints are streamed layer-by-layer directly from this folder into AirLLM.
            </p>
          </div>
        </div>
      </section>

      {/* Sidecar Python API Engine */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#a1a1aa]" /> Python Sidecar Backend Process
        </h2>
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 font-sans">
              Local FastAPI Server Port
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={sidecarPort}
                onChange={(e) => setSidecarPort(e.target.value)}
                className="bg-[#18181c] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-xl border border-[#27272a] w-36 focus:outline-none focus:border-[#3f3f46] transition-all font-bold"
              />
              <button
                type="button"
                onClick={handleTestSidecar}
                disabled={testingSidecar}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-[#f4f4f5] transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#a1a1aa] ${testingSidecar ? "animate-spin" : ""}`} />
                Test Connection
              </button>
              {sidecarResult && (
                <span className="text-xs font-mono text-[#f4f4f5] font-bold bg-[#18181c] px-2.5 py-1 rounded-xl border border-[#27272a]">
                  {sidecarResult}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Network & Exo Pods Cluster */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
          <Network className="w-4 h-4 text-[#a1a1aa]" /> Exo Pods P2P Networking
        </h2>
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 font-sans">
                UDP Broadcast Discovery Port
              </label>
              <input
                type="text"
                value={exoPort}
                onChange={(e) => setExoPort(e.target.value)}
                className="bg-[#18181c] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-xl border border-[#27272a] w-full focus:outline-none focus:border-[#3f3f46] transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 font-sans">
                Manual Peer IP Override (Tailscale / VPN)
              </label>
              <input
                type="text"
                value={manualPeer}
                onChange={(e) => setManualPeer(e.target.value)}
                placeholder="e.g. 100.64.0.15"
                className="bg-[#18181c] text-xs text-[#f4f4f5] font-mono px-3.5 py-2 rounded-xl border border-[#27272a] w-full placeholder-[#71717a] focus:outline-none focus:border-[#3f3f46] transition-all font-bold"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Diagnostic Logs Section */}
      <section className="space-y-3 pb-8">
        <h2 className="text-xs font-mono font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#a1a1aa]" /> System Diagnostics
        </h2>
        <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-4 font-mono text-[11px] text-[#a1a1aa] space-y-1.5">
          <div className="flex items-center gap-2"><span className="text-[#f4f4f5] font-bold">[INFO]</span> <span>[m0x-flow] Native window initialized (Tauri v2 OS shell)</span></div>
          <div className="flex items-center gap-2"><span className="text-[#f4f4f5] font-bold">[INFO]</span> <span>[m0x-flow] Python sidecar spawned on http://localhost:14321</span></div>
          <div className="flex items-center gap-2"><span className="text-[#f4f4f5] font-bold">[INFO]</span> <span>[AirLLM] Offloading engine ready for 70B layer-by-layer streaming</span></div>
          <div className="flex items-center gap-2"><span className="text-[#f4f4f5] font-bold">[INFO]</span> <span>[Exo P2P] Listening for UDP discovery broadcasts on port 5678</span></div>
        </div>
      </section>
    </div>
  );
}


