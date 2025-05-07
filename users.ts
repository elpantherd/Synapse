import { query, QueryCtx, internalQuery } from "./_generated/server"; // Added QueryCtx, internalQuery
import { getAuthUserId } from "@convex-dev/auth/server";
// Removed 'internal' import from "./_generated/api" as internalQuery is used directly.
import { Doc } from "./_generated/dataModel"; 

// Get the currently logged-in user
export const currentLoggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId); 
    return user;
  }
});

// List all users
export const list = query({
  handler: async (ctx: QueryCtx): Promise<Doc<"users">[]> => { 
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

// Internal query to get all user data
export const listInternal = internalQuery({ // Changed from internal.query to internalQuery
  handler: async (ctx: QueryCtx): Promise<Doc<"users">[]> => { 
    const users: Doc<"users">[] = await ctx.db.query("users").collect();
    return users;
  },
});
