import { ClerkProvider as BaseClerkProvider } from "@clerk/clerk-react";
import { ReactNode } from "react";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function ClerkProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    throw new Error(
      "Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. " +
      "Please add it to your .env file:\n\n" +
      "VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx\n\n" +
      "Get your key from: https://dashboard.clerk.com"
    );
  }

  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInForceRedirectUrl="/onboarding"
      signUpForceRedirectUrl="/onboarding"
      afterSignOutUrl="/"
    >
      {children}
    </BaseClerkProvider>
  );
}
