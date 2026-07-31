import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { TitleBar } from "@/components/layout/TitleBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { HardwareHud } from "@/components/layout/HardwareHud";
import { ChatPage } from "@/pages/ChatPage";
import { RunnerPage } from "@/pages/RunnerPage";
import { RuntimePage } from "@/pages/RuntimePage";
import { HubPage } from "@/pages/HubPage";
import { PodsPage } from "@/pages/PodsPage";
import { SettingsPage } from "@/pages/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="h-full w-full overflow-hidden"
      >
        <Routes location={location}>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/runner" element={<RunnerPage />} />
          <Route path="/runtime" element={<RuntimePage />} />
          <Route path="/hub" element={<HubPage />} />
          <Route path="/pods" element={<PodsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * App — Root application shell.
 * Composes TitleBar + Sidebar + Main Stage + HardwareHud layout per DESIGN.md.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#09090b] text-[#f4f4f5] select-none font-sans">
          {/* Custom Desktop Title Bar */}
          <TitleBar />

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* Navigation Sidebar */}
            <Sidebar />

            {/* Main Stage */}
            <main className="flex-1 flex flex-col overflow-hidden relative bg-[#09090b]">
              <div className="flex-1 overflow-hidden">
                <AnimatedRoutes />
              </div>

              {/* Hardware HUD Overlay */}
              <HardwareHud />
            </main>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

