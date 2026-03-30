import { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "lucide-react";

interface GoogleDriveConnectionProps {
  isConnecting: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const GoogleDriveConnection = ({
  isConnecting,
  isConnected,
  onConnect,
  onDisconnect
}: GoogleDriveConnectionProps) => {
  return (
    <div className="border-t border-slate-700 pt-4">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        חיבור ל-Google Drive (אופציונלי)
      </label>
      <div className="space-y-2">
        <p className="text-xs text-slate-400">
          חבר תיקיה מ-Google Drive כדי לסנכרן קבצי קורס אוטומטית
        </p>
        {!isConnected ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onConnect}
            disabled={isConnecting}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-600"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-300 me-2"></div>
                מתחבר ל-Google Drive...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 me-2" />
                התחבר ל-Google Drive
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700 rounded-md">
            <div className="flex items-center text-green-300">
              <div className="h-2 w-2 bg-green-400 rounded-full me-2"></div>
              חובר בהצלחה ל-Google Drive
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDisconnect}
              className="text-slate-400 hover:text-slate-200"
            >
              נתק
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};