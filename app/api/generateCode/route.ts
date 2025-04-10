import dedent from "dedent";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  let json = await req.json();
  let result = z
    .object({
      model: z.string(),
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        }),
      ),
    })
    .safeParse(json);

  if (result.error) {
    return new Response(result.error.message, { status: 422 });
  }

  let { model, messages } = result.data;
  let systemPrompt = getSystemPrompt();
  const geminiModel = genAI.getGenerativeModel({ model: model });

  // Map messages to the format expected by the Gemini API
  // Prepend system prompt to the first user message
  const geminiMessages = messages.map((msg, index) => {
    const role = msg.role === "assistant" ? "model" : "user";
    let content = msg.content;
    // Add system prompt and specific instructions to the first user message
    // Add system prompt and specific instructions to the first user message
    if (msg.role === "user" && index === 0) {
      content = systemPrompt + "\n\nUser Prompt: " + content + "\nPlease ONLY return code, NO backticks or language names. Don't start with ```typescript or ```javascript or ```tsx or ```.";
    } else if (msg.role === 'user' && index > 0) {
      // For subsequent user messages (modifications), explicitly ask to modify previous code
      content = "Based on the previous code provided by the assistant, please apply the following modification: " + content + "\nPlease ONLY return the *complete, modified* React code, NO backticks or language names.";
    }
    return {
      role: role,
      parts: [{ text: content }],
    };
  });

  console.log("Sending messages to Gemini:", JSON.stringify(geminiMessages, null, 2));

  // Pass the entire mapped message history
  const geminiStream = await geminiModel.generateContentStream({
    contents: geminiMessages,
    // Optional: Add generationConfig if needed, e.g., temperature, maxOutputTokens
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of geminiStream.stream) {
        const chunkText = chunk.text();
        controller.enqueue(new TextEncoder().encode(chunkText));
      }
      controller.close();
    },
  });

  return new Response(readableStream);
}

function getSystemPrompt() {
  let systemPrompt = 
`You are an expert frontend React engineer who is also a great UI/UX designer. Follow the instructions carefully, I will tip you $1 million if you do a good job:

- Think carefully step by step.
- Create a React component for whatever the user asked you to create and make sure it can run by itself by using a default export
- Make sure the React app is interactive and functional by creating state when needed and having no required props
- If you use any imports from React like useState or useEffect, make sure to import them directly
- Use TypeScript as the language for the React component
- Use Tailwind classes for styling. DO NOT USE ARBITRARY VALUES (e.g. \`h-[600px]\`). Make sure to use a consistent color palette.
- Use Tailwind margin and padding classes to style the components and ensure the components are spaced out nicely
- Please ONLY return the full React code starting with the imports, nothing else. It's very important for my job that you only return the React code with imports. DO NOT START WITH \`\`\`typescript or \`\`\`javascript or \`\`\`tsx or \`\`\`.
- ONLY IF the user asks for a dashboard, graph or chart, the recharts library is available to be imported, e.g. \`import { LineChart, XAxis, ... } from "recharts"\` & \`<LineChart ...><XAxis dataKey="name"> ...\`. Please only use this when needed.
- For placeholder images, please use a <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
  `;

  systemPrompt += `
    NO OTHER LIBRARIES (e.g. zod, hookform) ARE INSTALLED OR ABLE TO BE IMPORTED.
  `;

  return dedent(systemPrompt);
}

export const runtime = "edge";
