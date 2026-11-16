import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-background p-4">
                    <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
                        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-sign-red/10">
                            <AlertCircle className="size-7 text-sign-red" aria-hidden="true" />
                        </div>

                        <h1 className="mb-3 font-heading text-2xl font-extrabold">
                            Something went wrong
                        </h1>

                        <p className="mb-6 leading-relaxed text-muted-foreground">
                            This page hit an unexpected error. Reloading usually fixes it. If it keeps happening, please tell us through the feedback link in the footer.
                        </p>

                        <div className="mb-6 overflow-hidden rounded-lg bg-muted p-3 text-left">
                            <code className="font-mono text-xs break-all text-muted-foreground">
                                {this.state.error?.message}
                            </code>
                        </div>

                        <button
                            onClick={this.handleReload}
                            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-sign-green font-bold text-white hover:bg-sign-green-strong"
                        >
                            <RefreshCw className="size-5" aria-hidden="true" /> Reload the page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
