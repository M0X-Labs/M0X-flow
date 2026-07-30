import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Handle,
  Position,
} from "@xyflow/react";
import { Cpu, Laptop } from "lucide-react";
import { NodeInfo } from "./NodeStatsCard";


interface TopologyCanvasProps {
  nodes: NodeInfo[];
  selectedNodeId?: string;
  onSelectNode?: (node: NodeInfo) => void;
}

// Custom Host Node Component
function HostNodeComponent({ data }: { data: { label: string; specs: string; memory: string; ram?: string; selected?: boolean } }) {
  return (
    <div
      className={`px-4 py-3 rounded-xl bg-[#121215] border text-left min-w-[220px] cursor-pointer transition-all duration-200 ${
        data.selected
          ? "border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40 scale-105"
          : "border-[#3f3f46] hover:border-[#71717a]"
      }`}
    >
      <Handle type="source" position={Position.Bottom} className="!bg-[#10b981] !w-3 !h-3 !border-2 !border-[#09090b]" />
      <Handle type="target" position={Position.Top} className="!bg-[#10b981] !w-3 !h-3 !border-2 !border-[#09090b]" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#f4f4f5] block leading-tight">{data.label}</span>
          <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold tracking-wider">PRIMARY HOST WORKSTATION</span>
        </div>
      </div>
      <div className="text-[11px] font-mono text-[#f4f4f5] font-bold mt-1">{data.specs}</div>
      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#a1a1aa]">
        <span className="bg-[#18181c] px-1.5 py-0.5 rounded border border-[#27272a] font-bold text-emerald-400">{data.memory}</span>
        {data.ram && <span className="bg-[#18181c] px-1.5 py-0.5 rounded border border-[#27272a] text-[#a1a1aa]">{data.ram}</span>}
      </div>
    </div>
  );
}

// Custom P2P Node Component
function PeerNodeComponent({ data }: { data: { label: string; specs: string; memory: string; ram?: string; ping: number; selected?: boolean } }) {
  return (
    <div
      className={`px-4 py-3 rounded-xl bg-[#121215] border text-left min-w-[210px] cursor-pointer transition-all duration-200 ${
        data.selected
          ? "border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40 scale-105"
          : "border-[#27272a] hover:border-[#3f3f46]"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#a1a1aa] !w-3 !h-3 !border-2 !border-[#09090b]" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#a1a1aa] !w-3 !h-3 !border-2 !border-[#09090b]" />
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#a1a1aa]">
            <Laptop className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-[#f4f4f5]">{data.label}</span>
        </div>
        <span className="text-[9px] font-mono text-[#a1a1aa] font-bold bg-[#18181c] px-1.5 py-0.5 rounded border border-[#27272a]">
          {data.ping}ms
        </span>
      </div>
      <div className="text-[11px] font-mono text-[#f4f4f5] font-semibold">{data.specs}</div>
      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#a1a1aa]">
        <span className="bg-[#18181c] px-1.5 py-0.5 rounded border border-[#27272a] font-bold text-emerald-400">{data.memory}</span>
        {data.ram && <span className="bg-[#18181c] px-1.5 py-0.5 rounded border border-[#27272a] text-[#a1a1aa]">{data.ram}</span>}
      </div>
    </div>
  );
}

const nodeTypes = {
  hostNode: HostNodeComponent,
  peerNode: PeerNodeComponent,
};

/**
 * TopologyCanvas — Interactive Node graph visualizer for the P2P Exo cluster using React Flow.
 */
export function TopologyCanvas({ nodes, selectedNodeId, onSelectNode }: TopologyCanvasProps) {
  // Convert NodeInfo to ReactFlow Nodes & Edges
  const flowNodes: Node[] = useMemo(() => {
    const peerNodes = nodes.filter((n) => !n.isHost);
    return nodes.map((node) => {
      const isHost = node.isHost;
      const isSelected = selectedNodeId === node.id;

      if (isHost) {
        return {
          id: node.id,
          type: "hostNode",
          position: { x: 320, y: 100 },
          data: {
            label: node.hostname,
            specs: node.deviceType,
            memory: `${node.allocatedMemory}/${node.totalMemory}`,
            ram: node.ramSize,
            ping: node.latencyMs,
            selected: isSelected,
            rawNode: node,
          },
        };
      }

      const peerIndex = peerNodes.findIndex((p) => p.id === node.id);
      const totalPeers = peerNodes.length;
      const spread = Math.PI * 0.8;
      const startAngle = Math.PI * 0.1;
      const angle = totalPeers === 1 ? Math.PI * 0.5 : startAngle + (peerIndex / (totalPeers - 1)) * spread;
      const radius = 240;

      const x = 320 + Math.cos(angle) * radius;
      const y = 100 + Math.sin(angle) * radius + 110;

      return {
        id: node.id,
        type: "peerNode",
        position: { x, y },
        data: {
          label: node.hostname,
          specs: node.deviceType,
          memory: `${node.allocatedMemory}/${node.totalMemory}`,
          ram: node.ramSize,
          ping: node.latencyMs,
          selected: isSelected,
          rawNode: node,
        },
      };
    });
  }, [nodes, selectedNodeId]);

  const flowEdges: Edge[] = useMemo(() => {
    const hostNode = nodes.find((n) => n.isHost);
    if (!hostNode) return [];

    return nodes
      .filter((n) => !n.isHost)
      .map((peer) => ({
        id: `edge-${hostNode.id}-${peer.id}`,
        source: hostNode.id,
        target: peer.id,
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "5,5" },
      }));
  }, [nodes]);

  return (
    <div className="flex-1 w-full h-full min-h-[450px] bg-[#09090b] relative">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          if (node.data.rawNode) {
            onSelectNode?.(node.data.rawNode as NodeInfo);
          }
        }}
        fitView
      >
        <Background color="#27272a" gap={24} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}



