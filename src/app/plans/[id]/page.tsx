import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PLANS, getPlan } from "@/lib/bible/plans";
import { PlanTracker } from "@/components/plans/plan-tracker";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return PLANS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/plans/[id]">): Promise<Metadata> {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) return { title: "Plan not found" };
  return { title: plan.name, description: plan.tagline };
}

export default async function PlanPage({ params }: PageProps<"/plans/[id]">) {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/plans"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All plans
      </Link>

      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {plan.name}
          </h1>
          <Badge variant="secondary">{plan.days.length} days</Badge>
          <Badge variant="outline">{plan.level}</Badge>
        </div>
        <p className="max-w-2xl text-muted-foreground">{plan.description}</p>
      </div>

      <PlanTracker plan={plan} />
    </div>
  );
}
