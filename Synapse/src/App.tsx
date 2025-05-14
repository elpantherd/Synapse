import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { ProfileSetup } from "./ProfileSetup";
import { Chat } from "./Chat";
import { AssistantSetup } from "./AssistantSetup";
import { AssistantChat } from "./AssistantChat";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold accent-text">Synapse</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.get, 
    loggedInUser?._id ? { userId: loggedInUser._id } : "skip"
  );
  const assistant = useQuery(api.assistants.get,
    loggedInUser?._id ? { userId: loggedInUser._id } : "skip"
  );
  const [view, setView] = useState<"profile" | "chat" | "assistant">("profile");

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold accent-text mb-4">Synapse</h1>
        <Authenticated>
          {profile === undefined ? (
            <div>Loading...</div>
          ) : profile === null ? (
            <ProfileSetup />
          ) : assistant === null ? (
            <AssistantSetup />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 justify-center">
                <button
                  className={`px-4 py-2 rounded ${
                    view === "profile" ? "bg-indigo-500 text-white" : "bg-gray-200"
                  }`}
                  onClick={() => setView("profile")}
                >
                  Profile
                </button>
                <button
                  className={`px-4 py-2 rounded ${
                    view === "assistant" ? "bg-indigo-500 text-white" : "bg-gray-200"
                  }`}
                  onClick={() => setView("assistant")}
                >
                  Assistant
                </button>
                <button
                  className={`px-4 py-2 rounded ${
                    view === "chat" ? "bg-indigo-500 text-white" : "bg-gray-200"
                  }`}
                  onClick={() => setView("chat")}
                >
                  Chat
                </button>
              </div>
              {view === "profile" ? (
                <div>
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <p className="text-gray-600">{profile.bio}</p>
                  <div className="flex gap-2 mt-2">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="bg-gray-100 px-2 py-1 rounded text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              ) : view === "assistant" ? (
                <AssistantChat />
              ) : (
                <Chat />
              )}
            </div>
          )}
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-slate-600">Sign in to get started</p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </div>
  );
}
