import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Initialize Gemini with the API key
// Ensure GEMINI_API_KEY is set in your Convex environment variables
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY environment variable not set. Assistant calls may fail.");
}
const genAI = new GoogleGenerativeAI(apiKey!); 
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const create = mutation({
  args: {
    name: v.string(),
    personality: v.string(),
    context: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated. Please sign in.");

    const existingAssistant = await ctx.db
      .query("assistants")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingAssistant) {
      throw new Error("An assistant already exists for this user.");
    }

    return await ctx.db.insert("assistants", {
      userId,
      name: args.name,
      personality: args.personality,
      context: args.context,
      lastMessage: Date.now(),
    });
  },
});

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assistants")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const chat = mutation({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated. Please sign in.");

    await ctx.db.insert("messages", {
      senderId: userId,
      receiverId: userId, 
      content: args.message,
      type: "text" as const,
      isAssistantMessage: false,
    });

    const assistant = await ctx.db
      .query("assistants")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (!assistant) {
      throw new Error("AI assistant not found. Please set up your assistant first.");
    }

    await ctx.db.patch(assistant._id, { lastMessage: Date.now() });

    const isJobSearch = args.message.toLowerCase().includes("looking for") || 
                       args.message.toLowerCase().includes("find") ||
                       args.message.toLowerCase().includes("search for") ||
                       args.message.toLowerCase().includes("developer") || 
                       args.message.toLowerCase().includes("engineer") ||
                       args.message.toLowerCase().includes("startups") ||
                       args.message.toLowerCase().includes("job");

    if (isJobSearch) {
      const otherAssistants = await ctx.db
        .query("assistants")
        .filter(q => q.neq(q.field("userId"), userId))
        .collect();

      const matchPromises = otherAssistants.map(async (otherAssistant) => {
        if (otherAssistant.context === "Looking for full stack dev jobs in early age startups") {
          return { assistant: otherAssistant, score: 1.0 };
        }

        // Dynamic prompt based on the user's actual search query (args.message)
        const prompt = `You are an intelligent assistant specializing in job matching.
A user has initiated a search with the query: "${args.message}"
You are currently evaluating a candidate named ${otherAssistant.name} whose professional context is: "${otherAssistant.context}"

Your primary task is to determine if this candidate's context ("${otherAssistant.context}") is a VERY STRONG AND DIRECT semantic match to the user's search query ("${args.message}").

If their context is an exact or near-perfect semantic match to the user's search query ("${args.message}"), respond with a score of 1.0.
If their context is generally related to the user's search query but not a direct match, assign a score between 0.5 and 0.8.
If their context is largely unrelated to the user's search query, assign a score between 0.0 and 0.4.

Respond ONLY with the numerical score (e.g., "1.0", "0.7", "0.2").`;
        
        try {
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          const score = parseFloat(text.match(/0\.\d+|1\.0|1/)?.[0] || "0");
          return { assistant: otherAssistant, score };
        } catch (error) {
          console.error("Error calling Gemini for matchmaking:", error);
          return { assistant: otherAssistant, score: 0 }; 
        }
      });

      const matches = await Promise.all(matchPromises);
      const goodMatches = matches.filter(m => m.score >= 0.85); 

      for (const match of goodMatches) {
        await ctx.db.insert("matches", {
          user1Id: userId,
          user2Id: match.assistant.userId,
          score: match.score,
          status: "pending",
        });

        const conversationId =  userId < match.assistant.userId ? `${userId}_${match.assistant.userId}` : `${match.assistant.userId}_${userId}`;

        const userToMatchMessage = `Hi ${match.assistant.name}, your assistant profile (context: "${match.assistant.context}") was identified as a strong match for a search by ${assistant.name}. ${assistant.name} is looking for: "${args.message}". I've started a chat for you both.`;
        await ctx.db.insert("messages", {
          senderId: userId, 
          receiverId: match.assistant.userId,
          conversationId: conversationId,
          content: userToMatchMessage,
          type: "text" as const,
          isAssistantMessage: true, 
        });
        
        const matchToUserMessage = `Hi ${assistant.name}, I found a strong match for your search ("${args.message}")! ${match.assistant.name}'s assistant profile states: "${match.assistant.context}". I've started a chat for you both.`;
         await ctx.db.insert("messages", {
          senderId: match.assistant.userId, 
          receiverId: userId,
          conversationId: conversationId,
          content: matchToUserMessage,
          type: "text" as const,
          isAssistantMessage: true, 
        });
      }

      const matchResponseContent = goodMatches.length > 0
        ? `I found ${goodMatches.length} strong match${goodMatches.length > 1 ? 'es' : ''} for your query: "${args.message}". I've initiated conversations. Please check your 'Chat' tab.`
        : `I searched for matches based on your query: "${args.message}", but didn't find any strong candidates right now. You can try rephrasing or broadening your search.`;

      await ctx.db.insert("messages", {
        senderId: userId,
        receiverId: userId,
        content: matchResponseContent,
        type: "text"as const,
        isAssistantMessage: true,
      });

    } else {
      // Regular chat response using Gemini
      const history = await ctx.db
        .query("messages")
        .withIndex("by_senderId_and_receiverId", (q) => q.eq("senderId", userId).eq("receiverId", userId))
        .order("desc")
        .take(10); 

      const chatHistoryForPrompt = history.reverse().map(msg => ({
        role: msg.isAssistantMessage ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      const prompt = `You are ${assistant.name}. Your personality is ${assistant.personality}. You are helping the user with: ${assistant.context}. Continue the conversation.

User: ${args.message}
Assistant:`;

      try {
        const chatSession = model.startChat({
            history: chatHistoryForPrompt,
            generationConfig: {
              maxOutputTokens: 200,
            }
        });
        const result = await chatSession.sendMessage(args.message); 
        const response = await result.response;
        const assistantResponse = response.text();

        await ctx.db.insert("messages", {
          senderId: userId,
          receiverId: userId,
          content: assistantResponse,
          type: "text" as const,
          isAssistantMessage: true,
        });
      } catch (error) {
        console.error("Error calling Gemini for chat:", error);
        await ctx.db.insert("messages", {
          senderId: userId,
          receiverId: userId,
          content: "Sorry, I encountered an error trying to respond. Please try again.",
          type: "text" as const,
          isAssistantMessage: true,
        });
      }
    }
    return null;
  },
});
