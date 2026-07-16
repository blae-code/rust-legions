import React from "react";

// Catches render crashes inside a 3D scene and remounts it instead of letting
// the whole app white-screen. Transient WebGL/prop races recover on retry;
// persistent failures surface a reload plate in the house style.
export default class SceneErrorBoundary extends React.Component {
  state = { error: null, retries: 0 };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch() {
    // Auto-remount the scene — transient mount races recover on a fresh attempt
    if (this.state.retries < 2) {
      this.timer = setTimeout(() => {
        this.setState((s) => ({ error: null, retries: s.retries + 1 }));
      }, 300);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  render() {
    if (this.state.error && this.state.retries >= 2) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="font-mono text-[10px] tracking-widest text-rust">⚠ TACTICAL FEED INTERRUPTED — SIGNAL LOST</p>
          <button
            onClick={() => this.setState({ error: null, retries: 0 })}
            className="cq-metal font-heading uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-sm border border-brass/60 text-brass-bright hover:text-foreground transition-colors"
          >
            Re-establish Feed
          </button>
        </div>
      );
    }
    if (this.state.error) return null; // remounting
    return this.props.children;
  }
}