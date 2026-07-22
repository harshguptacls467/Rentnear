import { bumpFinanceDataVersion } from "@/lib/redis/cache";

/** Bump the finance data version so cached AI insights and weekly reports refresh. */
export async function invalidateAiCaches(): Promise<void> {
  await bumpFinanceDataVersion();
}
