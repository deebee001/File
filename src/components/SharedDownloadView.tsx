import React, { useState, useEffect } from "react";
import {
  Download,
  FolderArchive,
  FileCode,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Share2,
  Terminal,
  ExternalLink,
  Clock,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Lock,
  Layers,
  CheckCircle2
} from "lucide-react";
import type { SharedFileInfo, GeneratedPackageRecord } from "../types";
import { formatBytes, formatExactBytes, formatDate } from "../utils/formatters";
import { ShareModal } from "./ShareModal";

interface SharedDownloadViewProps {
  shareId: string;
  initialPassword?: string;
  onExitShare: () => void;
  onOpenVerifierWithPackage: (pkg: GeneratedPackageRecord) => void;
}

export const SharedDownloadView: React.FC<SharedDownloadViewProps> = ({
  shareId,
  initialPassword = "",
  onExitShare,
  onOpenVerifierWithPackage
}) => {
  const [fileInfo, setFileInfo] = useState<SharedFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  // Password visibility and copying
  const [userPassword, setUserPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedDirectLink, setCopiedDirectLink] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);

    fetch(`/api/locked-files/${encodeURIComponent(shareId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed to fetch file details (Status: ${res.status})`);
        }
        return res.json();
      })
      .then((data: SharedFileInfo) => {
        if (isMounted) {
          setFileInfo(data);
          if (!userPassword && data.password && initialPassword) {
            setUserPassword(initialPassword);
          } else if (!userPassword && data.password) {
            // If creator shared without hiding, or query param had it
            setUserPassword(initialPassword || data.password);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Shared file load error:", err);
          setFetchError(err.message || "The shared file could not be found or has expired.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shareId, initialPassword]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const directDownloadUrl = fileInfo?.downloadUrl
    ? `${origin}${fileInfo.downloadUrl}`
    : `${origin}/api/download-locked/${shareId}`;
  const curlCommand = `curl -LO "${directDownloadUrl}"`;

  const handleTriggerDownload = () => {
    if (!fileInfo) return;
    setIsDownloading(true);

    try {
      const a = document.createElement("a");
      a.href = directDownloadUrl;
      a.download = fileInfo.archiveName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadTriggered(true);
      // Increment local count cosmetically
      setFileInfo((prev) => (prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : prev));
    } catch (err) {
      console.error("Download trigger failed:", err);
    } finally {
      setTimeout(() => setIsDownloading(false), 2000);
    }
  };

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(directDownloadUrl);
    setCopiedDirectLink(true);
    setTimeout(() => setCopiedDirectLink(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyPassword = () => {
    if (!userPassword) return;
    navigator.clipboard.writeText(userPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleTestInVerifier = () => {
    if (!fileInfo) return;
    const pkgRecord: GeneratedPackageRecord = {
      id: fileInfo.id,
      archiveName: fileInfo.archiveName,
      fileName: fileInfo.fileName,
      fileExtension: fileInfo.fileExtension,
      payloadBytes: fileInfo.payloadBytes,
      archiveBytes: fileInfo.archiveBytes,
      password: userPassword || fileInfo.password || "",
      encryptionStandard: fileInfo.encryptionStandard,
      dataPattern: fileInfo.dataPattern,
      createdAt: fileInfo.createdAt,
      downloadUrl: fileInfo.downloadUrl
    };
    onOpenVerifierWithPackage(pkgRecord);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-200/90 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
            <FolderArchive className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Locating Shared File...</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Retrieving archive specifications, encryption settings, and streaming endpoints.
          </p>
          <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="w-1/2 h-full bg-indigo-600 rounded-full animate-progress" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (fetchError || !fileInfo) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Shared File Not Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {fetchError || "The requested file record might have expired, been cleared from temporary storage, or the share link is invalid."}
          </p>
          <div className="pt-3">
            <button
              type="button"
              onClick={onExitShare}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go to File Generator</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onExitShare}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to File Generator</span>
        </button>

        <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          ID: {fileInfo.id}
        </span>
      </div>

      {/* Main Shared Download Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 p-6 sm:p-7 text-white relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold text-indigo-100 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted Direct Download</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono break-all">
                {fileInfo.archiveName}
              </h2>
              <p className="text-xs text-indigo-200">
                Created {formatDate(fileInfo.createdAt)} &bull; {fileInfo.downloadCount} {fileInfo.downloadCount === 1 ? "download" : "downloads"}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <span className="inline-block px-3 py-1 bg-white text-indigo-900 rounded-xl font-mono font-bold text-sm shadow-md">
                {formatBytes(fileInfo.archiveBytes)}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* File Spec Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Inner Payload File
              </span>
              <div className="flex items-center gap-2 font-mono font-semibold text-slate-800 truncate">
                <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{fileInfo.fileName}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Exact Payload Size
              </span>
              <div className="flex items-center gap-1 font-mono font-semibold text-slate-800">
                <span className="text-indigo-600 font-bold">{formatBytes(fileInfo.payloadBytes)}</span>
                <span className="text-[10px] text-slate-400">({formatExactBytes(fileInfo.payloadBytes)})</span>
              </div>
            </div>

            <div className="space-y-1 pt-2 sm:pt-0 sm:border-t-0 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Lock Standard
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {fileInfo.encryptionStandard === "aes256" ? "AES-256 (High Security)" : "ZipCrypto (Standard)"}
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-2 sm:pt-0 sm:border-t-0 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Download Architecture
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>High-Capacity ZIP64 Stream</span>
              </div>
            </div>
          </div>

          {/* Optional Password Hint Box */}
          {fileInfo.hasPasswordHint && fileInfo.hintText && (
            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 min-w-0 text-xs">
                <span className="font-bold text-amber-900 block">Creator's Password Hint:</span>
                <p className="text-amber-800 italic break-words">{fileInfo.hintText}</p>
              </div>
            </div>
          )}

          {/* PRIMARY DOWNLOAD BUTTON */}
          <div className="space-y-2">
            <button
              type="button"
              id="btn-direct-download-shared-file"
              onClick={handleTriggerDownload}
              disabled={isDownloading}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-base rounded-2xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
            >
              <Download className={`w-5 h-5 ${isDownloading ? "animate-bounce" : ""}`} />
              <span>
                {isDownloading
                  ? "Starting Stream..."
                  : `Download File Directly (${formatBytes(fileInfo.archiveBytes)})`}
              </span>
            </button>

            {downloadTriggered && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Download started! Check your browser's download manager.</span>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Archive Unlock Password</span>
              </span>
              <span className="text-[11px] font-normal text-indigo-600">
                Required when opening or extracting
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-xl border border-indigo-200 p-1.5 shadow-2xs">
              <input
                type={showPassword ? "text" : "password"}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="Enter unlock password to test..."
                className="flex-1 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none"
              />
              {userPassword && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPassword ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPassword ? "Copied" : "Copy"}</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestInVerifier}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Test Password in In-App Verifier &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share with Others</span>
              </button>
            </div>
          </div>

          {/* Quick Direct Links for Developers & Terminal */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Direct Link & Command Line
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                id="btn-copy-shared-direct-url"
                onClick={handleCopyDirectLink}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">Direct URL</span>
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 shrink-0">
                  {copiedDirectLink ? "Copied!" : "Copy"}
                </span>
              </button>

              <button
                type="button"
                id="btn-copy-shared-curl-cmd"
                onClick={handleCopyCurl}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">cURL Command</span>
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 shrink-0">
                  {copiedCurl ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Need to create your own custom-sized password-locked files?</span>
          <button
            type="button"
            onClick={onExitShare}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            Create a New Locked File
          </button>
        </div>
      </div>

      {/* Forward Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          pkg={{
            id: fileInfo.id,
            archiveName: fileInfo.archiveName,
            fileName: fileInfo.fileName,
            fileExtension: fileInfo.fileExtension,
            payloadBytes: fileInfo.payloadBytes,
            archiveBytes: fileInfo.archiveBytes,
            password: userPassword || fileInfo.password || "",
            encryptionStandard: fileInfo.encryptionStandard,
            dataPattern: fileInfo.dataPattern,
            createdAt: fileInfo.createdAt,
            downloadUrl: fileInfo.downloadUrl
          }}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};
