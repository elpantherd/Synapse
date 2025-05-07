import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const matches = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", userId))
      .collect();

    return matches;
  },
});

export const accept = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");
    if (match.user2Id !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.matchId, { status: "accepted" });
  },
});

export const createInternal = internalMutation({
  args: {
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if match already exists
    const existingMatch = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", args.user1Id))
      .filter((q) => q.eq(q.field("user2Id"), args.user2Id))
      .first();

    if (existingMatch) {
      // Update score if it's higher
      if (args.score > existingMatch.score) {
        await ctx.db.patch(existingMatch._id, { score: args.score });
      }
      return existingMatch._id;
    }

    // Create new match
    return await ctx.db.insert("matches", {
      user1Id: args.user1Id,
      user2Id: args.user2Id,
      score: args.score,
      status: "pending",
    });
  },
});
