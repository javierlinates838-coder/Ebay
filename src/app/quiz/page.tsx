import type { Metadata } from "next";
import { QuizGame } from "@/components/quiz/quiz-game";

export const metadata: Metadata = {
  title: "Bible Knowledge Quiz",
  description:
    "Test your Bible knowledge across difficulty levels with explanations and Scripture references for every answer.",
};

export default function QuizPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Bible Knowledge Quiz
        </h1>
        <p className="mt-1 text-muted-foreground">
          Ten questions per round. Every answer comes with an explanation and a
          reference, so even wrong answers teach you something.
        </p>
      </div>
      <QuizGame />
    </div>
  );
}
