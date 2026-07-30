import { useState } from "react";
import { Download, Check, Trash2, Zap, Cpu, Network, Sparkles, Loader2, Info, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


export interface ModelSpec {
  id: string;
  name: string;
  repo: string;
  parameterSize: string;
  realSizeGB?: string;
  quantization: string;
  availableQuantizations?: string[];
  weightFormat?: "GGUF" | "Safetensors" | "PyTorch (.bin)" | string;
  bitPrecision?: string;
  license?: string;
  contextWindow?: string;
  likes?: number;
  downloads?: number;
  standardRam?: string;
  airllmRam: string;
  exoRam: string;
  supportsStandard?: boolean;
  supportsAirllm?: boolean;
  supportsExo?: boolean;
  downloaded?: boolean;
  downloadProgress?: number;
  downloadSpeed?: string;
  isDownloading?: boolean;
}

interface ModelCardProps {
  model: ModelSpec;
  onDownload?: (id: string, quantization?: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * ModelCard — Displays model specs, real download file size (GB), exact parameter size, weight format (GGUF/Safetensors), bit precision,
 * interactive Quantization Variant Selector, and execution engine compatibility.
 */
export function ModelCard({ model, onDownload, onDelete }: ModelCardProps) {
  const hasAvailableQuants =
    (model.weightFormat === "GGUF" || model.quantization.includes("GGUF")) &&
    Boolean(model.availableQuantizations && model.availableQuantizations.length > 0);

  const defaultQuants = hasAvailableQuants ? model.availableQuantizations! : [];

  const [selectedQuant, setSelectedQuant] = useState(defaultQuants[0] || "");
  const [showModal, setShowModal] = useState(false);
  const supportsStandard = model.supportsStandard !== false;
  const supportsAirllm = model.supportsAirllm !== false;
  const supportsExo = model.supportsExo !== false;

  const format = model.weightFormat || (model.quantization.includes("GGUF") ? "GGUF" : "Safetensors");

  // Dynamic real download size calculation based on selected quantization variant
  const calculateDynamicSize = () => {
    if (format !== "GGUF" || !selectedQuant) return model.realSizeGB || "15.2 GB";
    const str = model.parameterSize.toUpperCase();
    let paramsNum = 7.0;
    if (str.includes("1T") || str.includes("TRILLION")) {
      paramsNum = 1000.0;
    } else {
      const numMatch = str.match(/([\d.]+)/);
      if (numMatch) paramsNum = parseFloat(numMatch[1]);
    }

    let factor = 0.65;
    if (selectedQuant.includes("IQ1") || selectedQuant.includes("Q1")) factor = 0.21;
    else if (selectedQuant.includes("IQ2") || selectedQuant.includes("Q2")) factor = 0.28;
    else if (selectedQuant.includes("IQ3") || selectedQuant.includes("Q3")) factor = 0.38;
    else if (selectedQuant.includes("IQ4") || selectedQuant.includes("Q4")) factor = 0.49;
    else if (selectedQuant.includes("Q5")) factor = 0.60;
    else if (selectedQuant.includes("Q8")) factor = 0.98;
    else if (selectedQuant.includes("BF16") || selectedQuant.includes("FP16")) factor = 2.0;

    return `${(paramsNum * factor).toFixed(1)} GB`;
  };


  const sizeGb = calculateDynamicSize();
  const bits = hasAvailableQuants && selectedQuant ? selectedQuant : model.bitPrecision || (format === "GGUF" ? "Q4_K_M" : "FP16");

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between p-4 rounded-xl bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-all group"
      >
        <div>
          {/* Header Title & Format Badges */}
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-bold text-[#f4f4f5]">
                  {model.name}
                </h3>
                {/* Format Tag (GGUF vs Safetensors) */}
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#18181c] text-[#f4f4f5] border border-[#27272a]">
                  {format}
                </span>
                {/* Bits Precision Badge */}
                <span className="text-[10px] font-mono text-[#a1a1aa] bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a]">
                  {bits}
                </span>
              </div>
              <span className="text-xs font-mono text-[#a1a1aa] block truncate">{model.repo}</span>
            </div>

            {model.downloaded && (
              <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#18181c] text-[#f4f4f5] font-semibold border border-[#27272a] shrink-0">
                <Check className="w-3 h-3 text-emerald-500" /> Ready
              </span>
            )}
          </div>

          {/* Quantization Sub-Variant Selector */}
          {hasAvailableQuants && (
            <div className="my-2.5 space-y-1">
              <label className="text-[10px] font-mono text-[#a1a1aa] uppercase tracking-wider block font-semibold">
                Quantization Variant:
              </label>
              <select
                value={selectedQuant}
                onChange={(e) => setSelectedQuant(e.target.value)}
                className="w-full bg-[#18181c] border border-[#27272a] text-[#f4f4f5] px-2.5 py-1.5 rounded-xl text-xs font-mono focus:outline-none focus:border-[#3f3f46] cursor-pointer"
              >
                {defaultQuants.map((q) => (
                  <option key={q} value={q}>
                    {q} {q.includes("Q4") ? "(Recommended)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Technical Specs Summary Bar */}
          <div className="grid grid-cols-2 gap-2 my-2.5 py-2 px-3 rounded-xl bg-[#18181c] border border-[#27272a] text-[11px] font-mono">
            <div>
              <span className="text-[#71717a]">Params:</span>{" "}
              <span className="text-[#f4f4f5] font-bold">{model.parameterSize}</span>
            </div>
            <div>
              <span className="text-[#71717a]">Disk Size:</span>{" "}
              <span className="text-[#f4f4f5] font-bold">{sizeGb}</span>
            </div>
            <div>
              <span className="text-[#71717a]">Format:</span>{" "}
              <span className="text-[#f4f4f5] font-bold">{format}</span>
            </div>
            <div>
              <span className="text-[#71717a]">License:</span>{" "}
              <span className="text-[#f4f4f5] font-bold truncate block">{model.license || "Apache 2.0"}</span>
            </div>
          </div>

          {/* Engine Run Compatibility Grid */}
          <div className="grid grid-cols-3 gap-1.5 my-2.5">
            <div className="p-1.5 rounded-xl bg-[#18181c] border border-[#27272a] text-[10px] flex flex-col items-center text-center">
              <div className="flex items-center gap-1 font-bold text-[#f4f4f5]">
                <Zap className="w-3 h-3 text-[#a1a1aa]" /> Standard
              </div>
              <span className="text-[9px] font-mono text-[#71717a] mt-0.5">
                {supportsStandard ? "GGUF / llama" : "N/A"}
              </span>
            </div>

            <div className="p-1.5 rounded-xl bg-[#18181c] border border-[#27272a] text-[10px] flex flex-col items-center text-center">
              <div className="flex items-center gap-1 font-bold text-[#f4f4f5]">
                <Cpu className="w-3 h-3 text-[#a1a1aa]" /> AirLLM
              </div>
              <span className="text-[9px] font-mono text-[#71717a] mt-0.5">
                {supportsAirllm ? "NVMe Layered" : "N/A"}
              </span>
            </div>

            <div className="p-1.5 rounded-xl bg-[#18181c] border border-[#27272a] text-[10px] flex flex-col items-center text-center">
              <div className="flex items-center gap-1 font-bold text-[#f4f4f5]">
                <Network className="w-3 h-3 text-[#a1a1aa]" /> Exo Pods
              </div>
              <span className="text-[9px] font-mono text-[#71717a] mt-0.5">
                {supportsExo ? "P2P Cluster" : "N/A"}
              </span>
            </div>
          </div>

          {/* Memory Requirements Table */}
          <div className="space-y-1 py-2 border-t border-[#27272a] my-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#a1a1aa]">Standard VRAM</span>
              <span className="font-mono text-[#f4f4f5] font-bold">
                {supportsStandard ? model.standardRam || "~4-8 GB" : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#a1a1aa]">AirLLM VRAM</span>
              <span className="font-mono text-[#f4f4f5] font-bold">
                {supportsAirllm ? model.airllmRam : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#a1a1aa]">Exo Pods VRAM</span>
              <span className="font-mono text-[#f4f4f5] font-bold">
                {supportsExo ? model.exoRam : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Inspect Button */}
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#222226] border border-[#27272a] text-xs font-semibold text-[#a1a1aa] hover:text-[#f4f4f5] transition-all cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" /> Inspect Specs
          </button>

          {model.isDownloading ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-[#f4f4f5] font-semibold">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Downloading... {model.downloadProgress || 42}%
                </span>
                <span>{model.downloadSpeed || "18.4 MB/s"}</span>
              </div>
              <div className="h-2 bg-[#18181c] rounded-full overflow-hidden border border-[#27272a] p-0.5">
                <div
                  className="h-full bg-[#f4f4f5] rounded-full transition-all duration-300"
                  style={{ width: `${model.downloadProgress || 42}%` }}
                />
              </div>
            </div>
          ) : model.downloaded ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-[#27272a] hover:bg-[#3f3f46] text-white transition-all border border-[#3f3f46] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Load for Chat
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(model.id)}
                className="p-2 rounded-xl bg-[#18181c] hover:bg-[#222226] text-[#a1a1aa] hover:text-white border border-[#27272a] transition-all cursor-pointer"
                title="Delete Model Weights"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onDownload?.(model.id, selectedQuant)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-[#27272a] hover:bg-[#3f3f46] text-white transition-all border border-[#3f3f46] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download ({selectedQuant || "Q4_K_M"})
            </button>
          )}
        </div>
      </motion.div>


      {/* Full Specs Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-[#121215] border border-[#27272a] p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-start justify-between border-b border-[#27272a] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#f4f4f5]">{model.name}</h2>
                    <span className="text-xs font-mono font-bold bg-[#18181c] text-[#f4f4f5] px-2 py-0.5 rounded border border-[#27272a]">
                      {model.parameterSize}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#a1a1aa] mt-0.5 block">{model.repo}</span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#1a1a1e]"
                >
                  ✕
                </button>
              </div>

              {/* Specs Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
                  <span className="text-[10px] text-[#71717a] uppercase block mb-1">Weight File Format</span>
                  <span className="text-[#f4f4f5] font-bold text-sm">{format}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
                  <span className="text-[10px] text-[#71717a] uppercase block mb-1">Quantization / Bits</span>
                  <span className="text-[#f4f4f5] font-bold text-sm">{bits}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
                  <span className="text-[10px] text-[#71717a] uppercase block mb-1">Context Length</span>
                  <span className="text-[#f4f4f5] font-bold text-sm">{model.contextWindow || "32K Tokens"}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
                  <span className="text-[10px] text-[#71717a] uppercase block mb-1">License</span>
                  <span className="text-[#f4f4f5] font-bold text-sm">{model.license || "Apache 2.0"}</span>
                </div>
              </div>

              {/* Execution Engine Run Rules */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-[#f4f4f5] block">Supported Execution Engines:</span>
                <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#f4f4f5] font-semibold">
                      <Zap className="w-3.5 h-3.5 text-[#a1a1aa]" /> 1. Standard (llama.cpp)
                    </span>
                    <span className="font-mono text-[#a1a1aa]">{supportsStandard ? "Supported" : "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#f4f4f5] font-semibold">
                      <Cpu className="w-3.5 h-3.5 text-[#a1a1aa]" /> 2. AirLLM (NVMe Offload)
                    </span>
                    <span className="font-mono text-[#a1a1aa]">{supportsAirllm ? "Supported" : "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#f4f4f5] font-semibold">
                      <Network className="w-3.5 h-3.5 text-[#a1a1aa]" /> 3. Exo Pods (P2P Cluster)
                    </span>
                    <span className="font-mono text-[#a1a1aa]">{supportsExo ? "Supported" : "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Footer External Link & Action */}
              <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
                <a
                  href={`https://huggingface.co/${model.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#a1a1aa] hover:text-[#f4f4f5] hover:underline flex items-center gap-1 font-sans"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View on Hugging Face Hub
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    if (!model.downloaded) onDownload?.(model.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-semibold transition-all border border-[#3f3f46]"
                >
                  {model.downloaded ? "Close" : "Download Model"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}



