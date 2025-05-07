import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function ProfileSetup() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [interest, setInterest] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  
  const createProfile = useMutation(api.profiles.create);

  const addInterest = () => {
    if (interest && !interests.includes(interest)) {
      setInterests([...interests, interest]);
      setInterest("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProfile({ name, bio, interests });
      toast.success("Profile created!");
    } catch (error) {
      toast.error("Failed to create profile");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Interests
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={addInterest}
            className="mt-1 px-4 py-2 bg-indigo-500 text-white rounded-md"
          >
            Add
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          {interests.map((int) => (
            <span
              key={int}
              className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1"
            >
              {int}
              <button
                type="button"
                onClick={() => setInterests(interests.filter((i) => i !== int))}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-indigo-500 text-white rounded-md"
        disabled={!name || !bio || interests.length === 0}
      >
        Create Profile
      </button>
    </form>
  );
}
