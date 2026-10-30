import React, { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error caught by ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#09090b",
            color: "#f4f4f5",
            padding: 24,
            fontFamily: "Inter, system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <div
            style={{
              background: "#18181b",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 16,
              padding: "32px 28px",
              maxWidth: 420,
              boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 8, color: "#facc15" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5, marginBottom: 20 }}>
              Loopin encountered a rendering glitch. Click below to reload and safely resume your chat.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                background: "#facc15",
                color: "#000",
                fontWeight: 600,
                fontSize: 13,
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
