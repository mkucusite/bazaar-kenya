import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center gap-4">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            This page failed to load. Please try again or go back to the homepage.
          </p>
          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => (window.location.href = "/")} size="sm">
              Go Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
