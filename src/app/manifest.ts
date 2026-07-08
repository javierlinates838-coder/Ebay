import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Logos — Advanced Bible Study",
    short_name: "Logos",
    description:
      "Read, listen to, search, and study the Bible in 29 translations across 18 languages — with Greek & Hebrew word study, reading plans, memorization, and quizzes.",
    start_url: "/",
    display: "standalone",
    background_color: "#211A12",
    theme_color: "#211A12",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
