import { Metadata } from "next";
import SemanticSearch from "@/components/semantic/SemanticSearch";

export const metadata: Metadata = {
  title: "חיפוש סמנטי בקורסים | GAM Command Center",
  description: "חפש בתוכן הקורסים באמצעות בינה מלאכותית - שאלות, מושגים ונושאים",
};

export default function SemanticSearchPage() {
  return <SemanticSearch />;
}