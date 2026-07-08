import type { Metadata } from "next";
import { StudyDashboard } from "@/components/dashboard/study-dashboard";

export const metadata: Metadata = {
  title: "My Study",
  description:
    "Your bookmarks, highlights, notes, reading streak, and plan progress — stored privately on your device.",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          My Study
        </h1>
        <p className="mt-1 text-muted-foreground">
          Everything you&apos;ve saved lives privately in this browser — no
          account needed.
        </p>
      </div>
      <StudyDashboard />
    </div>
  );
}
