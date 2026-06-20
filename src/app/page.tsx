import { HeroSection } from "@/components/extension-lab/hero-section";
import { BridgeSection } from "@/components/extension-lab/bridge-section";
import { NavigationSection } from "@/components/extension-lab/navigation-section";
import { CopilotSection } from "@/components/extension-lab/copilot-section";
import { TransformationSection } from "@/components/extension-lab/transformation-section";
import { CodeExplorerSection } from "@/components/extension-lab/code-explorer-section";
import { Footer } from "@/components/extension-lab/footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <HeroSection />
      <BridgeSection />
      <NavigationSection />
      <CopilotSection />
      <TransformationSection />
      <CodeExplorerSection />
      <Footer />
    </main>
  );
}
