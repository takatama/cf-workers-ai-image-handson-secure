import html from './index.html'
import { verifyTurnstileToken } from './turnstile.js';
import { createSessionCookie, verifySession } from './session.js';
import { verifyOrigin } from './origin.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return new Response(html, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      });
    }
    const allowedOrigin = env.ALLOWED_ORIGIN;
    if (request.method === "POST" && !verifyOrigin(request, allowedOrigin)) {
      return new Response("Bad Request", { status: 400 });
    }
    if (request.method === "POST" && url.pathname === "/translate") {
      const isValidSession = await verifySession(request, env);
      if (!isValidSession) return new Response("Unauthorized", { status: 401 });
      const formData = await request.formData();
      const prompt = formData.get("prompt");
      return await translatePrompt(prompt, env);
    }
    if (request.method === "POST" && url.pathname === "/generate-image") {
      const isValidSession = await verifySession(request, env);
      if (!isValidSession) return new Response("Unauthorized", { status: 401 });
      const formData = await request.formData();
      const prompt = formData.get("prompt");
      return await generateImage(prompt, env);
    }
    if (request.method === "POST" && url.pathname === "/auth") {
      const formData = await request.formData();
      const token = formData.get("cf-turnstile-response");
      const ip = request.headers.get('CF-Connecting-IP');

      const isValid = await verifyTurnstileToken(token, env.TURNSTILE_SECRET_KEY, ip);

      if (isValid) {
        const response = new Response("Authenticated", { status: 200 });
        const secret = new TextEncoder().encode(env.JWT_SECRET);
        const cookie = await createSessionCookie({ authenticated: true }, secret);
        response.headers.append('Set-Cookie', cookie);
        return response;
      }
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response("Not found", { status: 404 });
  },
};

async function translatePrompt(prompt, env) {
  const messages = [
    {
      role: "system",
      content: `
  Translate the following Japanese text into a concise and vivid English prompt for image generation. Follow the specified artistic style closely (e.g., oil painting, watercolor, pop art) and avoid adding style elements not specified. Include only the essential subjects, actions, and visual details relevant to the style. Output the prompt text only, without quotation marks or additional comments.
  `,
    },
    { role: "user", content: prompt },
  ];

  try {
    const stream = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
      messages,
      stream: true,
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("翻訳エラー:", error);
    return new Response(JSON.stringify({ error: "翻訳に失敗しました。" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

async function generateImage(prompt, env) {
  const inputs = { prompt };

  try {
    const response = await env.AI.run(
      "@cf/black-forest-labs/flux-1-schnell",
      inputs
    );
    const binaryString = atob(response.image);
    const img = Uint8Array.from(binaryString, (m) => m.codePointAt(0));
    return new Response(img, {
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });
  } catch (error) {
    console.error("画像生成エラー:", error);
    return new Response(JSON.stringify({ error: "画像生成に失敗しました。" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
