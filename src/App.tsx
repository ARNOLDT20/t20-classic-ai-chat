import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Keep the backend warm while the app is open (ping every 3 minutes)
function useKeepAlive() {
  useEffect(() => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ping`;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const ping = () =>
      fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } }).catch(() => {});
    ping();
    const id = setInterval(ping, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
}


const App = () => {
  useKeepAlive();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
