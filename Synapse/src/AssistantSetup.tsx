import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function AssistantSetup() {
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [context, setContext] = useState("");
  
  const createAssistant = useMutation(api.assistants.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAssistant({ name, personality, context });
      toast.success("AI Assistant created!");
    } catch (error) {
      toast.error("Failed to create AI Assistant");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Assistant Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="e.g., Career Helper"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Personality</label>
        <textarea
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="e.g., Professional, empathetic, and focused on career development"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Context</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="e.g., Looking for full-stack developers interested in joining early-stage startups"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-indigo-500 text-white rounded-md"
        disabled={!name || !personality || !context}
      >
        Create AI Assistant
      </button>
    </form>
  );
}
