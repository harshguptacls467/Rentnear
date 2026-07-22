"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDemoSignIn = async () => {
    if (!email.trim()) return;
    setLoading(true);
    await signIn("credentials", { email: email.trim(), callbackUrl: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-soft !gap-0 !py-0">
        <CardHeader className="pb-1 px-3">
          <CardTitle className="text-sm">Вход в FinTech Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pt-1 space-y-4">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn("github", { callbackUrl: "/" })}
            >
              Войти через GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-muted-foreground">
                или демо-вход
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="demo@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDemoSignIn()}
            />
            <Button onClick={handleDemoSignIn} disabled={loading}>
              {loading ? "..." : "Войти"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}