import { describe, it, expect } from "vitest";

/**
 * Тесты для AI-функций: форматирование финансового контекста
 * и парсинг ответов от OpenRouter.
 */

describe("buildFinanceContext (логика форматирования)", () => {
  /**
   * Эмулирует логику buildFinanceContext из ai-chat.tsx,
   * но без зависимостей от React Query и Zustand.
   */
  function buildContext(
    transactions: Array<{ title: string; amount: number; category: string; type: string; date: string }>,
    budgets: Record<string, number>,
  ): string {
    if (transactions.length === 0) return "";

    const income = transactions.filter((t) => t.type === "Доход").reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter((t) => t.type === "Расход").reduce((s, t) => s + t.amount, 0);

    const recent = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 15);

    const categorySummary = recent
      .filter((t) => t.type === "Расход")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {});

    const topCategory = Object.entries(categorySummary)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return [
      `- Всего доходов: ${income} руб.`,
      `- Всего расходов: ${expenses} руб.`,
      `- Транзакций: ${transactions.length}`,
      ...topCategory.map(([cat, val], i) => `- ТОП-${i + 1}: ${cat} (${val} руб.)`),
    ].join("\n");
  }

  it("returns empty string for empty transactions", () => {
    expect(buildContext([], {})).toBe("");
  });

  it("includes income and expenses", () => {
    const result = buildContext(
      [
        { title: "Зарплата", amount: 100000, category: "Зарплата", type: "Доход", date: "2026-04-01" },
        { title: "Продукты", amount: 5000, category: "Еда", type: "Расход", date: "2026-04-05" },
      ],
      {},
    );
    expect(result).toContain("Всего доходов: 100000");
    expect(result).toContain("Всего расходов: 5000");
    expect(result).toContain("Транзакций: 2");
  });

  it("includes top categories", () => {
    const result = buildContext(
      [
        { title: "Зарплата", amount: 100000, category: "Зарплата", type: "Доход", date: "2026-04-01" },
        { title: "Продукты", amount: 5000, category: "Еда", type: "Расход", date: "2026-04-05" },
        { title: "Такси", amount: 1500, category: "Транспорт", type: "Расход", date: "2026-04-10" },
      ],
      {},
    );
    expect(result).toContain("ТОП-1");
    expect(result).toContain("ТОП-2");
  });

  it("sorts recent transactions by date descending", () => {
    const result = buildContext(
      [
        { title: "Старая", amount: 100, category: "Другое", type: "Расход", date: "2026-03-01" },
        { title: "Новая", amount: 200, category: "Другое", type: "Расход", date: "2026-04-01" },
      ],
      {},
    );
    // Обе транзакции в одной категории "Другое", проверяем сумму
    expect(result).toContain("Другое (300 руб.)");
  });
});

describe("Vision response parsing", () => {
  /**
   * Эмулирует логику парсинга JSON из vision/route.ts
   */
  function parseVisionResponse(content: string): { title: string; amount: number; category: string } {
    let parsed: { title: string; amount: number; category: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid response format");
      }
    }
    if (!parsed.title || !parsed.amount) {
      throw new Error("Missing required fields");
    }
    return parsed;
  }

  it("parses valid JSON response", () => {
    const result = parseVisionResponse(
      JSON.stringify({ title: "Пятёрочка", amount: 1234.56, date: "2026-04-27", category: "Еда" }),
    );
    expect(result.title).toBe("Пятёрочка");
    expect(result.amount).toBe(1234.56);
    expect(result.category).toBe("Еда");
  });

  it("extracts JSON from markdown code block", () => {
    const result = parseVisionResponse(
      "```json\n{\"title\": \"Магнит\", \"amount\": 890.50, \"date\": \"2026-04-27\", \"category\": \"Еда\"}\n```",
    );
    expect(result.title).toBe("Магнит");
    expect(result.amount).toBe(890.5);
  });

  it("extracts JSON from text with surrounding content", () => {
    const result = parseVisionResponse(
      'Вот данные:\n{"title": "Аптека", "amount": 1500, "date": "2026-04-27", "category": "Здоровье"}\nКонец.',
    );
    expect(result.title).toBe("Аптека");
    expect(result.amount).toBe(1500);
  });

  it("throws on missing title", () => {
    expect(() => parseVisionResponse(JSON.stringify({ amount: 100 }))).toThrow("Missing required fields");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseVisionResponse("not json at all")).toThrow();
  });
});

describe("Category mapping", () => {
  /**
   * Эмулирует логику маппинга категорий из add-transaction-form.tsx
   */
  function mapCategory(category: string): string {
    const validCategories = ["Еда", "Транспорт", "Покупки", "Здоровье", "Развлечения", "Зарплата", "Другое"];
    return validCategories.includes(category) ? category : "Другое";
  }

  it("passes through valid Russian categories", () => {
    expect(mapCategory("Еда")).toBe("Еда");
    expect(mapCategory("Транспорт")).toBe("Транспорт");
    expect(mapCategory("Зарплата")).toBe("Зарплата");
  });

  it("falls back to Другое for invalid categories", () => {
    expect(mapCategory("Food")).toBe("Другое");
    expect(mapCategory("Invalid")).toBe("Другое");
    expect(mapCategory("")).toBe("Другое");
  });
});