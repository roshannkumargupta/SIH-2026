import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function SectionPage({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="cream" size="touch">
          <Link to="/" aria-label="Back to home">
            <ArrowLeft aria-hidden="true" /> Back home
          </Link>
        </Button>
        <div className="mt-14 flex items-center gap-5">
          <span className="flex size-16 items-center justify-center rounded-lg bg-sun text-ink">
            {icon}
          </span>
          <h1 className="font-display text-5xl font-bold text-cream sm:text-6xl">{title}</h1>
        </div>
        <div className="mt-10 rounded-xl border border-clay bg-surface p-7 text-xl leading-relaxed text-cream sm:p-10">
          {children}
        </div>
      </div>
    </main>
  );
}
