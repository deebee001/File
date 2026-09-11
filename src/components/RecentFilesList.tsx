import React, { useState } from "react";
import {
  FolderArchive,
  FileCode,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Share2
} from "lucide-react";
import type { GeneratedPackageRecord } from "../types";
import { formatBytes, formatExactBytes, formatDate } from "../utils/formatters";

interface RecentFilesListProps {
  files: GeneratedPackageRecord[];
  onDownload: (pkg: GeneratedPackageRecord) => void;
  onTestInVerifier: (pkg: GeneratedPackageRecord) => void;
  onShare: (pkg: GeneratedPackageRecord) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const RecentFilesList: React.FC<RecentFilesListProps> = ({
  files,
  onDownload,
  onTestInVerifier,
  onShare,
  onDelete,
  onClearAll
}) => {
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyPassword = (id: string, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-200/90 shadow-xs text-center max-w-2xl mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <FolderArchive className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No Locked Files Generated Yet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Files you create will appear here so you can retrieve passwords, re-download archives, or verify them anytime during your session.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Recent Locked Files ({files.length})
          </h2>
          <p className="text-xs text-slate-500">
            Easily re-download files and review unlock passwords.
          </p>
        </div>
        {files.length > 1 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      <div className="space-y-3">
        {files.map((pkg) => {
          const isRevealed = revealedPasswords[pkg.id] ?? false;
          const isCopied = copiedId === pkg.id;

          return (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* File Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    {pkg.archiveName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {formatBytes(pkg.payloadBytes)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    {pkg.encryptionStandard.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1 font-mono">
                    <FileCode className="w-3.5 h-3.5 text-slate-400" />
                    {pkg.fileName} ({formatExactBytes(pkg.payloadBytes)})
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(pkg.createdAt)}
                  </span>
                </div>

                {/* Password display row */}
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-indigo-600" />
                    Password:
                  </span>
                  <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 text-xs font-mono">
                    <span className="text-slate-800 font-semibold">
                      {isRevealed ? pkg.password : "••••••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleReveal(pkg.id)}
                      className="text-slate-400 hover:text-slate-600 ml-1"
                      title={isRevealed ? "Hide" : "Reveal"}
                    >
                      {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPassword(pkg.id, pkg.password)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 px-1.5 py-0.5 rounded hover:bg-indigo-50"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  type="button"
                  id={`btn-download-${pkg.id}`}
                  onClick={() => onDownload(pkg)}
                  className="flex-1 md:flex-none px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  id={`btn-share-${pkg.id}`}
                  onClick={() => onShare(pkg)}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Share download link with others"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button
                  type="button"
                  id={`btn-verify-${pkg.id}`}
                  onClick={() => onTestInVerifier(pkg)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Test password in verifier"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Verify</span>
                </button>

                <button
                  type="button"
                  id={`btn-delete-${pkg.id}`}
                  onClick={() => onDelete(pkg.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
