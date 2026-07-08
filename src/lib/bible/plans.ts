export interface PlanReading {
  bookId: number;
  bookSlug: string;
  bookName: string;
  chapter: number;
  label: string;
}

export interface PlanDay {
  day: number;
  title: string;
  readings: PlanReading[];
}

export interface ReadingPlan {
  id: string;
  name: string;
  tagline: string;
  description: string;
  days: PlanDay[];
  level: "Beginner" | "Intermediate" | "Deep dive";
}

function reading(bookId: number, bookSlug: string, bookName: string, chapter: number): PlanReading {
  return { bookId, bookSlug, bookName, chapter, label: `${bookName} ${chapter}` };
}

const john = (ch: number) => reading(43, "john", "John", ch);
const mark = (ch: number) => reading(41, "mark", "Mark", ch);
const psalm = (ch: number) => reading(19, "psalms", "Psalm", ch);
const proverb = (ch: number) => reading(20, "proverbs", "Proverbs", ch);
const romans = (ch: number) => reading(45, "romans", "Romans", ch);
const genesis = (ch: number) => reading(1, "genesis", "Genesis", ch);

export const PLANS: ReadingPlan[] = [
  {
    id: "john-21",
    name: "Meet Jesus: John in 21 Days",
    tagline: "One chapter a day through the Gospel written 'that you may believe.'",
    description:
      "The Gospel of John was written so that you may believe that Jesus is the Christ, the Son of God, and that by believing you may have life in His name (John 20:31). Read one chapter a day and watch the seven signs and seven 'I am' statements unveil who Jesus is.",
    level: "Beginner",
    days: Array.from({ length: 21 }, (_, i) => ({
      day: i + 1,
      title: `John ${i + 1}`,
      readings: [john(i + 1)],
    })),
  },
  {
    id: "mark-16",
    name: "The Servant King: Mark in 16 Days",
    tagline: "The fastest-paced Gospel, one chapter a day.",
    description:
      "Mark wastes no time — 'immediately' is his favorite word. In sixteen days you will walk with the Servant King from His baptism to the empty tomb, watching Him teach, heal, confront, suffer, and rise.",
    level: "Beginner",
    days: Array.from({ length: 16 }, (_, i) => ({
      day: i + 1,
      title: `Mark ${i + 1}`,
      readings: [mark(i + 1)],
    })),
  },
  {
    id: "psalms-comfort-14",
    name: "Psalms of Comfort",
    tagline: "Fourteen psalms for anxious, weary, or grieving hearts.",
    description:
      "The psalms give us words when we have none. This fourteen-day journey moves through trust, lament, refuge, and praise — from the Shepherd Psalm to the songs of ascent.",
    level: "Beginner",
    days: [23, 27, 34, 42, 46, 51, 62, 63, 84, 91, 103, 116, 121, 139].map((ch, i) => ({
      day: i + 1,
      title: `Psalm ${ch}`,
      readings: [psalm(ch)],
    })),
  },
  {
    id: "proverbs-31",
    name: "A Month of Wisdom: Proverbs",
    tagline: "One chapter of Proverbs for each day of the month.",
    description:
      "Proverbs has 31 chapters — one for every day of the month. This classic discipline saturates your month in practical wisdom: the fear of the LORD, the power of words, diligence, humility, money, and friendship.",
    level: "Intermediate",
    days: Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      title: `Proverbs ${i + 1}`,
      readings: [proverb(i + 1)],
    })),
  },
  {
    id: "romans-16",
    name: "Romans Deep Dive",
    tagline: "Paul's masterpiece of the gospel, one chapter a day.",
    description:
      "Augustine, Luther, and Wesley were each transformed reading Romans. Sixteen days through the most systematic presentation of the gospel in Scripture: sin, justification, sanctification, sovereignty, and living sacrifice.",
    level: "Deep dive",
    days: Array.from({ length: 16 }, (_, i) => ({
      day: i + 1,
      title: `Romans ${i + 1}`,
      readings: [romans(i + 1)],
    })),
  },
  {
    id: "beginnings-14",
    name: "Beginnings: Genesis 1–11 & the Promise",
    tagline: "Creation, fall, flood, and the call of Abraham in 14 days.",
    description:
      "The first chapters of Genesis answer the biggest questions: where did everything come from, what went wrong, and what is God doing about it? Finish with the call of Abraham — the promise that sets up the rest of the Bible.",
    level: "Beginner",
    days: [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 15, 17, 21, 22].map((ch, i) => ({
      day: i + 1,
      title: `Genesis ${ch}`,
      readings: [genesis(ch)],
    })),
  },
  {
    id: "story-of-jesus-30",
    name: "The Story of Jesus in 30 Days",
    tagline: "A curated harmony of the Gospels from birth to resurrection.",
    description:
      "Thirty readings across all four Gospels trace the life of Christ in order: birth, baptism, temptation, sermon on the mount, miracles, parables, the last week, the cross, and the resurrection.",
    level: "Intermediate",
    days: [
      { day: 1, title: "The Word became flesh", readings: [john(1)] },
      { day: 2, title: "Birth of the King", readings: [reading(40, "matthew", "Matthew", 1)] },
      { day: 3, title: "Shepherds and a manger", readings: [reading(42, "luke", "Luke", 2)] },
      { day: 4, title: "Baptism and temptation", readings: [reading(40, "matthew", "Matthew", 3), reading(40, "matthew", "Matthew", 4)] },
      { day: 5, title: "Water into wine", readings: [john(2)] },
      { day: 6, title: "You must be born again", readings: [john(3)] },
      { day: 7, title: "The woman at the well", readings: [john(4)] },
      { day: 8, title: "Blessed are…", readings: [reading(40, "matthew", "Matthew", 5)] },
      { day: 9, title: "The Lord's Prayer", readings: [reading(40, "matthew", "Matthew", 6)] },
      { day: 10, title: "Build on the rock", readings: [reading(40, "matthew", "Matthew", 7)] },
      { day: 11, title: "Authority over everything", readings: [mark(4), mark(5)] },
      { day: 12, title: "Bread of life", readings: [john(6)] },
      { day: 13, title: "Parables of the kingdom", readings: [reading(40, "matthew", "Matthew", 13)] },
      { day: 14, title: "Who do you say I am?", readings: [reading(40, "matthew", "Matthew", 16)] },
      { day: 15, title: "The transfiguration", readings: [reading(40, "matthew", "Matthew", 17)] },
      { day: 16, title: "The good Samaritan", readings: [reading(42, "luke", "Luke", 10)] },
      { day: 17, title: "Lost sheep, coin, and son", readings: [reading(42, "luke", "Luke", 15)] },
      { day: 18, title: "Light of the world", readings: [john(8)] },
      { day: 19, title: "The good shepherd", readings: [john(10)] },
      { day: 20, title: "Lazarus, come forth", readings: [john(11)] },
      { day: 21, title: "The triumphal entry", readings: [reading(40, "matthew", "Matthew", 21)] },
      { day: 22, title: "The greatest commandment", readings: [reading(40, "matthew", "Matthew", 22)] },
      { day: 23, title: "Servant King washes feet", readings: [john(13)] },
      { day: 24, title: "The way, truth, and life", readings: [john(14)] },
      { day: 25, title: "The vine and the branches", readings: [john(15)] },
      { day: 26, title: "Jesus prays for you", readings: [john(17)] },
      { day: 27, title: "Betrayed and condemned", readings: [reading(42, "luke", "Luke", 22)] },
      { day: 28, title: "The crucifixion", readings: [reading(42, "luke", "Luke", 23)] },
      { day: 29, title: "He is risen", readings: [reading(42, "luke", "Luke", 24)] },
      { day: 30, title: "Breakfast by the sea", readings: [john(21)] },
    ],
  },
];

export function getPlan(id: string): ReadingPlan | undefined {
  return PLANS.find((p) => p.id === id);
}
