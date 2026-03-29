import { Shield, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-6">
          <Shield className="w-8 h-8 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-4">
          גישה לא מורשית
        </h1>

        {/* Description */}
        <div className="text-slate-400 mb-8 space-y-2">
          <p>אין לך הרשאה לגשת לדף זה.</p>
          <p className="text-sm">
            אנא פנה למנהל המערכת אם אתה חושב שזו שגיאה.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            חזור לדף הבית
          </Link>

          <Link
            href="/auth/login"
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            חזור להתחברות
          </Link>
        </div>

        {/* Help */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            זקוק לעזרה? פנה לתמיכה הטכנית
          </p>
        </div>
      </div>
    </div>
  );
}