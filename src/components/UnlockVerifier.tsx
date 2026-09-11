import React, { useState, useRef } from "react";
import {
  KeyRound,
  Upload,
  CheckCircle2,
  XCircle,
  FolderArchive,
  FileCode,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  RefreshCw,
  FileText
} from "lucide-react";
import type { VerificationResult, GeneratedPackageRecord } from "../types";
import { verifyLockedZip } from "../utils/fileGenerator";
import { formatBytes, formatExactBytes } from "../utils/formatters";

interface UnlockVerifierProps {
  preloadedPackage?: GeneratedPackageRecord | null;
  onClearPreloaded?: () => void;
}

export const UnlockVerifier: React.FC<UnlockVerifierProps> = ({
  preloadedPackage,
  onClearPreloaded
}) => {
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(
    preloadedPackage?.blob || null
  );
  const [fileName, setFileName] = useState<string>(
    preloadedPackage?.archiveName || ""
  );
  const [password, setPassword] = useState<string>(
    preloadedPackage?.password || ""
  );
  const [showPassword, setShowPassword] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
    setResult(null);
    onClearPreloaded?.();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.name.toLowerCase().endsWith(".zip") || f.type.includes("zip")) {
        handleFileChange(f);
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsVerifying(true);
    setResult(null);

    try {
      const res = await verifyLockedZip(selectedFile, password);
      setResult(res);
    } catch (err: any) {
      setResult({
        success: false,
        testedPassword: password,
        archiveName: fileName || "archive.zip",
        archiveSize: selectedFile.size,
        entries: [],
        totalExtractedBytes: 0,
        errorMessage: err.message || "Failed to verify archive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">
                Password Lockbox Verifier
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Test and verify that your password unlocks the archive and confirms its required payload size.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          {/* File selector zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select or Drop Password-Locked ZIP File
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-indigo-600 bg-indigo-50/50"
                  : selectedFile
                  ? "border-emerald-400 bg-emerald-50/30"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 font-mono block">
                      {fileName}
                    </span>
                    <span className="text-xs text-slate-500">
                      Archive Size: {formatBytes(selectedFile.size)} ({formatExactBytes(selectedFile.size)})
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-600 font-semibold hover:underline">
                    Click to choose a different ZIP file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    Click or drag & drop a locked ZIP file here
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Accepts AES-256 and ZipCrypto encrypted ZIP files up to 5 GB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="input-verify-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enter Password to Unlock
            </label>

            <div className="flex items-stretch rounded-xl border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-white overflow-hidden shadow-2xs">
              <span className="inline-flex items-center px-3.5 bg-slate-50 border-r border-slate-200 text-slate-500 text-xs font-semibold">
                <KeyRound className="w-4 h-4 text-slate-400" />
              </span>
              <input
                id="input-verify-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type the password used to lock the archive"
                className="flex-1 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none"
                required
              />
              <button
                type="button"
                id="btn-verify-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3 text-slate-400 hover:text-slate-700 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            id="btn-run-verify"
            disabled={!selectedFile || isVerifying}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Decrypting & Verifying...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Unlock & Verify Archive</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verification Results Display */}
      {result && (
        <div
          className={`rounded-2xl p-5 sm:p-6 border transition-all ${
            result.success
              ? "bg-white border-emerald-200 shadow-sm"
              : "bg-white border-rose-200 shadow-sm"
          }`}
        >
          {result.success ? (
            <div className="space-y-4">
              {/* Success Header */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-emerald-950">
                    Password Verified! Decryption Succeeded
                  </h3>
                  <p className="text-xs text-slate-500">
                    The archive was unlocked with the correct password. All payload entries are intact.
                  </p>
                </div>
              </div>

              {/* Stats Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 block">Archive Size</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {formatBytes(result.archiveSize)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 block">Extracted Payload</span>
                  <span className="text-sm font-bold text-indigo-600 font-mono">
                    {formatBytes(result.totalExtractedBytes)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-bold text-slate-500 block">Decrypted Files</span>
                  <span className="text-sm font-bold text-slate-900">
                    {result.entries.length} file{result.entries.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Extracted Files List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Decrypted Archive Contents:
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {result.entries.map((entry, idx) => (
                    <div key={idx} className="p-3 bg-white flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {entry.filename}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-600">
                          {formatBytes(entry.uncompressedSize)} ({formatExactBytes(entry.uncompressedSize)})
                        </span>
                      </div>

                      {entry.previewSnippet && (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-700 border border-slate-200/70 overflow-x-auto whitespace-pre-wrap max-h-24">
                          {entry.previewSnippet}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-950">
                  Decryption Failed
                </h3>
                <p className="text-xs text-rose-800">
                  {result.errorMessage || "The provided password was unable to unlock the archive. Please check the password and try again."}
                </p>
                <div className="pt-2 text-[11px] text-slate-500">
                  Tested password: <code className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{result.testedPassword || "(empty)"}</code>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
