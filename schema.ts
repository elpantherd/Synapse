import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }),
  profiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    bio: v.string(),
    interests: v.array(v.string()),
    lastActive: v.number(), // Timestamp of last activity
  }).index("by_user", ["userId"]),

  assistants: defineTable({
    userId: v.id("users"),
    name: v.string(),
    personality: v.string(), // e.g., "professional", "friendly"
    context: v.string(), // User's current goals for the assistant
    lastMessage: v.number(), // Timestamp of last interaction
  }).index("by_user", ["userId"]),

  messages: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"), // For DMs or self-messages (assistant)
    conversationId: v.optional(v.string()), // Made optional temporarily
    content: v.string(), // Text or storageId for images
    type: v.union(v.literal("text"), v.literal("image")),
    isAssistantMessage: v.optional(v.boolean()), // True if message is from AI assistant
  })
    .index("by_conversationId", ["conversationId"]) 
    .index("by_senderId_and_receiverId", ["senderId", "receiverId"]),

  matches: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    score: v.number(), // Compatibility score
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"])
    .index("by_users_and_score", ["user1Id", "user2Id", "score"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
