import { createFileRoute } from "@tanstack/react-router";
import { ScoutApp } from "@/components/scout-app";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Scout — Antique Dealer Intelligence" },
    { name: "description", content: "Screen, value and rank antique and vintage furniture opportunities across European marketplaces." },
    { property: "og:title", content: "Scout — Antique Dealer Intelligence" },
    { property: "og:description", content: "A focused sourcing workspace for antique and vintage furniture dealers." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  return <ScoutApp />;
}
