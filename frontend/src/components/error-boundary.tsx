"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-4">
          <div className="max-w-md text-center">
            <h2 className="mb-2 text-2xl font-bold">خطایی رخ داد</h2>
            <p className="mb-4 text-ink-soft">
              متأسفانه مشکلی پیش آمد. لطفاً صفحه را رفرش کنید.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-4 rounded-lg bg-char p-4 text-left text-xs">
                <p className="mb-1 font-mono font-bold text-accent">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-2 max-h-40 overflow-auto text-ink-soft">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="glaze-edge inline-flex items-center rounded-xl bg-lajvard px-6 py-3 text-white"
            >
              صفحه را رفرش کن
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}