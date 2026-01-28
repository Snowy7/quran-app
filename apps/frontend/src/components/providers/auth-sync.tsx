import { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "@template/backend";

/**
 * Syncs the authenticated Clerk user to Convex.
 * Only runs when both Clerk is loaded AND Convex JWT is validated.
 */
export function AuthSync({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const syncUser = useMutation(api.users.syncUser);
  const hasSynced = useRef(false);

  useEffect(() => {
    // Reset sync flag when user changes (e.g., sign out then sign in as different user)
    if (!user) {
      hasSynced.current = false;
      return;
    }

    // Only sync when:
    // 1. Clerk has loaded the user
    // 2. Convex is NOT loading (JWT validation complete)
    // 3. Convex confirms authentication
    // 4. We haven't already synced this session
    if (isClerkLoaded && !isLoading && isAuthenticated && !hasSynced.current) {
      hasSynced.current = true;
      syncUser()
        .then(() => console.log("[AuthSync] User synced to Convex"))
        .catch((error) => {
          console.error("[AuthSync] Failed to sync user:", error);
          hasSynced.current = false; // Allow retry on failure
        });
    }
  }, [isClerkLoaded, isLoading, isAuthenticated, user, syncUser]);

  return <>{children}</>;
}
