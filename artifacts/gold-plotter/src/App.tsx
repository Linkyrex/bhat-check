import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "@/pages/dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground overflow-hidden relative selection:bg-primary/30">
        
        {/* Premium Ambient Background Image */}
        <div className="fixed inset-0 z-0 opacity-30 pointer-events-none mix-blend-screen">
          <img 
            src={`${import.meta.env.BASE_URL}images/bg-glow.png`} 
            alt="Ambient background glow" 
            className="w-full h-full object-cover blur-[60px] opacity-60"
          />
        </div>
        
        {/* Extra subtle radial gradient overlay for depth */}
        <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary)_0%,transparent_40%)] opacity-[0.03] pointer-events-none" />

        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route>
              <div className="flex h-screen items-center justify-center z-10 relative">
                <div className="text-center bg-card/50 p-12 rounded-[32px] border border-border/50 backdrop-blur-xl">
                  <h1 className="text-6xl font-display font-bold text-primary mb-4">404</h1>
                  <p className="text-xl text-muted-foreground font-medium">Data endpoint not found.</p>
                </div>
              </div>
            </Route>
          </Switch>
        </WouterRouter>
      </div>
    </QueryClientProvider>
  );
}

export default App;
