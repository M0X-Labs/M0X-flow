import { useState, useEffect } from "react";
import { Minus, Square, X, BrainCircuit } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * TitleBar — Custom frameless Tauri window title bar.
 * Provides drag region, app title, sidecar status badge, and custom window controls.
 */
const appWindow = getCurrentWindow();

export function TitleBar() {
  const [sidecarStatus, setSidecarStatus] = useState<"connected" | "connecting" | "offline">("connected");

  useEffect(() => {
    // Poll sidecar status on port 14321
    const checkSidecar = async () => {
      try {
        const res = await fetch("http://localhost:14321/health", { method: "GET" }).catch(() => null);
        if (res && res.ok) {
          setSidecarStatus("connected");
        } else {
          setSidecarStatus("connecting");
        }
      } catch {
        setSidecarStatus("offline");
      }
    };

    checkSidecar();
    const interval = setInterval(checkSidecar, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await appWindow.minimize();
    } catch (err) {
      console.error("Failed to minimize window:", err);
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isMax = await appWindow.isMaximized();
      if (isMax) {
        await appWindow.unmaximize();
      } else {
        await appWindow.maximize();
      }
    } catch (err) {
      console.error("Failed to toggle maximize window:", err);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await appWindow.close();
    } catch (err) {
      console.error("Failed to close window:", err);
    }
  };

  return (
    <header className="flex items-center justify-between h-10 px-3.5 bg-[#0c0c0e] border-b border-[#27272a] select-none z-50 shrink-0">
      {/* App Branding - Draggable Region */}
      <div className="flex items-center gap-2.5 h-full cursor-default" data-tauri-drag-region>
        <div className="w-5.5 h-5.5 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#f4f4f5] pointer-events-none">
          <BrainCircuit className="w-3.5 h-3.5" />
        </div>

        <div className="flex items-baseline gap-2 pointer-events-none">
          <span className="text-xs font-bold text-[#f4f4f5] tracking-widest uppercase">
            m0x-flow
          </span>
          <span className="text-[10px] font-mono text-[#a1a1aa] bg-[#18181c] px-1.5 py-0.5 rounded border border-[#27272a]">
            v0.1.0
          </span>
        </div>
      </div>

      {/* Middle Spacer & Sidecar Status Indicator - Draggable Region */}
      <div className="flex-1 flex items-center justify-center h-full px-4 cursor-default" data-tauri-drag-region>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#141417] border border-[#27272a] text-[11px] pointer-events-none">
          <span className="relative flex h-2 w-2">
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                sidecarStatus === "connected"
                  ? "bg-emerald-500"
                  : sidecarStatus === "connecting"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
          </span>
          <span className="text-[#a1a1aa] font-medium">Sidecar:</span>
          <span className="font-mono text-[10px] font-bold text-[#f4f4f5]">
            {sidecarStatus === "connected" ? "ONLINE (14321)" : sidecarStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Custom Window Controls - NOT DRAGGABLE */}
      <div className="flex items-center gap-1 shrink-0 z-50">
        <button
          id="titlebar-minimize"
          type="button"
          onClick={handleMinimize}
          className="w-8 h-7 flex items-center justify-center rounded-lg hover:bg-[#1f1f24] active:bg-[#27272a] text-[#a1a1aa] hover:text-[#f4f4f5] transition-all cursor-pointer"
          aria-label="Minimize"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          id="titlebar-maximize"
          type="button"
          onClick={handleMaximize}
          className="w-8 h-7 flex items-center justify-center rounded-lg hover:bg-[#1f1f24] active:bg-[#27272a] text-[#a1a1aa] hover:text-[#f4f4f5] transition-all cursor-pointer"
          aria-label="Maximize"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          id="titlebar-close"
          type="button"
          onClick={handleClose}
          className="w-8 h-7 flex items-center justify-center rounded-lg hover:bg-red-600 active:bg-red-700 text-[#a1a1aa] hover:text-white transition-all cursor-pointer"
          aria-label="Close"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}

