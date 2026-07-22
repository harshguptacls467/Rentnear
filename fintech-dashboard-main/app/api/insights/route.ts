import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from "@sentry/nextjs";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import {
  buildCacheKey,
  cacheGetJson,
  cacheSetJson,
  getFinanceVersionToken,
  hashFinancePayload,
} from "@/lib/redis/cache";

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const INSIGHTS_CACHE_TTL_SECONDS = 300;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const result = await rateLimitAsync(ip, 10, 60000);
  
  if (!result.success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const versionToken = await getFinanceVersionToken();
    const cacheKey = buildCacheKey(
      "insights",
      [hashFinancePayload(body)],
      versionToken,
    );
    const cached = await cacheGetJson<{ insight: string }>(cacheKey);
    if (cached?.insight) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const transactions = body.transactions as Array<{
      id: string;
      title: string;
      amount: number;
      category: string;
      type: 'income' | 'expense';
      date: string;
    }> | undefined;
    const summary = body.summary as { income: number; expenses: number } | undefined;

    const totalExpenses = summary?.expenses ?? 0;
    const totalIncome = summary?.income ?? 0;
    const categories: Record<string, number> = {};

    if (transactions) {
      for (const t of transactions) {
        if (t.type === 'expense') {
          categories[t.category] = (categories[t.category] ?? 0) + t.amount;
        }
      }
    }

    const topCategoryEntry = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry
      ? `${topCategoryEntry[0]} (${topCategoryEntry[1]} руб.)`
      : 'нет данных';

    const prompt = `
      Проанализируй финансовые данные и дай одну короткую полезную подсказку (1-2 предложения):
      - Всего расходов: ${totalExpenses} руб.
      - Всего доходов: ${totalIncome} руб.
      - Самая затратная категория: ${topCategory}

      Примеры ответов:
      "Вы много тратите на такси. Попробуйте пользоваться общественным транспортом 2 раза в неделю, чтобы сэкономить до 3000 руб. в месяц."
      "Ваши расходы на еду выше обычного. Попробуйте планировать меню на неделю."

      Ответь кратко, без лишних слов.
    `;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://fintech-dashboard-six.vercel.app',
        'X-Title': 'FinTech Dashboard',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'Ты — финансовый ассистент. Отвечай на русском языке, кратко.' },
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`OpenRouter (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const insight = data.choices?.[0]?.message?.content || 'Не удалось получить подсказку';
    await cacheSetJson(cacheKey, { insight }, INSIGHTS_CACHE_TTL_SECONDS);
    return NextResponse.json({ insight });
  } catch (error: unknown) {
    Sentry.captureException(error);
    return NextResponse.json({ insight: 'Не удалось сгенерировать подсказку' });
  }
}