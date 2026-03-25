import { Metadata } from "next";
import dynamic from "next/dynamic";

const CoursesScreen = dynamic(() => import("@/components/pm/CoursesScreen"), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
    </div>
  ),
});

export const metadata: Metadata = {
  title: "ספריית קורסים | GAM Command Center",
  description: "ספריית קורסים אישית עם תמלולים, סיכומים וכרטיסיות למידה",
};

export default function CoursesPage() {
  return <CoursesScreen />;
}