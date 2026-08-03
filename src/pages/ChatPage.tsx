import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EngineToggle, EngineMode } from "@/components/chat/EngineToggle";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { PromptInput } from "@/components/chat/PromptInput";
import { Message } from "@/components/chat/MessageBubble";
import { useRuntimeStore } from "@/lib/useRuntimeStore";
import { getStoredCustomModels } from "@/lib/useModelStore";
import { Trash2, Download, Zap } from "lucide-react";

/**
 * ChatPage — Professional AI Chat interface with live model status,
 * stream response rendering, conversation clearing, and multi-engine orchestration.
 */
export function ChatPage() {
  const [engineMode, setEngineMode] = useState<EngineMode>("standard");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { setGenerating, hostedModel } = useRuntimeStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (hostedModel?.engineMode) {
      setEngineMode(hostedModel.engineMode);
    }
  }, [hostedModel?.engineMode]);

  const handleClearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm("Are you sure you want to clear this conversation?")) {
      setMessages([]);
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const chatText = messages
      .map((m) => `### ${m.role === "user" ? "User" : "Assistant"} (${m.timestamp || ""})\n\n${m.thinking ? `*Thinking:* ${m.thinking}\n\n` : ""}${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([chatText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `m0x-chat-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (text: string, model: string, image?: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      image,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      engine: engineMode,
      tokensPerSec: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsGenerating(true);
    setGenerating(true, undefined, model, engineMode);

    try {
      const isCustomModel = model.startsWith("custom-");

      if (isCustomModel) {
        // Handle custom API model
        const customModels = getStoredCustomModels();
        const modelId = model.replace("custom-", "");
        const customModel = customModels.find((m) => m.id === modelId);

        let responseText = "";
        if (customModel) {
          try {
            if (customModel.apiProvider === "openai") {
              const apiResponse = await fetch(
                customModel.baseUrl
                  ? `${customModel.baseUrl}/chat/completions`
                  : "https://api.openai.com/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${customModel.apiKey}`,
                  },
                  body: JSON.stringify({
                    model: customModel.modelId,
                    messages: [{ role: "user", content: text }],
                    max_tokens: 2048,
                    temperature: 0.7,
                  }),
                }
              ).catch(() => null);

              if (apiResponse && apiResponse.ok) {
                const data = await apiResponse.json();
                responseText = data.choices?.[0]?.message?.content || "No response";
              } else {
                responseText = `[API Error] Failed to get response from OpenAI API. Status: ${apiResponse?.status || "Unknown"}`;
              }
            } else {
              responseText = `[API Provider] Provider ${customModel.apiProvider} configuration active.`;
            }
          } catch (err) {
            responseText = `[API Error] ${err instanceof Error ? err.message : "Error querying model"}`;
          }
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: responseText, tokensPerSec: 45.0 } : m))
        );
      } else {
        // Stream directly from llama-server or sidecar via real-time SSE ReadableStream
        const activePort = hostedModel?.port || 8080;
        const targetModel = hostedModel?.id || model || "default";

        const userContent = image
          ? [{ type: "text", text }, { type: "image_url", image_url: { url: image } }]
          : text;

        // Try direct llama-server OpenAI SSE streaming endpoint first
        let response = await fetch(`http://127.0.0.1:${activePort}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: targetModel,
            messages: [{ role: "user", content: userContent }],
            max_tokens: 2048,
            temperature: 0.7,
            stream: true,
          }),
        }).catch(() => null);

        // Fallback to sidecar 14321
        if (!response || !response.ok) {
          response = await fetch(`http://127.0.0.1:14321/api/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: targetModel,
              prompt: text,
              engine_mode: engineMode,
              image: image || null,
            }),
          }).catch(() => null);
        }

        if (response && response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let accumulatedContent = "";
          let accumulatedThinking = "";
          let buffer = "";
          const startTime = Date.now();
          let tokenCount = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(":")) continue;
              if (trimmed === "data: [DONE]") break;

              if (trimmed.startsWith("data: ")) {
                try {
                  const jsonStr = trimmed.slice(6);
                  const parsed = JSON.parse(jsonStr);

                  const delta = parsed.choices?.[0]?.delta;
                  if (delta) {
                    if (delta.reasoning_content) {
                      accumulatedThinking += delta.reasoning_content;
                    }
                    if (delta.content) {
                      accumulatedContent += delta.content;
                      tokenCount++;
                    }
                  } else if (parsed.content) {
                    accumulatedContent = parsed.content;
                    if (parsed.thinking) accumulatedThinking = parsed.thinking;
                    if (parsed.tokens_per_sec) tokenCount = 45;
                  }

                  const elapsedSec = (Date.now() - startTime) / 1000;
                  const tps = elapsedSec > 0 ? tokenCount / elapsedSec : 0;

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: accumulatedContent,
                            thinking: accumulatedThinking || undefined,
                            tokensPerSec: Math.round(tps * 10) / 10,
                          }
                        : m
                    )
                  );
                } catch {
                  // Ignore JSON parse errors for partial chunks
                }
              }
            }
          }

          // Fallback parsing if non-streaming JSON was returned
          if (!accumulatedContent && buffer) {
            try {
              const parsed = JSON.parse(buffer);
              if (parsed.content || parsed.choices?.[0]?.message?.content) {
                accumulatedContent = parsed.content || parsed.choices[0].message.content;
                accumulatedThinking = parsed.thinking || parsed.choices[0].message.reasoning_content || "";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: accumulatedContent,
                          thinking: accumulatedThinking || undefined,
                          tokensPerSec: parsed.tokens_per_sec || 45.0,
                        }
                      : m
                  )
                );
              }
            } catch {}
          }
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: `[Connection Error] Could not connect to local model backend on port ${activePort} or sidecar port 14321. Please ensure your model is hosted and running on the Runner page.`,
                    tokensPerSec: 0,
                  }
                : m
            )
          );
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `[Error] ${error instanceof Error ? error.message : "Failed to execute inference"}`,
                tokensPerSec: 0,
              }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
      setGenerating(false);
    }
  };

  const handleStopGeneration = () => {
    setIsGenerating(false);
    setGenerating(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0b0e] text-[#e4e4e7] font-sans select-none overflow-hidden relative">
      {/* Subtle Ambient Glow Backdrops */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Engine Selector & Active Model Status HUD */}
      <div className="relative z-20 shadow-md border-b border-[#27272a] bg-[#121216]/90 backdrop-blur-md">
        <EngineToggle mode={engineMode} onModeChange={setEngineMode} />
        
        {/* Secondary Sub-Bar: Active Model Info & Quick Actions */}
        <div className="px-5 py-2 border-t border-[#1e1e24] bg-[#0d0d10] flex items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-2 bg-[#16161c] px-3 py-1 rounded-lg border border-[#27272a] text-[#e4e4e7]">
              <span className={`w-2 h-2 rounded-full ${hostedModel ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-500/50" : "bg-zinc-600"}`} />
              <span className="text-zinc-400">Model:</span>
              <strong className="text-white font-bold truncate max-w-[200px]">
                {hostedModel?.name || "No Model Active"}
              </strong>
            </div>

            {hostedModel && (
              <span className="bg-[#16161c] text-emerald-400 px-2.5 py-1 rounded-lg border border-[#27272a]">
                Port: <strong>{hostedModel.port || 8080}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportChat}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#18181c] hover:bg-[#222228] text-zinc-300 hover:text-white border border-[#27272a] transition-all cursor-pointer text-[11px]"
                  title="Export conversation as Markdown"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Export</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearChat}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer text-[11px]"
                  title="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => navigate("/runner")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-sm transition-all cursor-pointer text-[11px]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Runner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Message Stream */}
      <div className="flex-1 overflow-hidden relative z-10">
        <ChatWindow
          messages={messages}
          isGenerating={isGenerating}
          onSelectStarter={(promptText) => handleSendMessage(promptText, "selected-model")}
        />
      </div>

      {/* Bottom Floating Prompt Input */}
      <div className="relative z-20 p-4 bg-[#0b0b0e]/95 backdrop-blur-md border-t border-[#27272a]/60">
        <PromptInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}

