import { useState } from "react";
import { User, Zap, Cpu, Network, Copy, Check, Terminal, Brain, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  thinking?: string;
  engine?: "standard" | "airllm" | "exo";
  tokensPerSec?: number;
  timestamp?: string;
}

interface MessageBubbleProps {
  message: Message;
}

function FormattedContent({ text }: { text: string }) {
  // Regex to split code blocks from regular text
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const content = part.slice(3, -3);
          const firstLineEnd = content.indexOf("\n");
          let language = "code";
          let code = content;

          if (firstLineEnd !== -1) {
            const possibleLang = content.slice(0, firstLineEnd).trim();
            if (possibleLang && !possibleLang.includes(" ")) {
              language = possibleLang;
              code = content.slice(firstLineEnd + 1);
            }
          }

          return <CodeSnippetBlock key={index} code={code.trim()} language={language} />;
        }

        if (!part.trim()) return null;

        return (
          <div key={index} className="whitespace-pre-wrap break-words leading-relaxed">
            {part}
          </div>
        );
      })}
    </div>
  );
}

function CodeSnippetBlock({ code, language }: { code: string; language: string }) {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[#27272a] bg-[#09090b] font-mono text-xs select-text">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#141418] border-b border-[#27272a] select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#a1a1aa]" />
          <span className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">{language}</span>
        </div>
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 text-[11px] text-[#a1a1aa] hover:text-[#f4f4f5] px-2 py-0.5 rounded hover:bg-[#1f1f24] transition-all cursor-pointer"
        >
          {copiedCode ? (
            <>
              <Check className="w-3 h-3 text-[#f4f4f5]" />
              <span className="text-[#f4f4f5] font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content View */}
      <div className="p-3.5 overflow-x-auto text-[#e4e4e7] leading-relaxed">
        <pre>{code}</pre>
      </div>
    </div>
  );
}

/**
 * ThinkingBlock — Collapsible reasoning/thinking section for assistant messages.
 */
function ThinkingBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3 rounded-xl border border-amber-500/20 bg-[#141208]/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3.5 py-2 text-[11px] text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer select-none"
      >
        <Brain className="w-3.5 h-3.5 shrink-0" />
        <span className="font-bold uppercase tracking-wider">Thinking</span>
        <ChevronDown
          className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-3.5 pb-3 text-xs text-[#a1a1aa] leading-relaxed whitespace-pre-wrap break-words border-t border-amber-500/10 pt-2.5">
          {text}
        </div>
      )}
    </div>
  );
}

/**
 * MessageBubble — Renders chat messages with role-based clean obsidian styling,
 * avatars, copy button, engine indicator badges, and token speed tags.
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex items-start gap-3 my-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border bg-[#141418] border-[#27272a] text-[#f4f4f5]`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-[#f4f4f5]" />
        ) : message.engine === "exo" ? (
          <Network className="w-4 h-4 text-[#a1a1aa]" />
        ) : message.engine === "airllm" ? (
          <Cpu className="w-4 h-4 text-[#a1a1aa]" />
        ) : (
          <Zap className="w-4 h-4 text-[#a1a1aa]" />
        )}
      </div>

      {/* Bubble Container */}
      <div className={`group relative max-w-[84%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {/* Header Metadata */}
        <div className="flex items-center gap-2 mb-1 text-[11px] text-[#71717a] font-mono">
          <span className="font-semibold text-[#a1a1aa]">
            {isUser
              ? "You"
              : message.engine === "exo"
              ? "Exo P2P Pods"
              : message.engine === "airllm"
              ? "AirLLM Layered"
              : "Standard GGUF"}
          </span>
          {message.tokensPerSec && (
            <span className="text-[#a1a1aa] bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a] font-mono text-[10px]">
              {message.tokensPerSec} tok/s
            </span>
          )}
          {message.timestamp && <span className="opacity-70">{message.timestamp}</span>}
        </div>

        {/* Bubble Text Card */}
        <div
          className={`relative rounded-xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-[#27272a] text-[#f4f4f5] border border-[#3f3f46] rounded-tr-xs font-medium"
              : "bg-[#121215] text-[#f4f4f5] border border-[#27272a] rounded-tl-xs"
          }`}
        >
          {!isUser && message.thinking && <ThinkingBlock text={message.thinking} />}

          {isUser && message.image && (
            <div className="mb-2.5">
              <img
                src={message.image}
                alt="user attachment"
                className="max-w-[280px] max-h-[240px] rounded-lg border border-[#3f3f46] object-contain select-none"
              />
            </div>
          )}

          {message.content && <FormattedContent text={message.content} />}

          {/* Action Overlay (Copy Message) */}
          {!isUser && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-150">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-[#18181c] border border-[#27272a] text-[#a1a1aa] hover:text-[#f4f4f5] transition-all cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#f4f4f5]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}



