"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useTransactionsQuery } from "@/entities/transaction/api/transaction.queries";
import { calculateSummary } from "@/entities/transaction/api/transaction.service";
import { useBudgetStore } from "@/features/budget/model/budget-store";

function buildFinanceContext(transactions: ReturnType<typeof useTransactionsQuery>["data"], budgets: Record<string, number>) {
  if (!transactions || transactions.length === 0) return "";

  const summary = calculateSummary(transactions);
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  const categorySummary = recent
    .filter((t) => t.type === "Расход")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});

  const budgetLines = Object.entries(budgets)
    .filter(([, limit]) => limit > 0)
    .map(([cat, limit]) => {
      const spent = categorySummary[cat] ?? 0;
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return `- Бюджет «${cat}»: лимит ${limit.toLocaleString("ru-RU")} руб., потрачено ${spent.toLocaleString("ru-RU")} руб. (${pct}%)`;
    })
    .join("\n");

  const topCategory = Object.entries(categorySummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return `КОНТЕКСТ ФИНАНСОВЫХ ДАННЫХ:
- Всего доходов за период: ${summary.income.toLocaleString("ru-RU")} руб.
- Всего расходов за период: ${summary.expenses.toLocaleString("ru-RU")} руб.
- Текущий баланс: ${summary.balance.toLocaleString("ru-RU")} руб.
- Количество транзакций в системе: ${transactions.length}

ТОП-3 КАТЕГОРИИ РАСХОДОВ:
${topCategory.map(([cat, val], i) => `${i + 1}. ${cat}: ${val.toLocaleString("ru-RU")} руб.`).join("\n")}

${budgetLines ? `БЮДЖЕТЫ:\n${budgetLines}` : ""}

ПОСЛЕДНИЕ ТРАНЗАКЦИИ (${recent.length} шт.):
${recent.map((t) => `[${t.date}] ${t.title} — ${t.type === "Доход" ? "+" : "-"}${t.amount.toLocaleString("ru-RU")} руб. (${t.category})`).join("\n")}

Ты — финансовый ассистент. Отвечай на русском языке, кратко (1-3 предложения), по делу. Используй данные выше для ответа. Если данных недостаточно — честно скажи об этом.`;
}

export function AIChat() {
  const { data: transactions } = useTransactionsQuery();
  const budgets = useBudgetStore((s) => s.budgets);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Привет! Я AI-ассистент. Спроси о финансах — я вижу твои транзакции и бюджеты." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const context = buildFinanceContext(transactions, budgets);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.filter(m => m.role !== "system"), userMsg],
          context,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Ошибка сервера" }));
        throw new Error(err.error || "Ошибка сервера");
      }

      // Streaming
      const reader = res.body?.getReader();
      if (reader) {
        const assistantMsg = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, assistantMsg]);

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const token = parsed.response ?? "";
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = { ...last, content: last.content + token };
                  }
                  return updated;
                });
              } catch { /* игнорируем неполные JSON */ }
            }
          }
        }
      } else {
        // Fallback без streaming
        const data = await res.json();
        const reply = data.reply || "Не удалось получить ответ";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) => [...prev, { role: "assistant", content: "Ошибка: AI-ассистент недоступен. Убедитесь, что запущен Ollama." }]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm">💬 AI-ассистент</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-1">
        <div
          ref={chatRef}
          className="h-48 sm:h-80 overflow-y-auto space-y-2 mb-3 border rounded-md p-2 dark:border-gray-700 dark:bg-gray-900/50"
        >
          {messages.map((m, i) => (
            <div key={i} className={`text-sm ${m.role === "user" ? "text-right" : "text-left"}`}>
              <span
                className={`inline-block p-2 rounded max-w-[80%] break-words ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted dark:bg-gray-700"
                }`}
              >
                {m.content}
              </span>
            </div>
          ))}
          {loading && (
            <div className="text-sm text-muted-foreground dark:text-gray-400">Думаю...</div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Спроси о финансах..."
            className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          />
          <Button onClick={sendMessage} disabled={loading}>
            {loading ? "..." : "Отправить"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
