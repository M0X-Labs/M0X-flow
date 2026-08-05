import { Laptop, Cpu, Network, Wifi, Activity, ShieldCheck, HardDrive, Trash2, CheckCircle, XCircle } from "lucide-react";

export interface NodeInfo {
  id: string;
  hostname: string;
  deviceType: string;
  allocatedMemory: string;
  totalMemory: string;
  ramSize?: string;
  latencyMs: number;
  ipAddress: string;
  isHost?: boolean;
  assignedLayers?: string;
  status: "active font-mono" | "rebalancing" | "offline";
  modelSyncStatus?: "ready" | "missing" | "unknown";
}

interface NodeStatsCardProps {
  node: NodeInfo;
  onRemove?: (ip: string) => void;
}

/**
 * NodeStatsCard — Displays hardware stats for a connected P2P node in the Exo mesh graph.
 */
export function NodeStatsCard({ node, onRemove }: NodeStatsCardProps) {
  const cleanIp = node.ipAddress?.split(" ")[0] || "";

  return (
    <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 shadow-xl w-full sm:w-80">
      {/* Header Title */}
      <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#f4f4f5]">
            {node.isHost ? <Cpu className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-[#f4f4f5]">{node.hostname}</h4>
              {node.isHost && (
                <span className="text-[9px] font-mono font-bold text-[#f4f4f5] bg-[#18181c] px-1.5 py-0.5 rounded border border-[#27272a]">
                  HOST
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono text-[#71717a] block mt-0.5">{node.ipAddress}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#18181c] text-[#f4f4f5] border border-[#27272a]">
            <span className={`w-1.5 h-1.5 rounded-full ${node.status === "offline" ? "bg-red-500" : "bg-emerald-500"}`} />
            {node.status === "offline" ? "OFFLINE" : "ONLINE"}
          </span>
        </div>
      </div>

      {/* Hardware Specs List */}
      <div className="space-y-2.5 py-3 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-[#a1a1aa] flex items-center gap-2 font-medium">
            <Cpu className="w-3.5 h-3.5 text-[#71717a]" /> GPU Model
          </span>
          <span className="text-[#f4f4f5] font-bold truncate max-w-[160px] text-right font-mono">{node.deviceType}</span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#a1a1aa] flex items-center gap-2 font-medium">
              <Network className="w-3.5 h-3.5 text-[#71717a]" /> VRAM Contributed
            </span>
            <span className="font-mono text-[#f4f4f5] font-bold bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a]">
              {node.allocatedMemory} / {node.totalMemory}
            </span>
          </div>
          {/* Memory Progress Bar */}
          {(() => {
            const alloc = parseFloat(node.allocatedMemory) || 0;
            const total = parseFloat(node.totalMemory) || 16;
            const pct = Math.min(100, Math.max(0, (alloc / total) * 100));
            return (
              <div className="w-full bg-[#18181c] border border-[#27272a] h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            );
          })()}
        </div>

        {node.ramSize && (
          <div className="flex justify-between items-center">
            <span className="text-[#a1a1aa] flex items-center gap-2 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-[#71717a]" /> System RAM
            </span>
            <span className="font-mono text-[#f4f4f5] font-bold bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a]">
              {node.ramSize}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-[#a1a1aa] flex items-center gap-2 font-medium">
            <Wifi className="w-3.5 h-3.5 text-[#71717a]" /> Network Latency
          </span>
          <span className="font-mono text-[#f4f4f5] font-bold bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a]">
            {node.latencyMs} ms
          </span>
        </div>

        {/* Model Sync Status */}
        {node.modelSyncStatus && node.modelSyncStatus !== "unknown" && (
          <div className="flex justify-between items-center">
            <span className="text-[#a1a1aa] flex items-center gap-2 font-medium">
              {node.modelSyncStatus === "ready" ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              )}
              Model Sync
            </span>
            <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded border ${
              node.modelSyncStatus === "ready"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {node.modelSyncStatus === "ready" ? "DOWNLOADED ✓" : "NOT DOWNLOADED"}
            </span>
          </div>
        )}

        {node.assignedLayers && (
          <div className="flex justify-between items-center pt-2 border-t border-[#27272a]">
            <span className="text-[#a1a1aa] flex items-center gap-2 font-medium">
              <Activity className="w-3.5 h-3.5 text-[#71717a]" /> Assigned Layers
            </span>
            <span className="font-mono text-[#f4f4f5] font-bold bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a]">
              {node.assignedLayers}
            </span>
          </div>
        )}
      </div>

      {/* Footer: Encryption Badge + Remove Button */}
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-[#27272a]">
        <div className="flex items-center gap-2 text-[10px] text-[#71717a] font-sans">
          <ShieldCheck className="w-3.5 h-3.5 text-[#a1a1aa] shrink-0" />
          <span className="font-medium">m0x Exo UDP Encrypted Peer Mesh</span>
        </div>
        {!node.isHost && onRemove && cleanIp && (
          <button
            type="button"
            onClick={() => onRemove(cleanIp)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold transition-all cursor-pointer"
            title={`Remove peer ${cleanIp}`}
          >
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        )}
      </div>
    </div>
  );
}
