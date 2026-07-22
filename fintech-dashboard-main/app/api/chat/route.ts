import { NextRequest } from 'next/server';
import * as Sentry from "@sentry/nextjs";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const result = await rateLimitAsync(ip, 10, 60000);
  
  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Too many requests. Try again later.' }), {
      status: 429,
      headers: { 
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    });
  }

  try {
    const { messages, context } = await request.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = context
      ? context
      : 'Ты — финансовый ассистент. Отвечай на русском языке, кратко и по делу.';

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    ];

    const encoder = new TextEncoder();

    const body = JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: apiMessages,
      stream: true,
    });

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://fintech-dashboard-six.vercel.app',
        'X-Title': 'FinTech Dashboard',
      },
      body,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      return new Response(
        JSON.stringify({ error: `OpenRouter (${res.status}): ${errText}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: 'Ошибка: пустой ответ' })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: content })}\n\n`));
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        } catch (err) {
          Sentry.captureException(err);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}