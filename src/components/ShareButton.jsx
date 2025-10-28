import { Share2, Check, Copy } from "lucide-react";
import { useState } from "react";

function ShareButton({ title, text, url }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "PL Position Tracker",
          text: text || "Check out these match scenarios!",
          url: url || window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled", err);
      }
    } else {
      // Fallback: Copy to clipboard
      const shareText = `${title || "PL Position Tracker"}\n${text || ""}\n${
        url || window.location.href
      }`;
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          {navigator.share ? (
            <Share2 className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          Share
        </>
      )}
    </button>
  );
}

export default ShareButton;
