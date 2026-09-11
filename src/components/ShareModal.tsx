import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Download,
  Link,
  Terminal,
  Shield,
  KeyRound,
  ExternalLink,
  FolderArchive,
  X,
  Lock,
  Globe
} from "lucide-react";
import type { GeneratedPackageRecord } from "../types";
import { formatBytes } from "../utils/formatters";

interface ShareModalProps {
  pkg: GeneratedPackageRecord;
  onClose: () => void;
  onDirectDownload?: (pkg: GeneratedPackageRecord) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  pkg,
  onClose,
  onDirectDownload
}) => {
  const [activeShareTab, setActiveShareTab] = useState<"web" | "direct" | "cli">("web");
  const [includePasswordInLink, setIncludePasswordInLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // Web landing page share link
  const webShareUrl = includePasswordInLink
    ? `${origin}/?share=${encodeURIComponent(pkg.id)}&key=${encodeURIComponent(pkg.password)}`
    : `${origin}/?share=${encodeURIComponent(pkg.id)}`;

  // Direct raw archive download link
  const directDownloadUrl = pkg.downloadUrl
    ? `${origin}${pkg.downloadUrl}`
    : `${origin}/api/download-locked/${pkg.id}`;

  // CLI curl command
  const curlCommand = `curl -LO "${directDownloadUrl}"`;

  const handleCopyWebLink = () => {
    navigator.clipboard.writeText(webShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyDirect = () => {
    navigator.clipboard.writeText(directDownloadUrl);
    setCopiedDirect(true);
    setTimeout(() => setCopiedDirect(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(pkg.password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Download ${pkg.archiveName}`,
          text: `Download locked archive "${pkg.archiveName}" (${formatBytes(pkg.archiveBytes)})`,
          url: webShareUrl
        });
      } catch {
        // User dismissed share dialog
      }
    } else {
      handleCopyWebLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Share Locked File</h3>
              <p className="text-xs text-slate-400">
                Allow others to download this file directly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* File Snapshot */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                <FolderArchive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-slate-900 font-mono block truncate">
                  {pkg.archiveName}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {pkg.fileName} &bull; {pkg.encryptionStandard.toUpperCase()}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-indigo-700 shrink-0">
              {formatBytes(pkg.archiveBytes)}
            </span>
          </div>

          {/* Share Channels Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveShareTab("web")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeShareTab === "web"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web Page Link</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveShareTab("direct")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeShareTab === "direct"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Direct File URL</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveShareTab("cli")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeShareTab === "cli"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>cURL Command</span>
            </button>
          </div>

          {/* Tab 1: Web Page Share Link */}
          {activeShareTab === "web" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-xs text-slate-600">
                Recipients opening this link get a dedicated download page with file details and a direct download trigger.
              </p>

              {/* Password Inclusion Option */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 cursor-pointer hover:bg-indigo-50/80 transition-colors">
                <input
                  type="checkbox"
                  checked={includePasswordInLink}
                  onChange={(e) => setIncludePasswordInLink(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    Include unlock password in share link
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {includePasswordInLink
                      ? "Password will be pre-filled so the recipient can unlock and inspect the file right away."
                      : "Recommended for privacy. You can provide the unlock password to the recipient through a separate secure message."}
                  </p>
                </div>
              </label>

              {/* Link Box */}
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 p-1.5">
                <input
                  type="text"
                  readOnly
                  value={webShareUrl}
                  className="flex-1 px-2.5 py-1 text-xs font-mono text-slate-700 bg-transparent focus:outline-none select-all truncate"
                />
                <button
                  type="button"
                  id="btn-copy-web-share-link"
                  onClick={handleCopyWebLink}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share via Device (WhatsApp, AirDrop, Email...)</span>
                </button>
              )}
            </div>
          )}

          {/* Tab 2: Direct File Download URL */}
          {activeShareTab === "direct" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-xs text-slate-600">
                Direct binary download URL. Clicking or pasting this URL immediately initiates the archive stream download without any web landing interface.
              </p>

              <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 p-1.5">
                <input
                  type="text"
                  readOnly
                  value={directDownloadUrl}
                  className="flex-1 px-2.5 py-1 text-xs font-mono text-slate-700 bg-transparent focus:outline-none select-all truncate"
                />
                <button
                  type="button"
                  id="btn-copy-direct-download-url"
                  onClick={handleCopyDirect}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                >
                  {copiedDirect ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={directDownloadUrl}
                  download={pkg.archiveName}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Test Direct Download in Browser</span>
                </a>
              </div>
            </div>
          )}

          {/* Tab 3: cURL Command */}
          {activeShareTab === "cli" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-xs text-slate-600">
                Run this command in any terminal (macOS, Linux, Windows WSL/PowerShell) to stream and save the file directly to your working directory.
              </p>

              <div className="p-3 bg-slate-900 rounded-xl text-slate-200 font-mono text-xs flex items-center justify-between gap-3">
                <span className="truncate select-all text-emerald-400">{curlCommand}</span>
                <button
                  type="button"
                  id="btn-copy-curl-share-command"
                  onClick={handleCopyCurl}
                  className="shrink-0 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition-colors"
                >
                  {copiedCurl ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {/* Password Reminder Strip */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Unlock Password:</span>
              <code className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-mono">
                {pkg.password}
              </code>
            </div>
            <button
              type="button"
              onClick={handleCopyPassword}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              {copiedPassword ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPassword ? "Copied" : "Copy Password"}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
