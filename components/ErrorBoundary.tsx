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
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
                        </div>

                        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                            Something went wrong
                        </h1>

                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            We encountered an unexpected error. Our team has been notified. Please try refreshing the page.
                        </p>

                        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-8 text-left overflow-hidden">
                            <code className="text-xs text-slate-500 font-mono break-all">
                                {this.state.error?.message}
                            </code>
                        </div>

                        <button
                            onClick={this.handleReload}
                            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" /> Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
