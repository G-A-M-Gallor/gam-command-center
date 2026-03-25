import { Metadata } from "next";
import ToolkitScreen from "@/components/pm/ToolkitScreen";

export const metadata: Metadata = {
  title: "ארגז כלים | Command Center",
  description: "כלים לפיתוח, AI ותוכניות",
};

export default function ToolkitPage() {
  return <ToolkitScreen />;
}