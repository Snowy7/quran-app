import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/clerk-react";
import { ReactNode, useMemo } from "react";
import { AuthSync } from "./auth-sync";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    if (!convexUrl) {
      throw new Error(
        "Missing VITE_CONVEX_URL environment variable. " +
        "Please add it to your .env file:\n\n" +
        "VITE_CONVEX_URL=https://your-deployment.convex.cloud"
      );
    }
    return new ConvexReactClient(convexUrl);
  }, []);

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <AuthSync>{children}</AuthSync>
    </ConvexProviderWithClerk>
  );
}
