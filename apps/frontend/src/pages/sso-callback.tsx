import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
      {/* forceRedirectUrl bypasses Clerk's organization selection */}
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/onboarding"
        signUpForceRedirectUrl="/onboarding"
        continueSignUpUrl="/onboarding"
      />
      <div id="clerk-captcha" />
    </div>
  );
}
