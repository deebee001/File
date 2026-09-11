import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { FileCreationForm } from "./components/FileCreationForm";
import { GenerationResultModal } from "./components/GenerationResultModal";
import { UnlockVerifier } from "./components/UnlockVerifier";
import { RecentFilesList } from "./components/RecentFilesList";
import { HowItWorksModal } from "./components/HowItWorksModal";
import { ShareModal } from "./components/ShareModal";
import { SharedDownloadView } from "./components/SharedDownloadView";
import type { GenerateFileConfig, GeneratedPackageRecord } from "./types";
import { createLockedZipFile } from "./utils/fileGenerator";
import { formatBytes } from "./utils/formatters";
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Download,
  KeyRound,
  FileCode,
  Sparkles,
  Info,
  Share2
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"create" | "verify" | "history">("create");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState("Initializing...");
  const [progressPercent, setProgressPercent] = useState(0);

  // Shared file landing state from URL (?share=<id>)
  const [sharedFileId, setSharedFileId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("share");
    }
    return null;
  });

  const [sharedInitialPassword, setSharedInitialPassword] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("key") || params.get("pwd") || "";
    }
    return "";
  });

  // Package to share via ShareModal
  const [shareModalPackage, setShareModalPackage] = useState<GeneratedPackageRecord | null>(null);

  // Completed package to display in modal
  const [completedPackage, setCompletedPackage] = useState<GeneratedPackageRecord | null>(null);

  // Preloaded package for verification tab
  const [preloadedForVerifier, setPreloadedForVerifier] = useState<GeneratedPackageRecord | null>(null);

  // How it works modal
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Recent generated files state with localStorage persistence
  const [recentFiles, setRecentFiles] = useState<GeneratedPackageRecord[]>(() => {
    try {
      const saved = localStorage.getItem("locked_files_recent_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check URL changes for ?share parameter
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const share = params.get("share");
      const key = params.get("key") || params.get("pwd") || "";
      if (share) {
        setSharedFileId(share);
        setSharedInitialPassword(key);
      }
    };

    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  // Save to localStorage whenever recentFiles changes
  useEffect(() => {
    try {
      // Don't store Blobs in localStorage, only metadata
      const serializable = recentFiles.map(({ blob, ...rest }) => rest);
      localStorage.setItem("locked_files_recent_v1", JSON.stringify(serializable));
    } catch {
      // localStorage quota exceeded or unavailable
    }
  }, [recentFiles]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleExitShare = () => {
    setSharedFileId(null);
    setSharedInitialPassword("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("share");
      url.searchParams.delete("key");
      url.searchParams.delete("pwd");
      window.history.pushState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  };

  const handleOpenShare = (pkg: GeneratedPackageRecord) => {
    setShareModalPackage(pkg);
  };

  // 1. Core Generation Workflow (Supports up to 5 GB)
  const handleGenerate = async (config: GenerateFileConfig) => {
    setIsGenerating(true);
    setProgressPercent(10);
    setProgressStage("Preparing file payload...");

    try {
      const isLargeFile = config.totalBytes > 50 * 1024 * 1024; // > 50MB up to 5GB

      if (isLargeFile) {
        // High-capacity stream creation via server pipeline
        setProgressStage("Configuring high-capacity 5GB ZIP64 stream...");
        setProgressPercent(40);

        const resp = await fetch("/api/generate-locked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: config.fileName,
            fileExtension: config.fileExtension,
            archiveName: config.archiveName,
            totalBytes: config.totalBytes,
            password: config.password,
            encryptionStandard: config.encryptionStandard,
            dataPattern: config.dataPattern,
            customText: config.customText,
            includeHintFile: config.includeHintFile,
            hintText: config.hintText
          })
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${resp.status}`);
        }

        const data = await resp.json();
        const recordId = data.record.id;
        const serverDownloadUrl = data.record.downloadUrl;

        setProgressStage("Ready for high-speed stream download!");
        setProgressPercent(100);

        const newRecord: GeneratedPackageRecord = {
          id: recordId,
          archiveName: data.record.archiveName,
          fileName: data.record.fileName,
          fileExtension: data.record.fileExtension,
          payloadBytes: data.record.payloadBytes,
          archiveBytes: data.record.archiveBytes,
          password: config.password,
          encryptionStandard: config.encryptionStandard,
          dataPattern: config.dataPattern,
          createdAt: new Date().toISOString(),
          downloadUrl: serverDownloadUrl
        };

        setRecentFiles((prev) => [newRecord, ...prev.slice(0, 24)]);
        setCompletedPackage(newRecord);
        showToast(`Created & locked ${data.record.archiveName} (${formatBytes(data.record.archiveBytes)})!`, "success");
      } else {
        // Generate client-side using @zip.js/zip.js for files <= 50MB
        const { blob, fullFileName, archiveName } = await createLockedZipFile(
          config,
          (stage, pct) => {
            setProgressStage(stage);
            setProgressPercent(pct);
          }
        );

        // Create unique record ID
        const recordId = `lock-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        let serverDownloadUrl: string | undefined;

        // Also register with server for persistent cURL / link if available
        try {
          const resp = await fetch("/api/generate-locked", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: config.fileName,
              fileExtension: config.fileExtension,
              archiveName: config.archiveName,
              totalBytes: config.totalBytes,
              password: config.password,
              encryptionStandard: config.encryptionStandard,
              dataPattern: config.dataPattern,
              customText: config.customText,
              includeHintFile: config.includeHintFile,
              hintText: config.hintText
            })
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.record && data.record.downloadUrl) {
              serverDownloadUrl = data.record.downloadUrl;
            }
          }
        } catch {
          // Fallback gracefully to purely client-side blob download
        }

        const newRecord: GeneratedPackageRecord = {
          id: recordId,
          archiveName,
          fileName: fullFileName,
          fileExtension: config.fileExtension,
          payloadBytes: config.totalBytes,
          archiveBytes: blob.size,
          password: config.password,
          encryptionStandard: config.encryptionStandard,
          dataPattern: config.dataPattern,
          createdAt: new Date().toISOString(),
          downloadUrl: serverDownloadUrl,
          blob
        };

        setRecentFiles((prev) => [newRecord, ...prev.slice(0, 24)]);
        setCompletedPackage(newRecord);
        showToast(`Created & locked ${archiveName} (${formatBytes(blob.size)})!`, "success");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      showToast(err.message || "Failed to generate locked file.", "error");
    } finally {
      setIsGenerating(false);
      setProgressPercent(0);
      setProgressStage("");
    }
  };

  // 2. Direct Download (Prefers streaming download URL for high-capacity archives)
  const handleDownload = (pkg: GeneratedPackageRecord) => {
    try {
      if (pkg.downloadUrl) {
        const a = document.createElement("a");
        a.href = pkg.downloadUrl;
        a.download = pkg.archiveName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`Starting download of ${pkg.archiveName}...`, "info");
      } else if (pkg.blob) {
        const url = URL.createObjectURL(pkg.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = pkg.archiveName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showToast(`Downloading ${pkg.archiveName}...`, "info");
      } else {
        showToast("Download source unavailable for this session.", "error");
      }
    } catch (err: any) {
      showToast("Download failed: " + err.message, "error");
    }
  };

  // 3. Test in verifier
  const handleTestInVerifier = (pkg: GeneratedPackageRecord) => {
    setPreloadedForVerifier(pkg);
    setActiveTab("verify");
  };

  // 4. Delete record
  const handleDeleteRecord = (id: string) => {
    setRecentFiles((prev) => prev.filter((item) => item.id !== id));
    showToast("File record removed from recent list.", "info");
  };

  // 5. Clear all history
  const handleClearAll = () => {
    setRecentFiles([]);
    showToast("All recent records cleared.", "info");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold text-white ${
              toast.type === "success"
                ? "bg-emerald-600"
                : toast.type === "error"
                ? "bg-rose-600"
                : "bg-slate-900"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-white" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4 text-white" />}
            {toast.type === "info" && <Info className="w-4 h-4 text-white" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (sharedFileId) {
            handleExitShare();
          }
          setActiveTab(tab);
        }}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        recentCount={recentFiles.length}
      />

      {/* Hero / Value Proposition Section (Hidden when viewing a shared file) */}
      {!sharedFileId && (
        <div className="w-full bg-white border-b border-slate-200/80 py-6 sm:py-8 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
              <Lock className="w-3.5 h-3.5" />
              <span>Generate &bull; Lock with Password &bull; Exact Size &bull; Download</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create Custom Files & Lock with Password
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Generate custom files with your chosen name and exact byte size, protect them inside a password-locked ZIP archive with AES-256 or ZipCrypto encryption, and download instantly.
            </p>

            {/* Quick Feature Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                Custom File Name & Extension
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                Exact Size (Bytes, KB, MB, GB)
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                AES-256 Password Lock
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                Instant Browser Download
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                Direct Link Sharing
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Body Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {sharedFileId ? (
          <SharedDownloadView
            shareId={sharedFileId}
            initialPassword={sharedInitialPassword}
            onExitShare={handleExitShare}
            onOpenVerifierWithPackage={(pkg) => {
              handleExitShare();
              handleTestInVerifier(pkg);
            }}
          />
        ) : (
          <>
            {activeTab === "create" && (
              <FileCreationForm
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                progressStage={progressStage}
                progressPercent={progressPercent}
              />
            )}

            {activeTab === "verify" && (
              <UnlockVerifier
                preloadedPackage={preloadedForVerifier}
                onClearPreloaded={() => setPreloadedForVerifier(null)}
              />
            )}

            {activeTab === "history" && (
              <RecentFilesList
                files={recentFiles}
                onDownload={handleDownload}
                onTestInVerifier={handleTestInVerifier}
                onShare={handleOpenShare}
                onDelete={handleDeleteRecord}
                onClearAll={handleClearAll}
              />
            )}
          </>
        )}
      </main>

      {/* Result Celebration Modal */}
      {completedPackage && (
        <GenerationResultModal
          pkg={completedPackage}
          onClose={() => setCompletedPackage(null)}
          onVerifyInApp={(pkg) => {
            setCompletedPackage(null);
            handleTestInVerifier(pkg);
          }}
          onDownload={handleDownload}
          onShare={(pkg) => {
            setShareModalPackage(pkg);
          }}
        />
      )}

      {/* Share Modal */}
      {shareModalPackage && (
        <ShareModal
          pkg={shareModalPackage}
          onClose={() => setShareModalPackage(null)}
          onDirectDownload={handleDownload}
        />
      )}

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            Locked File Generator &bull; Secure custom-size file and ZIP creation
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHowItWorksOpen(true)}
              className="hover:text-indigo-600 font-medium transition-colors"
            >
              Encryption Standards
            </button>
            <button
              onClick={() => setActiveTab("verify")}
              className="hover:text-indigo-600 font-medium transition-colors"
            >
              Password Verifier
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
