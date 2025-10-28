import { AlertCircle, RefreshCw } from "lucide-react";

function ErrorDisplay({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <AlertCircle className="w-12 h-12 text-yellow-400 mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Unable to load data</h3>
      <p className="text-gray-400 mb-6 text-center max-w-md">
        {message || "There was a problem fetching the data. Please try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorDisplay;
