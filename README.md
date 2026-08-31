# TruthAI Assistant

Create a modern AI website called TruthAI.



Purpose



Build an AI assistant that users can ask questions about any topic and receive honest, clear, accurate, and helpful answers.



Core Features



- Large chat interface similar to modern AI assistants

- Users can type questions and receive AI-generated answers

- Conversation history

- New Chat button

- Copy response button

- Regenerate response button

- Like/dislike feedback buttons

- Clear chat button

- Search through previous conversations

- Dark and light mode

- Fully responsive on mobile and desktop



AI Behavior



The AI should:



- Answer questions honestly and directly.

- Never intentionally lie or make up information.

- Clearly say when it does not know something.

- Distinguish facts from opinions.

- Avoid pretending to have personal experiences or feelings.

- Correct itself when it discovers an error.

- Give simple explanations when users ask beginner-level questions.

- Give detailed explanations when users request them.

- Ask for clarification when a question is genuinely unclear.

- Avoid presenting guesses as confirmed facts.

- For current or changing information, use reliable sources when web access is available.



Chat UI



At the top, display:



TruthAI

Ask anything. Get an honest answer.



Create a clean message interface with:



- User messages on one side

- AI responses on the other

- Typing/loading animation

- Markdown support

- Code formatting

- Tables when useful



Add suggested questions on the homepage such as:



- “Explain something to me.”

- “Help me solve this problem.”

- “What is the truth about...?”

- “Teach me something new.”



Safety



The AI should refuse requests that could cause serious harm or facilitate illegal activity, while offering a safe alternative when possible.



Visual Design



Use:



- Clean modern interface

- Minimalist layout

- Smooth animations

- Professional typography

- Rounded cards and buttons

- Dark mode as the default

- Responsive design

- No unnecessary clutter



Technical Requirements



Build the website with a proper frontend and backend.

Include a secure API system for connecting the AI model.

Never expose API keys in frontend code.

Store conversations securely.

Make the architecture easy to expand with additional AI models and features later.



The final result should feel like a professional, trustworthy AI assistant website, not a simple chatbot demo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://trust-worthy-answers.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/59c7b9cc-78f9-4314-a693-c982ddb90553).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
