"use client";

import dynamic from "next/dynamic";

const FloatingAIChatInner = dynamic(
  () => import("@/widgets/ai-chat/ui/floating-ai-chat").then((m) => ({ default: m.FloatingAIChat })),
  { ssr: false },
);

export function FloatingAIChatWrapper() {
  return <FloatingAIChatInner />;
}