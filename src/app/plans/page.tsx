import type { Metadata } from "next";
import { PLANS } from "@/lib/bible/plans";
import { PlanGrid } from "@/components/plans/plan-grid";

export const metadata: Metadata = {
  title: "Reading Plans",
  description:
    "Guided Bible reading plans with day-by-day progress: the Gospel of John, Psalms of comfort, a month of Proverbs, Romans, and more.",
};

export default function PlansPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Reading Plans
        </h1>
        <p className="mt-1 text-muted-foreground">
          A little every day beats a lot once in a while. Pick a plan, check off
          each day, and build a habit that lasts.
        </p>
      </div>
      <PlanGrid plans={PLANS} />
    </div>
  );
}
