# **App Name**: CharcoalChat

## Core Features:

- Real-time Text Chat: Enables users to exchange text messages in real time within a specific room, leveraging Firebase Firestore.
- Room and User ID Generation: Generates a unique roomID and randomUserID upon a user's first visit, storing them in local storage. There is no user authentication.
- Message Persistence: Stores all messages in a Firebase collection organized by roomID, allowing message history to persist across sessions.
- Display Name Input: Prompts users for a display name upon their first visit, storing it in localStorage for consistent identification across sessions.
- Real-time Message Sync: JavaScript listener that syncs messages in real-time based on the local roomID, updating the chat interface as new messages are added to Firestore.

## Style Guidelines:

- Primary color: Soft off-white (#F0F0F0) for text to ensure readability against the charcoal background.
- Background color: Deep charcoal (#121212) for a modern, minimalist feel.
- Accent color: Cyber Purple (#800080) for the Send button to add a pop of color.
- Body font: 'Inter' sans-serif for clean, readable text in both headlines and body.
- Floating input bar with margin and a backdrop-filter blur (10px) for a hovering effect.
- Chat bubbles with rounded corners (border-radius: 20px), user bubbles with a slightly more square bottom-right corner (4px).