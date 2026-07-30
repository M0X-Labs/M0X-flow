import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Boxes,
  Network,
  SlidersHorizontal,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
} from "lucide-react";

const navItems = [
  { to: "/chat", label: "Chat", icon: Bot, shortcut: "⌘1", description: "AI Conversation" },
  { to: "/runner", label: "Run Model", icon: PlayCircle, shortcut: "⌘0", description: "Model Engine Runner" },
  { to: "/hub", label: "Model Hub", icon: Boxes, shortcut: "⌘2", description: "Hugging Face LLMs" },
  { to: "/pods", label: "Exo Pods", icon: Network, shortcut: "⌘3", description: "P2P VRAM Cluster" },
  { to: "/settings", label: "Settings", icon: SlidersHorizontal, shortcut: "⌘4", description: "System Preferences" },
];


/**
 * Sidebar — Expandable/Collapsible navigation rail.
 * Animates smoothly between collapsed icon rail (68px) and expanded drawer (220px).
 */
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.nav
      initial={false}
      animate={{ width: isCollapsed ? 68 : 220 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="relative flex flex-col h-full bg-[#0c0c0e] border-r border-[#27272a] select-none z-40 shrink-0 overflow-hidden"
    >
      {/* Top Header & Toggle Trigger */}
      <div className="flex items-center justify-between h-12 px-3.5 border-b border-[#27272a] shrink-0">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="w-5.5 h-5.5 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#f4f4f5] shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-mono font-bold text-[#f4f4f5] tracking-wider uppercase truncate">
                Navigation
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#141418] hover:bg-[#1f1f24] border border-[#27272a] text-[#a1a1aa] hover:text-[#f4f4f5] transition-all cursor-pointer mx-auto sm:mx-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-[#f4f4f5]" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-[#a1a1aa]" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col gap-1.5 p-2.5 flex-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to === "/chat" && location.pathname === "/");

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative group flex items-center h-11 px-3 rounded-xl text-xs font-medium transition-all"
            >
              {/* Active Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActivePill"
                  className="absolute inset-0 rounded-xl bg-[#1d1d22] border border-[#3f3f46]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              {/* Left active line indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveLine"
                  className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-md bg-[#f4f4f5]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 shrink-0 transition-all duration-200 z-10 ${
                  isActive ? "text-[#f4f4f5]" : "text-[#71717a] group-hover:text-[#f4f4f5]"
                }`}
              />

              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-between flex-1 ml-3 z-10 overflow-hidden"
                  >
                    <div className="flex flex-col">
                      <span
                        className={`text-xs tracking-tight transition-colors truncate font-sans ${
                          isActive ? "text-white font-bold" : "text-[#a1a1aa] group-hover:text-[#f4f4f5]"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-[#71717a] bg-[#18181c] px-1.5 py-0.5 rounded border border-[#27272a] shrink-0 ml-2">
                      {item.shortcut}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tooltip Hover Overlay when Collapsed */}
              {isCollapsed && (
                <div className="absolute left-16 px-3 py-1.5 bg-[#141417] border border-[#27272a] text-[#f4f4f5] text-xs rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-50 flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-[10px] font-mono text-[#a1a1aa] bg-[#222226] px-1.5 py-0.5 rounded border border-[#27272a]">
                    {item.shortcut}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer System Status Banner */}
      <div className="p-3 border-t border-[#27272a] shrink-0">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#121215] border border-[#27272a]"
            >
              <div className="w-7 h-7 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#f4f4f5] shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[11px] font-bold text-[#f4f4f5] truncate">AirLLM & Exo</span>
                <span className="text-[9px] font-mono text-[#a1a1aa] flex items-center gap-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Cluster Active
                </span>
              </div>
            </motion.div>
          ) : (
            <div
              className="w-10 h-10 mx-auto rounded-xl bg-[#141417] border border-[#27272a] flex items-center justify-center text-[#f4f4f5] hover:border-[#3f3f46] transition-all cursor-pointer"
              title="AirLLM & Exo Cluster Active"
            >
              <Sparkles className="w-4 h-4 text-[#f4f4f5]" />
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}


