import React from "react";
import { X, Shield, Lock, Sliders, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">
                How It Works & Security Architecture
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Understanding file creation, exact sizing, and ZIP password encryption.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-600 leading-relaxed">
          {/* Section 1: Exact Size Generation & 5GB Streaming */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>1. How Exact Required Sizes (Up to 5 GB) Work</span>
            </div>
            <p>
              When you specify a target file size—from 1 Byte all the way up to 5 GB (5,368,709,120 bytes)—the generator creates a byte payload matching that exact byte count. For files larger than 4 GB, standard 64-bit ZIP64 extensions are automatically applied so that operating systems and archivers can process the archive without truncation.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="font-bold text-slate-800 block">Data Pattern Options:</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-slate-800">High-Entropy Random:</strong> Fills the file with cryptographically random bytes. Because random data has 100% entropy and zero repetition, standard compression algorithms cannot shrink it. This ensures that both the extracted file AND the encrypted ZIP archive match the required size!
                </li>
                <li>
                  <strong className="text-slate-800">Custom Secret Note:</strong> Encodes your custom text and pads the remaining space with structured integrity markers up to the exact byte limit.
                </li>
                <li>
                  <strong className="text-slate-800">Structured Server Logs:</strong> Generates realistic timestamped audit log entries matching your requested size.
                </li>
                <li>
                  <strong className="text-slate-800">Binary Nulls (0x00):</strong> Generates sparse null bytes, useful for storage dummy testing.
                </li>
              </ul>
            </div>
            <p className="text-[11px] text-indigo-700 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
              <strong>High-Capacity Streaming Engine:</strong> Files up to 5 GB are generated on-the-fly via chunked HTTP streaming. This enables downloading multi-gigabyte password-locked archives directly to your disk without overloading browser memory.
            </p>
          </div>

          {/* Section 2: Encryption Standards */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>2. AES-256 vs. ZipCrypto Encryption</span>
            </div>
            <p>
              ZIP archives support two primary encryption algorithms:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <span className="font-bold text-indigo-950 block mb-1">AES-256 (Recommended)</span>
                <p className="text-[11px] text-slate-600">
                  Modern, military-grade 256-bit encryption. Requires 7-Zip, WinRAR, modern macOS Archive Utility, or specialized software to open. Highly resistant to brute-force attacks.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">ZipCrypto (PKWARE Legacy)</span>
                <p className="text-[11px] text-slate-600">
                  Traditional ZIP encryption. Can be opened natively in older Windows Explorer without needing extra tools installed. Slightly lower cryptographic resistance compared to AES-256.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: How to Extract / Open */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>3. How to Extract the Downloaded ZIP</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Windows:</strong> Double click the `.zip` file or right click and choose <em>"Extract All..."</em> or use <strong>7-Zip</strong> / <strong>WinRAR</strong>. When prompted, enter your password.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>macOS:</strong> Double click the archive to trigger Archive Utility, or use <strong>The Unarchiver</strong> or Terminal: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">unzip archive.zip</code> (will prompt for password).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>In-App Verifier:</strong> You can also drag and drop your downloaded file right into the <strong>"Test & Unlock"</strong> tab on this site to test your password immediately!
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
