import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * ErrorBoundary — one broken component must never blank the site.
 *
 * React unmounts the ENTIRE tree when a render throws and nothing
 * catches it. With no boundary anywhere, a single failure — a missing
 * browser API, a WebGL context that will not allocate, a bad texture —
 * left `#root` completely empty: no header, no text, no buttons,
 * nothing. That failure mode is indistinguishable from "the page is
 * broken", and it hides the actual error from everyone.
 *
 * Two guarantees:
 *   - `fallback` keeps the rest of the page alive when a subtree dies
 *   - the real error is logged, and surfaced in the UI during dev so it
 *     can be read without opening the console
 */

interface Props {
  children: ReactNode;
  /** rendered instead of the subtree when it throws; null renders nothing */
  fallback?: ReactNode;
  /** shown in the console to identify which boundary caught it */
  name?: string;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const where = this.props.name ? `[${this.props.name}] ` : "";
    // Always log — this is the only record of what actually failed.
    console.error(`${where}component tree failed:`, error, info.componentStack);
    this.props.onError?.(error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback !== undefined) return this.props.fallback;

    // Default: stay out of the way in production, be loud in development.
    if (import.meta.env.DEV) {
      return (
        <div
          role="alert"
          style={{
            position: "fixed",
            inset: "auto 1rem 1rem 1rem",
            zIndex: 2147483647,
            maxHeight: "40vh",
            overflow: "auto",
            padding: "1rem 1.25rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(255,120,120,0.4)",
            background: "rgba(20,8,10,0.95)",
            color: "#ffd9d9",
            font: "12px/1.5 ui-monospace, monospace",
          }}
        >
          <strong style={{ color: "#ff9d9d" }}>
            {this.props.name ?? "Component"} crashed
          </strong>
          <div style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
            {error.message}
          </div>
        </div>
      );
    }
    return null;
  }
}
