import { Suspense } from "react";
import { SetupScreen } from "@/games/word-chain-clash";

export default function WordChainSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--surface-0)] text-white flex items-center justify-center font-mono text-sm text-white/50">
          Loading Arena...
        </div>
      }
    >
      <SetupScreen />
    </Suspense>
  );
}
