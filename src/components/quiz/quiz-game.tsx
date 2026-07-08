"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Flame,
  GraduationCap,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import { QUIZ_QUESTIONS, type QuizDifficulty, type QuizQuestion } from "@/lib/bible/quiz";
import { getQuizStats, recordQuizRound, STUDY_EVENT, type QuizStats } from "@/lib/study/storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROUND_SIZE = 10;

type Phase = "setup" | "playing" | "done";
type DifficultyFilter = "all" | QuizDifficulty;

function pickQuestions(difficulty: DifficultyFilter): QuizQuestion[] {
  const pool =
    difficulty === "all"
      ? QUIZ_QUESTIONS
      : QUIZ_QUESTIONS.filter((q) => q.difficulty === difficulty);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(ROUND_SIZE, shuffled.length));
}

export function QuizGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [stats, setStats] = useState<QuizStats | null>(null);

  useEffect(() => {
    const sync = () => setStats(getQuizStats());
    sync();
    window.addEventListener(STUDY_EVENT, sync);
    return () => window.removeEventListener(STUDY_EVENT, sync);
  }, []);

  const start = () => {
    setQuestions(pickQuestions(difficulty));
    setIndex(0);
    setPicked(null);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setPhase("playing");
  };

  const question = questions[index];

  const choose = (optionIndex: number) => {
    if (picked !== null) return;
    setPicked(optionIndex);
    const correct = optionIndex === question.answer;
    if (correct) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setPicked(null);
    } else {
      recordQuizRound(correctCount, questions.length, bestStreak);
      setPhase("done");
    }
  };

  if (phase === "setup") {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-5 py-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <GraduationCap className="size-7" />
            </span>
            <div>
              <h2 className="font-heading text-xl font-semibold">Choose your difficulty</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {QUIZ_QUESTIONS.length} questions in the bank — each round draws{" "}
                {ROUND_SIZE} at random.
              </p>
            </div>
            <Tabs value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyFilter)}>
              <TabsList>
                <TabsTrigger value="all">Mixed</TabsTrigger>
                <TabsTrigger value="easy">Easy</TabsTrigger>
                <TabsTrigger value="medium">Medium</TabsTrigger>
                <TabsTrigger value="hard">Hard</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="lg" onClick={start}>
              Start round
            </Button>
          </CardContent>
        </Card>

        {stats && stats.played > 0 && (
          <Card size="sm">
            <CardContent className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="font-heading text-2xl font-semibold text-primary">{stats.played}</div>
                <div className="text-xs text-muted-foreground">Rounds played</div>
              </div>
              <div>
                <div className="font-heading text-2xl font-semibold text-primary">
                  {stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Lifetime accuracy</div>
              </div>
              <div>
                <div className="font-heading text-2xl font-semibold text-primary">{stats.bestStreak}</div>
                <div className="text-xs text-muted-foreground">Best streak</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (phase === "done") {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <Trophy className="size-10 text-primary" />
          <h2 className="font-heading text-2xl font-semibold">
            {correctCount} / {questions.length} correct
          </h2>
          <p className="text-muted-foreground">
            {pct === 100
              ? "Perfect round — a true scribe!"
              : pct >= 70
                ? "Well done — your Bible knowledge is strong."
                : pct >= 40
                  ? "Good effort — the explanations below each answer are the best teacher."
                  : "Every scholar starts somewhere — try an easy round next."}
          </p>
          {bestStreak >= 3 && (
            <Badge variant="secondary" className="gap-1">
              <Flame className="size-3 text-primary" />
              Best streak this round: {bestStreak}
            </Badge>
          )}
          <Button size="lg" onClick={() => setPhase("setup")}>
            <RotateCcw data-icon="inline-start" />
            Play again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span className="flex items-center gap-3">
          {streak >= 2 && (
            <span className="flex items-center gap-1 font-medium text-primary">
              <Flame className="size-4" /> {streak} in a row
            </span>
          )}
          <span>{correctCount} correct</span>
        </span>
      </div>
      <Progress value={(index / questions.length) * 100} aria-label="Quiz progress" />

      <Card>
        <CardContent className="flex flex-col gap-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{question.category}</Badge>
            <Badge
              variant="outline"
              className={cn(
                "border-0 capitalize",
                question.difficulty === "easy" && "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
                question.difficulty === "medium" && "bg-amber-500/12 text-amber-700 dark:text-amber-400",
                question.difficulty === "hard" && "bg-rose-500/12 text-rose-700 dark:text-rose-400"
              )}
            >
              {question.difficulty}
            </Badge>
          </div>
          <h2 className="font-heading text-xl font-semibold text-balance">
            {question.question}
          </h2>
          <div className="flex flex-col gap-2">
            {question.options.map((option, i) => {
              const isAnswer = i === question.answer;
              const isPicked = i === picked;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border p-3 text-left text-sm font-medium transition-colors",
                    picked === null && "hover:border-primary hover:bg-accent",
                    picked !== null && isAnswer && "border-emerald-500/60 bg-emerald-500/10",
                    picked !== null && isPicked && !isAnswer && "border-rose-500/60 bg-rose-500/10",
                    picked !== null && !isPicked && !isAnswer && "opacity-60"
                  )}
                >
                  {option}
                  {picked !== null && isAnswer && (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {picked !== null && isPicked && !isAnswer && (
                    <XCircle className="size-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className="rounded-xl bg-muted/60 p-4 text-sm">
              <p className="mb-1 font-semibold">
                {picked === question.answer ? "Correct!" : "Not quite."}
              </p>
              <p className="text-muted-foreground">{question.explanation}</p>
              <p className="mt-2 text-xs font-medium text-primary">{question.reference}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {picked !== null && (
        <Button size="lg" className="self-end" onClick={next}>
          {index < questions.length - 1 ? "Next question" : "See results"}
        </Button>
      )}
    </div>
  );
}
