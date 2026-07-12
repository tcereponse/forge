import { ForgeApp } from "@/components/forge/forge-app";
import { AuthGate } from "@/components/auth-gate";

export default function Home() {
  return (
    <AuthGate>
      <ForgeApp />
    </AuthGate>
  );
}
