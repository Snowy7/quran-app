import { mutation, query } from "./_generated/server";

/**
 * Get or create a user from Clerk identity
 */
export const syncUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;
    const email = identity.email!;
    const name = identity.name;
    const imageUrl = identity.pictureUrl;

    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update user info
      await ctx.db.patch(existingUser._id, {
        email,
        name,
        imageUrl,
        updatedAt: now,
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      imageUrl,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * Get the current user
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});
