"use client";

import React from "react";

interface Props {
  blockId: string;
  children: React.ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

export class VBlockErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[VBlockErrorBoundary] Block "${this.props.blockId}" crashed:`,
      error,
      info,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
          <span className="text-2xl">⚠️</span>
          <p className="text-xs text-red-400">משהו השתבש</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRetry?.();
            }}
            className="rounded bg-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-600 transition-colors"
          >
            נסה שוב
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
