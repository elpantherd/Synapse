# Synapse - AI-Powered Professional Networking
socil network v2

- A modern professional networking application that uses AI assistants to help users connect with like-minded individuals. Built with React, Convex, and Gemini.

## Features

- **User Profiles**: Create and manage your professional profile with interests and bio
- **AI Assistants**: Personalized AI assistants that help users network effectively
- **Smart Matching**: AI-powered matching system that connects users based on compatibility
- **Real-time Chat**: Direct messaging system with real-time updates
- **Image Sharing**: Support for sharing images in conversations

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Convex (Backend-as-a-Service with real-time capabilities)
- **Authentication**: Convex Auth with username/password
- **AI**: Gemini Pro for intelligent matching and conversations
- **Real-time Updates**: Powered by Convex's reactive database

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   - Create a `.env.local` file
   - Add your Convex deployment URL
   - Add your Gemini API key (if using your own)

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `/convex` - Backend functions and schema
  - `schema.ts` - Database schema
  - `assistants.ts` - AI assistant logic
  - `messages.ts` - Chat functionality
  - `profiles.ts` - User profile management
  - `matches.ts` - Matching system
- `/src` - Frontend React components
  - `App.tsx` - Main application component
  - `ProfileSetup.tsx` - Profile creation UI
  - `AssistantSetup.tsx` - AI assistant configuration
  - `Chat.tsx` - Messaging interface
  - `AssistantChat.tsx` - AI chat interface

## Features in Detail

### AI Assistants
Each user gets a personalized AI assistant that can:
- Understand user's networking goals
- Search for potential matches
- Facilitate connections
- Provide conversation suggestions
  ![landingpage](https://github.com/user-attachments/assets/8fd3ae68-f3be-419f-8733-f0a58f7b51e8)
  
  ![assistantchat](https://github.com/user-attachments/assets/02fcf8bc-3409-4e75-aeb1-f0eb3bd82bef)

### Smart Matching
The system uses AI to:
- Analyze user profiles
- Score compatibility between users
- Create matches when high relevance is detected
- Consider multiple factors including interests and goals
  
![matchmade](https://github.com/user-attachments/assets/a845ff08-0e70-4f66-86c2-f91f4117bdc5)


### Real-time Chat
- Direct messaging between users
- Support for text and images
- Real-time message delivery
- Chat history preservation

