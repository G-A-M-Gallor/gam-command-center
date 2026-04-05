/**
 * Design System Demo Component
 * Showcases the vBrain.io professional design system in action
 */
"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { designTokens, classNames } from "@/lib/designSystem";
import { Palette, CheckCircle, Zap, Globe } from "lucide-react";

export function DesignSystemDemo() {
  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary-400 mb-2">
          🎨 מערכת העיצוב המקצועית של vBrain.io
        </h1>
        <p className="text-slate-400">
          עיצוב מקצועי עם תמיכה מלאה בעברית וכיוון RTL
        </p>
      </div>

      {/* Color Palette Demo */}
      <Card className={classNames.card}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary-400" />
            פלטת הצבעים המקצועית
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(designTokens.colors.primary).map(([shade, color]) => (
              <div key={shade} className="text-center">
                <div
                  className="h-16 w-full rounded-lg mb-2 shadow-md"
                  style={{ backgroundColor: color }}
                />
                <p className="text-xs text-slate-400">Primary {shade}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Buttons Demo */}
      <Card className={classNames.card}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary-400" />
            כפתורים מקצועיים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 justify-center">
            <Button variant="primary" icon={CheckCircle}>
              כפתור ראשי
            </Button>
            <Button variant="secondary">
              כפתור משני
            </Button>
            <Button variant="ghost">
              כפתור רפאים
            </Button>
            <Button variant="danger">
              כפתור מסוכן
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Typography Demo */}
      <Card className={classNames.card}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary-400" />
            טיפוגרפיה עברית מקצועית
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              כותרת ראשית גדולה
            </h1>
            <h2 className="text-2xl font-semibold text-slate-200 mb-2">
              כותרת משנה בינונית
            </h2>
            <h3 className="text-xl font-medium text-slate-300 mb-2">
              כותרת קטנה
            </h3>
            <p className="text-base text-slate-400 leading-relaxed">
              טקסט רגיל בעברית עם רווח שורות אופטימלי לקריאה נוחה ומקצועית.
              הטקסט מיושר לימין באופן טבעי ונתמך על ידי מערכת העיצוב החדשה.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              טקסט קטן להערות ופירוט נוסף
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-emerald-400 text-center">
              ✅ הצלחה
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20 hover:border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-400 text-center">
              ⚠️ אזהרה
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20 hover:border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-400 text-center">
              ❌ שגיאה
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20 hover:border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-400 text-center">
              ℹ️ מידע
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Success Message */}
      <div className="text-center p-6 bg-primary-500/10 border border-primary-500/20 rounded-lg">
        <CheckCircle className="h-8 w-8 text-primary-400 mx-auto mb-2" />
        <p className="text-primary-300 font-medium">
          🎉 מערכת העיצוב המקצועית פועלת בהצלחה!
        </p>
        <p className="text-primary-400/80 text-sm mt-1">
          עיצוב מקצועי, תמיכה בעברית RTL, וחווית משתמש משופרת
        </p>
      </div>
    </div>
  );
}