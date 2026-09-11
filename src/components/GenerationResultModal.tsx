import React, { useState } from "react";
import {
  CheckCircle2,
  Download,
  Copy,
  Check,
  KeyRound,
  ShieldCheck,
  FolderArchive,
  FileCode,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Terminal,
  Share2
} from "lucide-react";
import type { GeneratedPackageRecord } from "../types";
import { formatBytes, formatExactBytes } from "../utils/formatters";

interface GenerationResultModalProps {
  pkg: GeneratedPackageRecord;
  onClose: () => void;
  onVerifyInApp: (pkg: GeneratedPackageRecord) => void;
  onDownload: (pkg: GeneratedPackageRecord) => void;
  onShare: (pkg: GeneratedPackageRecord) => void;
}

export const GenerationResultModal: React.FC<GenerationResultModalProps> = ({
  pkg,
  onClose,
  onVerifyInApp,
  onDownload,
  onShare
}) => {
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurl, setShowCurl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(pkg.password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const curlCommand = pkg.downloadUrl
    ? `curl -O "${window.location.origin}${pkg.downloadUrl}"`
    : `# Generated locally in browser`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-6 text-white text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-white/10 ring-4 ring-white/20 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Locked Archive Created!</h3>
          <p className="text-xs text-indigo-200 mt-1 max-w-md mx-auto">
            Your file has been generated to the exact required size and locked with password encryption.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* File details container */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
            {/* Archive & File Names */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <FolderArchive className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Downloadable Archive
                  </span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {pkg.archiveName}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs">
                {formatBytes(pkg.archiveBytes)}
              </span>
            </div>

            {/* Inner Payload Details */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Encrypted Payload File
                  </span>
                  <span className="text-sm font-semibold text-slate-800 font-mono">
                    {pkg.fileName}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-indigo-600 block">
                  {formatBytes(pkg.payloadBytes)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatExactBytes(pkg.payloadBytes)}
                </span>
              </div>
            </div>

            {/* Encryption Standard */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Encryption Standard:
              </span>
              <span className="font-bold text-slate-800 uppercase">
                {pkg.encryptionStandard === "aes256" ? "AES-256 (WinZip / 7-Zip)" : "ZipCrypto (PKWARE Standard)"}
              </span>
            </div>
          </div>

          {/* Password Box */}
          <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Archive Unlock Password:</span>
              </span>
              <span className="text-[11px] text-indigo-600 font-normal">
                Save this password to extract the file
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-xl border border-indigo-200 p-1.5 shadow-2xs">
              <input
                type={showPassword ? "text" : "password"}
                readOnly
                value={pkg.password}
                className="flex-1 px-2.5 py-1 text-sm font-mono font-bold text-slate-900 bg-transparent focus:outline-none select-all"
              />
              <button
                type="button"
                id="modal-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                id="modal-copy-password"
                onClick={handleCopyPassword}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedPassword ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-download-locked-archive"
                onClick={() => onDownload(pkg)}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download ({formatBytes(pkg.archiveBytes)})</span>
              </button>

              <button
                type="button"
                id="btn-share-locked-archive"
                onClick={() => onShare(pkg)}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share with Others</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-verify-password-in-app"
                onClick={() => {
                  onClose();
                  onVerifyInApp(pkg);
                }}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Test in Verifier</span>
              </button>

              <button
                type="button"
                id="btn-create-another"
                onClick={onClose}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Create Another</span>
              </button>
            </div>
          </div>

          {/* cURL & Developer Share snippet toggle */}
          {pkg.downloadUrl && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                id="toggle-curl-command"
                onClick={() => setShowCurl(!showCurl)}
                className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showCurl ? "Hide" : "Show"} Direct cURL Download Command</span>
              </button>

              {showCurl && (
                <div className="mt-2 p-2.5 bg-slate-900 rounded-xl text-slate-200 font-mono text-[11px] flex items-center justify-between gap-2">
                  <span className="truncate">{curlCommand}</span>
                  <button
                    type="button"
                    onClick={handleCopyCurl}
                    className="shrink-0 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-semibold"
                  >
                    {copiedCurl ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
