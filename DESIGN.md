# UI/UX Specification & Design System: m0x-flow

**Project:** m0x-flow  
**Author:** m0x-labs  
**Target Framework:** Tauri + React + TypeScript + Tailwind CSS + Shadcn/ui

---

# 1. Aesthetic & Design System

## A. Theme Philosophy

m0x-flow uses a **Monochromatic Obsidian** dark theme with high-contrast electric accents. The design priority is **clarity at a glance**, avoiding heavy background gradients to ensure maximum responsiveness and zero cognitive overhead.

## B. Color Palette

```css
/* Core Surfaces */
--bg-app: #09090b;           /* Deepest Obsidian (App Background) */
--bg-surface: #121215;       /* Surface Card Background */
--bg-surface-hover: #1a1a1e; /* Interactive Hover State */
--border-subtle: #27272a;    /* Structural Borders */

/* Accents */
--accent-primary: #3b82f6;   /* Electric Blue (Primary Actions, Active Engine) */
--accent-success: #10b981;   /* Cyber Emerald (Connected Pods / System Healthy) */
--accent-warning: #f59e0b;   /* Amber (AirLLM Slow Mode / Rebalancing) */
--accent-danger: #ef4444;    /* Crimson (Disconnections / Memory Overflows) */

/* Typography */
--text-primary: #f4f4f5;     /* Stark White (Headers / Main Text) */
--text-secondary: #a1a1aa;   /* Muted Silver (Subtext / Metadata) */
--text-code: #60a5fa;        /* Monospace Highlight */
```

## C. Typography & Window Styling

**Primary Font:** Inter or Geist Sans

**Code/Terminal Font:** JetBrains Mono or Geist Mono

**Framing:** Frameless native window (`titleBarStyle: overlay`) with custom window control buttons (Close, Minimize, Maximize) integrated into the top bar.

---

# 2. Layout Structure

```text
+-----------------------------------------------------------------------+
| Window Topbar: m0x-flow v0.1 | Status Indicator |  _  □  ✕            |
+--------------+--------------------------------------------------------+
|              |                                                        |
|  NAVIGATION  |                    MAIN STAGE                          |
|   SIDEBAR    |                                                        |
|              |  (Chat Interface / Model Hub / Pods Graph / Settings)  |
|  - Chat      |                                                        |
|  - Hub       |                                                        |
|  - Pods      |                                                        |
|  - Settings  |                                                        |
|              +--------------------------------------------------------+
|              | HARDWARE HUD OVERLAY (Tokens/sec | VRAM Usage)         |
+--------------+--------------------------------------------------------+
```

---

# 3. Screen Specifications

## Screen A: Main Chat View (`/chat`)

**Engine Switcher Bar:** Top-centered pill control:

```text
[ AirLLM Mode (Single Device) ] | [ Exo Pods (Cluster Mode) ]
```

**Chat Stream:** Auto-scrolling transcript window.

**Input Box:** Floating bottom box with integrated:

- Attachment icon
- Prompt history
- Stop generation button
- Real-time token rate overlay

---

## Screen B: Model Hub (`/hub`)

**Header Bar:** Displays total local storage consumed vs. total disk capacity.

Example:

```text
124 GB / 1 TB Used
```

**Model Cards (Grid):**

- Model Title & Parameter Size (e.g., Llama 3 70B)
- Required RAM for AirLLM mode vs Exo Pods mode
- One-Click Download button
- Dynamic progress bar

Example:

```text
Downloading... 42% @ 18 MB/s
```

---

## Screen C: Pods Topology Visualizer (`/pods`)

**Interactive Canvas (React Flow / Canvas API):**

- Central node = Current Host Device
- Outer nodes = Discovered P2P devices on the local network (via Exo)
- Connecting lines animate with directional pulses representing data tensor flow during inference

**Node Information Panel (Sidebar):**

- Hostname / Device Type (e.g., MacBook Pro M3 Max)
- Allocated Memory Pool (e.g., 36 GB / 48 GB)
- Network Latency / Ping (< 2ms)

---

## Screen D: System Settings (`/settings`)

- Storage directory selector (`~/.m0x-flow/models`)
- Custom UDP Broadcast Port configuration for Exo
- Manual IP Peer Connection override for VPN/Tailscale usage

---

# 4. Component Tree Structure (React)

```text
src/
├── components/
│   ├── layout/
│   │   ├── TitleBar.tsx          # Custom Tauri Window Titlebar
│   │   ├── Sidebar.tsx           # Navigation bar
│   │   └── HardwareHud.tsx       # Floating VRAM/Token Speed HUD
│   ├── chat/
│   │   ├── ChatWindow.tsx        # Message list container
│   │   ├── MessageBubble.tsx     # Markdown & Code syntax renderer
│   │   ├── EngineToggle.tsx      # AirLLM vs Exo switcher
│   │   └── PromptInput.tsx       # Textarea & submit trigger
│   ├── hub/
│   │   ├── ModelCard.tsx         # Individual model specs & download UI
│   │   └── StorageBar.tsx        # Disk space indicator
│   └── pods/
│       ├── TopologyCanvas.tsx    # Node visualizer graph
│       └── NodeStatsCard.tsx     # Hover stats for connected devices
└── pages/
    ├── ChatPage.tsx
    ├── HubPage.tsx
    ├── PodsPage.tsx
    └── SettingsPage.tsx
```

---

# 5. Interaction & Motion Rules (Framer Motion)

**Page Transitions:** Subtle opacity fade (`duration: 0.15s`, `ease: easeOut`).

**Node Discovery:** When a new device joins the Exo cluster, its node scales up with an elastic spring animation and lights up green.

**Token Streaming:** Output text renders with a subtle typewriter effect, scrolling smoothly without jitter.