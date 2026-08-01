import { useState, useEffect, useCallback, useMemo } from "react";
import { Network, RefreshCw, Plus, Zap, Play, Square, Server, X, Loader2 } from "lucide-react";
import { TopologyCanvas } from "@/components/pods/TopologyCanvas";
import { NodeStatsCard, NodeInfo } from "@/components/pods/NodeStatsCard";
import { useRuntimeStore } from "@/lib/useRuntimeStore";
import { useModelStore } from "@/lib/useModelStore";

/**
 * PodsPage — Pods Topology Visualizer at /pods.
 * Discovers and renders REAL devices available on local LAN & Wi-Fi network using sidecar APIs.
 */
const LOCAL_STORAGE_PODS_KEY = "m0x_pods_enabled_preference";

function PodsSkeletonCanvas() {
  return (
    <div className="flex-1 w-full h-full flex items-center justify-center p-8 bg-[#09090b] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-xl">
        <div className="w-72 p-4 rounded-2xl bg-[#121215] border border-[#27272a] animate-pulse space-y-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#18181c] border border-[#27272a]" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-[#27272a] rounded w-32" />
              <div className="h-2.5 bg-[#18181c] rounded w-20" />
            </div>
          </div>
          <div className="h-4 bg-[#27272a] rounded w-44" />
          <div className="h-3 bg-[#18181c] rounded w-28" />
        </div>

        <div className="w-0.5 h-10 bg-emerald-500/20 animate-pulse" />

        <div className="flex items-center gap-4 flex-wrap justify-center w-full">
          <div className="w-56 p-3.5 rounded-xl bg-[#121215] border border-[#27272a] animate-pulse space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#18181c]" />
              <div className="h-3 bg-[#27272a] rounded w-24" />
            </div>
            <div className="h-3 bg-[#18181c] rounded w-36" />
          </div>
          <div className="w-56 p-3.5 rounded-xl bg-[#121215] border border-[#27272a] animate-pulse space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#18181c]" />
              <div className="h-3 bg-[#27272a] rounded w-24" />
            </div>
            <div className="h-3 bg-[#18181c] rounded w-36" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#a1a1aa] bg-[#121215] px-4 py-2 rounded-xl border border-[#27272a]">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Detecting real GPU & system hardware metrics...</span>
        </div>
      </div>
    </div>
  );
}

export function PodsPage() {
  const { hostedModel, hostModel, unhostModel } = useRuntimeStore();
  const { downloadedModels } = useModelStore();

  const [realNodes, setRealNodes] = useState<NodeInfo[]>([]);
  const [podsEnabled, setPodsEnabled] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_PODS_KEY) === "true";
  });
  const [loading, setLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);
  const [showPeerModal, setShowPeerModal] = useState(false);
  const [customIp, setCustomIp] = useState("");
  const [connectingPeer, setConnectingPeer] = useState(false);
  const [peerError, setPeerError] = useState<string | null>(null);

  const isExoHosted = Boolean(hostedModel && hostedModel.id);

  // Fetch real LAN devices from backend sidecar API
  const fetchRealLanNodes = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch("http://localhost:14321/api/pods/nodes", {
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);
      if (res && res.ok) {
        const data = await res.json();
        if (data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
          setRealNodes(data.nodes);
        }
        if (typeof data.pods_enabled === "boolean") {
          setPodsEnabled(data.pods_enabled);
          localStorage.setItem(LOCAL_STORAGE_PODS_KEY, String(data.pods_enabled));
        }
      }
    } catch {
      // keep
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTogglePodsConfig = async () => {
    const nextState = !podsEnabled;
    setPodsEnabled(nextState);
    localStorage.setItem(LOCAL_STORAGE_PODS_KEY, String(nextState));

    try {
      await fetch("http://localhost:14321/api/pods/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pods_enabled: nextState }),
      });
      await fetchRealLanNodes();
    } catch {
      // fallback
    }
  };

  const handleRescanNetwork = async () => {
    setRescanning(true);
    try {
      const res = await fetch("http://localhost:14321/api/pods/rescan", { method: "POST" }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
          setRealNodes(data.nodes);
        }
        if (typeof data.pods_enabled === "boolean") {
          setPodsEnabled(data.pods_enabled);
        }
      }
    } catch {
      // keep
    } finally {
      setRescanning(false);
    }
  };

  const handleConnectPeer = async () => {
    if (!customIp.trim()) return;
    setConnectingPeer(true);
    setPeerError(null);
    try {
      const res = await fetch("http://localhost:14321/api/pods/connect-peer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip_address: customIp.trim() }),
      }).catch(() => null);

      if (!res || !res.ok) {
        const data = res ? await res.json().catch(() => null) : null;
        const msg = data?.detail || `Could not verify m0x-flow software on ${customIp}. Check IP address & port 14321.`;
        setPeerError(msg);
        return;
      }

      await fetchRealLanNodes();
      setCustomIp("");
      setShowPeerModal(false);
    } catch {
      setPeerError(`Network failure probing ${customIp}.`);
    } finally {
      setConnectingPeer(false);
    }
  };

  useEffect(() => {
    fetchRealLanNodes();
    const interval = setInterval(fetchRealLanNodes, 4000);
    return () => clearInterval(interval);
  }, [fetchRealLanNodes]);

  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null);

  // Map nodes to reflect active vs standby VRAM allocation
  const displayNodes = useMemo(() => {
    return realNodes.map((node) => ({
      ...node,
      allocatedMemory: isExoHosted ? node.allocatedMemory : "0.0 GB",
      assignedLayers: isExoHosted ? node.assignedLayers : "Standby (No Model Hosted)",
    }));
  }, [realNodes, isExoHosted]);

  const currentSelectedNode = selectedNode
    ? displayNodes.find((n: NodeInfo) => n.id === selectedNode.id) || displayNodes[0]
    : displayNodes[0];

  const totalVramPool = displayNodes.reduce((acc: number, n: NodeInfo) => acc + (parseFloat(n.totalMemory) || 0), 0);
  const allocatedVramPool = isExoHosted
    ? displayNodes.reduce((acc: number, n: NodeInfo) => acc + (parseFloat(n.allocatedMemory) || 0), 0)
    : 0;

  const availableModelsToHost = downloadedModels.map((m) => ({ id: m.id, name: m.name }));

  const handleSelectHostModel = (model: { id: string; name: string }) => {
    hostModel(model.id, model.name, "exo");
    setShowHostModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0b0e] text-[#e4e4e7] overflow-hidden relative select-none">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="p-5 border-b border-[#27272a] bg-[#121216]/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-20 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <Network className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Exo P2P Pods Topology
              </h1>
              {isExoHosted ? (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                  HOSTING: {hostedModel?.name}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#18181c] text-zinc-400 border border-[#27272a]">
                  STANDBY (NO MODEL HOSTED)
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Real peer-to-peer hardware mesh pooling GPU memory across local network nodes.
          </p>
        </div>

        {/* Action Controls & Cluster Metric */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Pods Enabled Toggle Button */}
          <button
            type="button"
            onClick={handleTogglePodsConfig}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              podsEnabled
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-[#18181c] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-[#f4f4f5]"
            }`}
            title="Click to enable/disable Pods discovery on your local network"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${podsEnabled ? "bg-emerald-400 animate-pulse" : "bg-[#52525b]"}`} />
            <span>{podsEnabled ? "Pods Sharing: ENABLED" : "Pods Sharing: DISABLED"}</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#18181c] border border-[#27272a] text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span className="text-[#a1a1aa] font-medium font-sans">Pooled Memory:</span>
            {loading ? (
              <div className="w-16 h-4 bg-[#27272a] rounded animate-pulse" />
            ) : (
              <span className="text-[#f4f4f5] font-bold">
                {allocatedVramPool.toFixed(1)} / {totalVramPool.toFixed(0)} GB
              </span>
            )}
          </div>

          {isExoHosted ? (
            <button
              type="button"
              onClick={() => unhostModel()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" /> Un-host Model
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowHostModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all border border-emerald-500 cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Host Model on Exo
            </button>
          )}

          <button
            type="button"
            onClick={handleRescanNetwork}
            disabled={rescanning || !podsEnabled}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-xs font-bold text-[#f4f4f5] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#a1a1aa] ${rescanning ? "animate-spin" : ""}`} /> Rescan LAN
          </button>

          <button
            type="button"
            onClick={() => setShowPeerModal(true)}
            disabled={!podsEnabled}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold transition-all border border-[#3f3f46] cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Connect IP Peer
          </button>
        </div>
      </div>

      {/* Pods Disabled Banner */}
      {!podsEnabled && (
        <div className="bg-[#18181c] border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-200/90 shrink-0">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              🔒 <strong>Exo P2P Pods Sharing is DISABLED by default.</strong> Enable Pods sharing to allow other computers on your network to discover this device and share VRAM.
            </span>
          </div>
          <button
            type="button"
            onClick={handleTogglePodsConfig}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
          >
            Enable Pods Sharing
          </button>
        </div>
      )}

      {/* Standby Banner if no model hosted */}
      {!isExoHosted && !loading && (
        <div className="bg-[#121215] border-b border-[#27272a] px-4 py-2 flex items-center justify-between text-xs text-[#a1a1aa]">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#71717a]" />
            <span>
              Cluster is in <strong>Standby</strong> ({realNodes.length} real device{realNodes.length === 1 ? "" : "s"} discovered on LAN). Click <strong>"Host Model on Exo"</strong> to initialize distributed VRAM pooling.
            </span>
          </div>
        </div>
      )}

      {/* Main Canvas & Inspector View */}
      <div className="flex-1 relative flex overflow-hidden">
        {loading || displayNodes.length === 0 ? (
          <PodsSkeletonCanvas />
        ) : (
          <>
            <TopologyCanvas
              nodes={displayNodes}
              selectedNodeId={currentSelectedNode?.id}
              onSelectNode={(node) => setSelectedNode(node)}
            />

            {/* Hover / Selected Node Inspector Panel */}
            {currentSelectedNode && (
              <div className="absolute right-4 top-4 z-20">
                <NodeStatsCard node={currentSelectedNode} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Connect IP Peer Modal */}
      {showPeerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-[#f4f4f5]">Connect Custom LAN IP Peer</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPeerModal(false)}
                className="text-[#a1a1aa] hover:text-white p-1 rounded-lg hover:bg-[#18181c]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#a1a1aa]">
              Enter the IP address of another computer, laptop, or GPU rig running m0x-flow software (with Pods enabled) to pair into the Exo cluster mesh.
            </p>

            {peerError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
                ⚠️ {peerError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-[#a1a1aa] uppercase font-bold">LAN IP Address</label>
              <input
                type="text"
                placeholder="e.g. 192.168.1.142"
                value={customIp}
                onChange={(e) => {
                  setCustomIp(e.target.value);
                  setPeerError(null);
                }}
                className="w-full bg-[#18181c] border border-[#27272a] text-[#f4f4f5] px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-[#3f3f46]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPeerModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18181c] hover:bg-[#222226] text-xs font-bold text-[#a1a1aa] border border-[#27272a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnectPeer}
                disabled={connectingPeer || !customIp.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all border border-emerald-500 flex items-center gap-1.5 cursor-pointer"
              >
                {connectingPeer && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Connect & Ping Peer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Host Model Selection Modal */}
      {showHostModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-[#f4f4f5]">Host Model on Exo Pods</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHostModal(false)}
                className="text-[#a1a1aa] hover:text-white p-1 rounded-lg hover:bg-[#18181c]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#a1a1aa]">
              Select a downloaded model to host across discovered local LAN network nodes.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {availableModelsToHost.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#18181c] border border-[#27272a] text-center text-xs text-[#a1a1aa]">
                  No downloaded models found. Download a model from Model Hub first.
                </div>
              ) : (
                availableModelsToHost.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelectHostModel(model)}
                    className="w-full text-left p-3 rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] hover:border-[#3f3f46] transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#f4f4f5] group-hover:text-emerald-400 transition-colors">
                        {model.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#71717a] mt-0.5">{model.id}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Host Model
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHostModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18181c] hover:bg-[#222226] text-xs font-bold text-[#a1a1aa] border border-[#27272a]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


