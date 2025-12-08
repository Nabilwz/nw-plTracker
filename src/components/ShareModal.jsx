import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import {
  X,
  Download,
  Twitter,
  Copy,
  Check,
  Loader2,
  Share2,
  MessageCircle,
} from "lucide-react";
import ScenarioCard from "./ScenarioCard";

function ShareModal({
  isOpen,
  onClose,
  selectedTeam,
  teamPosition,
  teamData,
  scenarios,
  projectedPosition,
  isPremium = false,
}) {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageBlob, setImageBlob] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Pre-generate the image when modal opens
      setTimeout(() => generateImage(), 500);
    } else {
      setImageBlob(null);
    }
  }, [isOpen]);

  const generateImage = async () => {
    if (!cardRef.current) return null;

    setIsGenerating(true);

    try {
      // Wait for images to load
      const images = cardRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve();
              else {
                img.onload = resolve;
                img.onerror = resolve;
              }
            })
        )
      );

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      setImageBlob(blob);
      setIsGenerating(false);
      return blob;
    } catch (error) {
      console.error("Error generating image:", error);
      setIsGenerating(false);
      return null;
    }
  };

  const handleDownload = async () => {
    let blob = imageBlob;
    if (!blob) {
      blob = await generateImage();
    }

    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTeam.name.replace(/\s+/g, "-")}-scenarios-${
        new Date().toISOString().split("T")[0]
      }.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleTwitterShare = async () => {
    const text = `🎯 ${
      selectedTeam.name
    } Best Scenarios\n\n📍 Current: #${teamPosition}\n📈 Projected: #${
      projectedPosition?.projectedPosition || teamPosition
    }\n\nCheck your team's scenarios 👇\n`;
    const url = "https://pltracker.com"; // Replace with your actual URL

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const handleWhatsAppShare = async () => {
    const posChange = projectedPosition?.positionChange || 0;
    const changeText =
      posChange > 0
        ? `📈 Could climb ${posChange} place${posChange > 1 ? "s" : ""}!`
        : posChange < 0
        ? `📉 Could drop ${Math.abs(posChange)} place${
            Math.abs(posChange) > 1 ? "s" : ""
          }`
        : "➡️ Position unchanged";

    const text = `⚽ *${
      selectedTeam.name
    }* Best Scenarios\n\n📍 Current Position: #${teamPosition}\n🎯 Projected Position: #${
      projectedPosition?.projectedPosition || teamPosition
    }\n${changeText}\n\n🔗 Check your team: https://pltracker.com`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `https://pltracker.com?team=${selectedTeam.id}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopyLink();
      return;
    }

    let blob = imageBlob;
    if (!blob) {
      blob = await generateImage();
    }

    try {
      const file = new File([blob], `${selectedTeam.name}-scenarios.png`, {
        type: "image/png",
      });

      await navigator.share({
        title: `${selectedTeam.name} - Best Scenarios`,
        text: `Check out ${selectedTeam.name}'s best scenarios for this round!`,
        files: [file],
      });
    } catch (error) {
      console.log("🚀 ~ handleNativeShare ~ error:", error);
      // Fallback if file sharing not supported
      try {
        await navigator.share({
          title: `${selectedTeam.name} - Best Scenarios`,
          text: `Check out ${selectedTeam.name}'s best scenarios for this round!`,
          url: `https://pltracker.com?team=${selectedTeam.id}`,
        });
      } catch (e) {
        console.log("Share cancelled", e);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden border shadow-2xl bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-2xl border-purple-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Share Scenarios</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Preview */}
        <div className="p-4 overflow-auto max-h-[50vh]">
          <div className="flex justify-center">
            <ScenarioCard
              ref={cardRef}
              selectedTeam={selectedTeam}
              teamPosition={teamPosition}
              teamData={teamData}
              scenarios={scenarios}
              projectedPosition={projectedPosition}
              isPremium={isPremium}
            />
          </div>
        </div>

        {/* Share Options */}
        <div className="p-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white transition-all bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>Download</span>
            </button>

            {/* Native Share (Mobile) */}
            <button
              onClick={handleNativeShare}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Twitter */}
            <button
              onClick={handleTwitterShare}
              className="flex flex-col items-center justify-center gap-1 px-4 py-3 text-white transition-all rounded-xl bg-white/10 hover:bg-white/20"
            >
              <Twitter className="w-5 h-5" />
              <span className="text-xs">Twitter</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center justify-center gap-1 px-4 py-3 text-white transition-all rounded-xl bg-white/10 hover:bg-white/20"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">WhatsApp</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center justify-center gap-1 px-4 py-3 text-white transition-all rounded-xl bg-white/10 hover:bg-white/20"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span className="text-xs">
                {copied ? "Copied!" : "Copy Link"}
              </span>
            </button>
          </div>
        </div>

        {/* Premium Upsell for Free Users */}
        {/* {!isPremium && (
          <div className="p-4 text-center border-t border-white/10 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
            <p className="mb-2 text-sm text-gray-300">
              ✨ Upgrade to{" "}
              <span className="font-bold text-purple-400">Premium</span> for
              watermark-free cards
            </p>
            <button className="px-4 py-2 text-sm font-semibold text-white transition-all rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500">
              Upgrade Now — $2.99/month
            </button>
          </div>
        )} */}
      </div>
    </div>
  );
}

export default ShareModal;
