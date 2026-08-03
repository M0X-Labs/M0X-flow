import { useRef, useEffect } from "react";
import { Cpu, Network, Terminal, Zap } from "lucide-react";
import { MessageBubble, Message } from "./MessageBubble";
import { motion } from "framer-motion";

interface ChatWindowProps {
  messages: Message[];
  isGenerating?: boolean;
  onSelectStarter?: (promptText: string) => void;
}

const STARTER_PROMPTS = [
  {
    title: "Layer-by-Layer AirLLM",
    prompt: "How does AirLLM load a 70B parameter LLM into 4GB VRAM using layer-by-layer disk streaming?",
    icon: Cpu,
  },
  {
    title: "Exo P2P Pod Cluster",
    prompt: "Show me how Exo pools GPU VRAM across local Wi-Fi devices into a unified computing mesh.",
    icon: Network,
  },
  {
    title: "Code Inference & Refactoring",
    prompt: "Write a high-performance Python FastAPI endpoint with Server-Sent Events (SSE) streaming for LLM tokens.",
    icon: Terminal,
  },
];

/**
 * ChatWindow — Message list container with auto-scroll and welcome starter prompt cards.
 */
export function ChatWindow({ messages, isGenerating = false, onSelectStarter }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 select-text">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="w-14 h-14 rounded-2xl bg-[#141418] border border-[#27272a] flex items-center justify-center overflow-hidden mb-5"
          >
            <img src="/logo.png" alt="m0x-flow logo" className="w-full h-full object-contain" draggable={false} />
          </motion.div>

          <h1 className="text-xl font-bold text-[#f4f4f5] tracking-tight">
            m0x-flow AI Orchestrator
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-2 max-w-md leading-relaxed font-sans">
            Run 70B+ open-weight AI models locally on consumer GPUs via AirLLM layer-wise disk offloading or Exo P2P mesh cluster pooling.
          </p>

          {/* Starter Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8 w-full">
            {STARTER_PROMPTS.map((starter, i) => {
              const Icon = starter.icon;
              return (
                <button
                  key={i}
                  onClick={() => onSelectStarter?.(starter.prompt)}
                  className="flex flex-col text-left p-4 rounded-xl bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] hover:bg-[#18181c] group transition-all duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center mb-3 text-[#a1a1aa] group-hover:text-[#f4f4f5]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-[#f4f4f5] text-xs">
                    {starter.title}
                  </span>
                  <p className="text-[#71717a] group-hover:text-[#a1a1aa] mt-1.5 line-clamp-2 leading-relaxed text-[11px] font-sans">
                    {starter.prompt}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing / Generating Indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 my-4"
            >
              <div className="w-8 h-8 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#f4f4f5]">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-[#a1a1aa] font-mono">
                <span className="w-2 h-2 rounded-full bg-[#f4f4f5] animate-pulse" />
                <span className="text-[#f4f4f5] font-medium">Generating response...</span>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}


