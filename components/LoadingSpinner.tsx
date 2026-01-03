import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-[50vh] w-full">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Loading MyAutoSpex...</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
