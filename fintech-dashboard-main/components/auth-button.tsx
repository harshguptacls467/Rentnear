"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/shared/ui/button";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="outline" size="sm" className="h-9 text-xs" disabled>
        ...
      </Button>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[100px]">
          {session.user.email ?? session.user.name}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs"
          onClick={() => signOut()}
        >
          Выйти
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 text-xs"
      onClick={() => signIn()}
    >
      Войти
    </Button>
  );
}