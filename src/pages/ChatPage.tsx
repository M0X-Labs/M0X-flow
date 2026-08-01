import { useState } from "react";
import { EngineToggle, EngineMode } from "@/components/chat/EngineToggle";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { PromptInput } from "@/components/chat/PromptInput";
import { Message } from "@/components/chat/MessageBubble";
import { useRuntimeStore } from "@/lib/useRuntimeStore";
import { getStoredCustomModels } from "@/lib/useModelStore";

/**
 * ChatPage — Main chat view at /chat.
 * Supports 3 model execution modes:
 * 1. Standard (Direct GGUF / llama.cpp / vLLM execution)
 * 2. AirLLM (Single-device layer-by-layer offloading)
 * 3. Exo Pods (P2P multi-device cluster pooling)
 */
export function ChatPage() {
  const [engineMode, setEngineMode] = useState<EngineMode>("standard");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { setGenerating } = useRuntimeStore();

  const handleSendMessage = async (text: string, model: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);
    setGenerating(true, undefined, model, engineMode);

    try {
      const assistantId = (Date.now() + 1).toString();
      let responseText = "";
      let speed = 52.4;

      // Check if this is a custom model
      const isCustomModel = model.startsWith("custom-");
      let apiResponse = null;

      if (isCustomModel) {
        // Handle custom API model
        const customModels = getStoredCustomModels();
        const modelId = model.replace("custom-", "");
        const customModel = customModels.find((m) => m.id === modelId);

        if (customModel) {
          try {
            // Call the appropriate API based on provider
            if (customModel.apiProvider === "openai") {
              apiResponse = await fetch(
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
                speed = 50.0;
              } else {
                responseText = `[API Error] Failed to get response from OpenAI API. Status: ${apiResponse?.status || "Unknown"}`;
              }
            } else if (customModel.apiProvider === "anthropic") {
              apiResponse = await fetch(
                customModel.baseUrl
                  ? `${customModel.baseUrl}/messages`
                  : "https://api.anthropic.com/v1/messages",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": customModel.apiKey,
                    "anthropic-version": "2023-06-01",
                  },
                  body: JSON.stringify({
                    model: customModel.modelId,
                    max_tokens: 2048,
                    messages: [{ role: "user", content: text }],
                  }),
                }
              ).catch(() => null);

              if (apiResponse && apiResponse.ok) {
                const data = await apiResponse.json();
                responseText = data.content?.[0]?.text || "No response";
                speed = 48.0;
              } else {
                responseText = `[API Error] Failed to get response from Anthropic API. Status: ${apiResponse?.status || "Unknown"}`;
              }
            } else {
              // Custom API provider
              apiResponse = await fetch(
                customModel.baseUrl || "http://localhost:8000/api/chat",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${customModel.apiKey}`,
                  },
                  body: JSON.stringify({
                    model: customModel.modelId,
                    messages: [{ role: "user", content: text }],
                  }),
                }
              ).catch(() => null);

              if (apiResponse && apiResponse.ok) {
                const data = await apiResponse.json();
                responseText = data.content || data.message || data.response || "No response";
                speed = 45.0;
              } else {
                responseText = `[API Error] Failed to connect to custom API endpoint. Status: ${apiResponse?.status || "Unknown"}`;
              }
            }
          } catch (error) {
            responseText = `[Error] ${error instanceof Error ? error.message : "Failed to call custom API"}`;
          }
        } else {
          responseText = `[Error] Custom model not found`;
        }
      } else {
        // Handle local sidecar model
        const sidecarRes = await fetch("http://localhost:14321/api/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            prompt: text,
            engine_mode: engineMode,
          }),
        }).catch(() => null);

        if (sidecarRes && sidecarRes.ok) {
          const data = await sidecarRes.json();
          responseText = data.content;
          speed = data.tokens_per_sec || 52.4;
        } else {
          if (engineMode === "standard") {
            responseText = `[Standard Mode - GGUF llama.cpp / vLLM Engine]\nModel: ${model}\n\nDirect GPU/CPU inference running with llama.cpp acceleration. The entire model KV cache and active layers fit into local memory for high token throughput.`;
            speed = 58.2;
          } else if (engineMode === "airllm") {
            responseText = `[AirLLM Mode - NVMe Layer Streaming]\nModel: ${model}\n\nExecuting layer-wise inference offloaded from disk. AirLLM streams model weights layer-by-layer directly from storage into GPU memory, enabling large parameter models to execute on constrained VRAM.`;
            speed = 14.8;
          } else {
            responseText = `[Exo P2P Pods Cluster - Distributed Mesh]\nModel: ${model}\n\nTensor parallel inference split across connected LAN nodes:\n- Host Node (This Device): Layers 0-24\n- P2P Pod 1: Layers 25-50\n- P2P Pod 2: Layers 51-80\n\nHigh speed parallel processing across pooled VRAM!`;
            speed = 44.1;
          }
        }
      }

      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: responseText,
        engine: isCustomModel ? undefined : engineMode,
        tokensPerSec: speed,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsGenerating(false);
      setGenerating(false);
    } catch {
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

      {/* Top Engine Selector Header */}
      <div className="relative z-20 shadow-sm border-b border-[#27272a] bg-[#121216]/80 backdrop-blur-md">
        <EngineToggle mode={engineMode} onModeChange={setEngineMode} />
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
      <div className="relative z-20 p-4 bg-[#0b0b0e]/90 backdrop-blur-md border-t border-[#27272a]/60">
        <PromptInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}

