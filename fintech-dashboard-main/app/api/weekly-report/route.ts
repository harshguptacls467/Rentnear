import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from "@sentry/nextjs";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { getTransactions } from "@/lib/turso";
import {
  buildCacheKey,
  cacheGetJson,
  cacheSetJson,
  getFinanceVersionToken,
} from "@/lib/redis/cache";

const MODEL_NAME = process.env.OPENROUTER_MODEL || 'inclusionai/ling-2.6-1t:free';
const WEEKLY_REPORT_CACHE_TTL_SECONDS = 600;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const result = await rateLimitAsync(ip, 10, 60000);

  if (!result.success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const versionToken = await getFinanceVersionToken();
    const cacheKey = buildCacheKey("weekly-report", [weekAgoStr], versionToken);
    const cached = await cacheGetJson<{
      weekStats: unknown;
      report: string;
    }>(cacheKey);
    if (cached?.report) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const transactions = await getTransactions(weekAgoStr);

    const income = transactions
      .filter(t => t.type === 'Доход')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'Расход')
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'Расход') {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      }
    }

    const sortedCategories = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1]);

    const avgDailyExpenses = expenses / 7;
    const categoriesList = sortedCategories
      .slice(0, 5)
      .map(([cat, amount]) => `${cat} — ${amount.toLocaleString('ru-RU')} руб.`)
      .join(', ');

    const prompt = `
Проанализируй финансовую активность за последнюю неделю и составь краткий отчёт с рекомендациями.

Данные за неделю:
- Доходы: ${income.toLocaleString('ru-RU')} руб.
- Расходы: ${expenses.toLocaleString('ru-RU')} руб.
- Баланс: ${(income - expenses).toLocaleString('ru-RU')} руб.
- Средние расходы в день: ${avgDailyExpenses.toFixed(0)} руб.
- Топ категории расходов: ${categoriesList || 'нет данных'}
- Всего транзакций: ${transactions.length}

Составь отчёт в таком формате:
1. Заголовок (1 строка)
2. Краткая статистика (2-3 строки)
3. Одна конкретная рекомендация с цифрами
4. совет на следующую неделю

Отвечай на русском языке, будь конкретной.
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
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: 'Ты — финансовый аналитик. Составляешь краткие еженедельные отчёты с цифрами и рекомендациями. Отвечай на русском.' },
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

    const report = data.choices?.[0]?.message?.content || 'Не удалось сформировать отчёт';

    const responseBody = {
      weekStats: {
        income,
        expenses,
        balance: income - expenses,
        transactionCount: transactions.length,
        avgDailyExpenses,
        topCategories: sortedCategories.slice(0, 5),
      },
      report,
    };

    await cacheSetJson(cacheKey, responseBody, WEEKLY_REPORT_CACHE_TTL_SECONDS);

    return NextResponse.json(responseBody);
  } catch (error: unknown) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Ошибка при формировании отчёта' }, { status: 500 });
  }
}