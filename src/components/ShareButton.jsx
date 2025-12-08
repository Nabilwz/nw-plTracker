import { Share2 } from "lucide-react";

function ShareButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:shadow-purple-500/25"
    >
      <Share2 className="w-4 h-4" />
      <span>Share</span>
    </button>
  );
}

export default ShareButton;
