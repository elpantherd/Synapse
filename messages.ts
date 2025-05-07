import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";


// Helper to create a consistent conversation ID for DMs
export const getConversationId = (userId1: Id<"users">, userId2: Id<"users">): string => {
  return userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
};

export const list = query({
  args: { otherId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const conversationId = getConversationId(userId, args.otherId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", conversationId)
      )
      .order("asc") 
      .collect();
    
    return Promise.all(
      messages.map(async (message) => ({
        ...message,
        ...(message.type === "image" && typeof message.content === 'string'
          ? { url: await ctx.storage.getUrl(message.content as Id<"_storage">) }
          : {}),
      }))
    );
  },
});

export const listAssistantMessages = query({
  args: {}, // No arguments needed, uses authenticated user
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // For assistant chat, senderId and receiverId are both the user's ID
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_senderId_and_receiverId", (q) =>
        q.eq("senderId", userId).eq("receiverId", userId)
      )
      .order("asc") // Fetch in chronological order
      .collect();
    
    return messages;
  },
});


export const send = mutation({
  args: {
    receiverId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image")),
  },
  handler: async (ctx, args) => {
    const senderId = await getAuthUserId(ctx);
    if (!senderId) throw new Error("Not authenticated");

    if (senderId === args.receiverId) {
      throw new Error("Cannot send direct message to self using this function. Use assistant chat.");
    }
    
    const conversationId = getConversationId(senderId, args.receiverId);

    return await ctx.db.insert("messages", {
      senderId,
      receiverId: args.receiverId,
      conversationId,
      content: args.content,
      type: args.type,
      isAssistantMessage: false, 
    });
  },
});

export const sendInternal = internalMutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    type: v.literal("text"), 
    isAssistantMessage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const conversationId = getConversationId(args.senderId, args.receiverId);
    return await ctx.db.insert("messages", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      conversationId, 
      content: args.content,
      type: args.type,
      isAssistantMessage: args.isAssistantMessage ?? false,
    });
  },
});


export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
