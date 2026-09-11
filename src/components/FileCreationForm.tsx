import React, { useState, useId } from "react";
import {
  Lock,
  FileCode,
  Sliders,
  KeyRound,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check,
  FileText,
  AlertCircle,
  Binary,
  Layers,
  ArrowRight,
  RefreshCw,
  FolderArchive
} from "lucide-react";
import type { GenerateFileConfig, SizeUnit, DataPattern, EncryptionStandard } from "../types";
import { formatBytes, formatExactBytes, calculateTotalBytes, sanitizeFileName } from "../utils/formatters";
import {
  generateStrongPassword,
  generateMemorablePassphrase,
  evaluatePasswordStrength
} from "../utils/passwords";

interface FileCreationFormProps {
  onGenerate: (config: GenerateFileConfig) => void;
  isGenerating: boolean;
  progressStage: string;
  progressPercent: number;
}

const EXTENSION_PRESETS = [
  { ext: ".txt", label: ".txt", desc: "Plain Text" },
  { ext: ".pdf", label: ".pdf", desc: "PDF Doc" },
  { ext: ".dat", label: ".dat", desc: "Data File" },
  { ext: ".json", label: ".json", desc: "JSON" },
  { ext: ".csv", label: ".csv", desc: "CSV Table" },
  { ext: ".log", label: ".log", desc: "Server Log" },
  { ext: ".bin", label: ".bin", desc: "Binary" },
  { ext: ".sql", label: ".sql", desc: "Database" }
];

const SIZE_PRESETS: Array<{ label: string; value: number; unit: SizeUnit }> = [
  { label: "512 B", value: 512, unit: "B" },
  { label: "100 KB", value: 100, unit: "KB" },
  { label: "5 MB", value: 5, unit: "MB" },
  { label: "50 MB", value: 50, unit: "MB" },
  { label: "250 MB", value: 250, unit: "MB" },
  { label: "1 GB", value: 1, unit: "GB" },
  { label: "2.5 GB", value: 2.5, unit: "GB" },
  { label: "5 GB", value: 5, unit: "GB" }
];

export const FileCreationForm: React.FC<FileCreationFormProps> = ({
  onGenerate,
  isGenerating,
  progressStage,
  progressPercent
}) => {
  // File Name Customization State
  const [fileName, setFileName] = useState("confidential_document");
  const [fileExtension, setFileExtension] = useState(".txt");
  const [customExtensionInput, setCustomExtensionInput] = useState("");
  const [isCustomExt, setIsCustomExt] = useState(false);
  const [archiveName, setArchiveName] = useState("secure_vault.zip");

  // Required Size State
  const [sizeValue, setSizeValue] = useState<number>(5);
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>("MB");
  const [dataPattern, setDataPattern] = useState<DataPattern>("random");
  const [customText, setCustomText] = useState("TOP SECRET CLASSIFIED INFORMATION\nAuthorized personnel only.\nVerification hash: 9a8b7c6d5e\n");

  // Password Lock State
  const [password, setPassword] = useState("VaultKey$2026!Sec");
  const [showPassword, setShowPassword] = useState(true);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [encryptionStandard, setEncryptionStandard] = useState<EncryptionStandard>("aes256");
  const [includeHintFile, setIncludeHintFile] = useState(false);
  const [hintText, setHintText] = useState("The password is in your secure channel notes.");

  // Validation state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalBytes = calculateTotalBytes(sizeValue, sizeUnit);
  const strength = evaluatePasswordStrength(password);

  const activeExt = isCustomExt
    ? (customExtensionInput.startsWith(".") ? customExtensionInput : `.${customExtensionInput || "dat"}`)
    : fileExtension;

  const fullFileName = `${sanitizeFileName(fileName || "file")}${activeExt}`;
  const fullArchiveName = sanitizeFileName(archiveName.toLowerCase().endsWith(".zip") ? archiveName : `${archiveName}.zip`);

  const handleSelectPreset = (val: number, unit: SizeUnit) => {
    setSizeValue(val);
    setSizeUnit(unit);
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleGenerateStrong = () => {
    const p = generateStrongPassword(16);
    setPassword(p);
    setShowPassword(true);
  };

  const handleGenerateMemorable = () => {
    const p = generateMemorablePassphrase();
    setPassword(p);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fileName.trim()) {
      setErrorMessage("Please specify a custom file name.");
      return;
    }
    if (!password || password.length === 0) {
      setErrorMessage("Please enter a password to lock the ZIP file.");
      return;
    }
    if (totalBytes <= 0) {
      setErrorMessage("Required size must be greater than 0 bytes.");
      return;
    }
    const MAX_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB (5,368,709,120 bytes)
    if (totalBytes > MAX_BYTES) {
      setErrorMessage("Maximum file size allowed is 5 GB.");
      return;
    }

    const config: GenerateFileConfig = {
      fileName: sanitizeFileName(fileName.trim()),
      fileExtension: activeExt,
      archiveName: fullArchiveName,
      targetSizeValue: sizeValue,
      targetSizeUnit: sizeUnit,
      totalBytes,
      password,
      encryptionStandard,
      dataPattern,
      customText: dataPattern === "custom_text" ? customText : undefined,
      includeHintFile,
      hintText: includeHintFile ? hintText : undefined
    };

    onGenerate(config);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              1
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">
                File Customization & Naming
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Customize both the inner file and outer password-locked ZIP container.
              </p>
            </div>
          </div>

          {/* Live Archive Preview Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 max-w-full overflow-hidden truncate">
            <FolderArchive className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">{fullArchiveName}</span>
            <span className="text-slate-400">/</span>
            <FileCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate font-semibold text-slate-900">{fullFileName}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Inner File Name */}
          <div className="lg:col-span-7 space-y-2">
            <label htmlFor="input-file-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Inner File Name (Payload)
            </label>
            <div className="flex items-stretch rounded-xl border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-white overflow-hidden shadow-2xs">
              <span className="inline-flex items-center px-3.5 bg-slate-50 border-r border-slate-200 text-slate-500 text-xs font-semibold">
                <FileText className="w-4 h-4 text-slate-400" />
              </span>
              <input
                id="input-file-name"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. confidential_report"
                className="flex-1 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                required
              />
              <span className="inline-flex items-center px-3 bg-slate-100/70 text-slate-700 font-mono text-xs font-bold border-l border-slate-200">
                {activeExt}
              </span>
            </div>

            {/* Quick Extension Chips */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-500 mr-2">Quick Extension:</span>
              <div className="inline-flex flex-wrap gap-1 mt-1">
                {EXTENSION_PRESETS.map((p) => {
                  const isSelected = !isCustomExt && fileExtension === p.ext;
                  return (
                    <button
                      key={p.ext}
                      type="button"
                      id={`chip-ext-${p.ext.replace('.', '')}`}
                      onClick={() => {
                        setIsCustomExt(false);
                        setFileExtension(p.ext);
                      }}
                      className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  id="chip-ext-custom"
                  onClick={() => setIsCustomExt(true)}
                  className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium transition-all ${
                    isCustomExt
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Custom...
                </button>
              </div>

              {isCustomExt && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    id="input-custom-extension"
                    value={customExtensionInput}
                    onChange={(e) => setCustomExtensionInput(e.target.value)}
                    placeholder=".iso, .raw, .docx, .tar"
                    className="w-36 px-2.5 py-1 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500">Any file extension is supported</span>
                </div>
              )}
            </div>
          </div>

          {/* Outer Archive Name */}
          <div className="lg:col-span-5 space-y-2">
            <label htmlFor="input-archive-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Outer Locked ZIP Archive Name
            </label>
            <div className="flex items-stretch rounded-xl border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-white overflow-hidden shadow-2xs">
              <span className="inline-flex items-center px-3.5 bg-slate-50 border-r border-slate-200 text-slate-500 text-xs font-semibold">
                <FolderArchive className="w-4 h-4 text-slate-400" />
              </span>
              <input
                id="input-archive-name"
                type="text"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder="e.g. secure_vault.zip"
                className="flex-1 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500">
              The downloaded file will be saved with this name.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Required Size Configuration */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              2
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">
                Required File Size
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Specify the exact target file size you need the created file to be.
              </p>
            </div>
          </div>

          {/* Real-time Exact Byte Computation */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50/70 border border-indigo-200/80 text-xs font-mono text-indigo-900">
            <Sliders className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-bold">{formatBytes(totalBytes)}</span>
            <span className="text-indigo-400">&bull;</span>
            <span>{formatExactBytes(totalBytes)}</span>
          </div>
        </div>

        {/* Numeric Size Input + Unit Selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          <div className="md:col-span-6 space-y-2">
            <label htmlFor="input-target-size" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enter Target Size
            </label>
            <div className="flex items-center gap-2">
              <input
                id="input-target-size"
                type="number"
                min="1"
                max={sizeUnit === "GB" ? 5 : sizeUnit === "MB" ? 5120 : sizeUnit === "KB" ? 5242880 : 5368709120}
                step="any"
                value={sizeValue}
                onChange={(e) => setSizeValue(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 font-semibold text-base shadow-2xs focus:outline-none"
              />
              <div className="flex rounded-xl border border-slate-300 overflow-hidden shrink-0 shadow-2xs bg-slate-50 p-0.5">
                {(["B", "KB", "MB", "GB"] as SizeUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    id={`btn-unit-${u}`}
                    onClick={() => setSizeUnit(u)}
                    className={`px-3 py-2 text-xs font-bold transition-colors rounded-lg ${
                      sizeUnit === u
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {totalBytes > 50 * 1024 * 1024 && (
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200/80 text-[11px] text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>
                  <strong>High-Capacity ZIP64 Stream Engine Active:</strong> Files up to 5 GB are streamed on-demand with 64-bit encryption headers without exhausting browser RAM.
                </span>
              </div>
            )}

            {/* Quick Presets */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Common Size Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {SIZE_PRESETS.map((preset) => {
                  const isActive = sizeValue === preset.value && sizeUnit === preset.unit;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      id={`preset-size-${preset.label.replace(/\s+/g, '')}`}
                      onClick={() => handleSelectPreset(preset.value, preset.unit)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white font-bold shadow-2xs scale-102"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Pattern Options */}
          <div className="md:col-span-6 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Data Payload Filling Pattern
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="pattern-random"
                onClick={() => setDataPattern("random")}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  dataPattern === "random"
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>High Entropy (Random)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Uncompressible bytes. Guarantees file and ZIP both match exact target size.
                </p>
              </button>

              <button
                type="button"
                id="pattern-custom-text"
                onClick={() => setDataPattern("custom_text")}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  dataPattern === "custom_text"
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Custom Secret Note</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Type your custom note or message; padded to target size.
                </p>
              </button>

              <button
                type="button"
                id="pattern-structured"
                onClick={() => setDataPattern("structured_text")}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  dataPattern === "structured_text"
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Structured Server Logs</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Realistic timestamped audit logs repeated up to the byte limit.
                </p>
              </button>

              <button
                type="button"
                id="pattern-zeroes"
                onClick={() => setDataPattern("zeroes")}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  dataPattern === "zeroes"
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Binary className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Binary Null Bytes (0x00)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Classic sparse test payload filled with zeros.
                </p>
              </button>
            </div>

            {dataPattern === "custom_text" && (
              <div className="mt-3">
                <label htmlFor="input-custom-text-content" className="block text-xs font-semibold text-slate-600 mb-1">
                  Your Custom Secret Note / Content:
                </label>
                <textarea
                  id="input-custom-text-content"
                  rows={3}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter confidential notes, code snippet, or credentials..."
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500">
                  Remaining space up to {formatBytes(totalBytes)} will be padded automatically.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Password Lock & Encryption */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              3
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">
                Zip Lock with Password
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Protect the created file inside an encrypted ZIP archive.
              </p>
            </div>
          </div>

          {/* Password Generator Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-gen-strong-password"
              onClick={handleGenerateStrong}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Random 16-Char</span>
            </button>
            <button
              type="button"
              id="btn-gen-passphrase"
              onClick={handleGenerateMemorable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Passphrase</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Password Input & Strength Bar */}
          <div className="lg:col-span-7 space-y-3">
            <label htmlFor="input-zip-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Encryption Password
            </label>

            <div className="relative flex items-center rounded-xl border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-white overflow-hidden shadow-2xs">
              <span className="inline-flex items-center px-3.5 bg-slate-50 border-r border-slate-200 text-slate-500 text-xs font-semibold">
                <KeyRound className="w-4 h-4 text-slate-400" />
              </span>
              <input
                id="input-zip-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter or generate a strong password"
                className="flex-1 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none"
                required
              />

              {/* Toggle visibility */}
              <button
                type="button"
                id="btn-toggle-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="px-2.5 text-slate-400 hover:text-slate-700 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              {/* Copy password button */}
              <button
                type="button"
                id="btn-copy-password"
                onClick={handleCopyPassword}
                className="px-3 py-2 bg-slate-50 border-l border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-medium"
                title="Copy password to clipboard"
              >
                {copiedPassword ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Strength Meter */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Password Strength:</span>
                <span className={`font-bold ${strength.color.split(' ')[1]}`}>
                  {strength.label}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color.split(' ')[0]}`}
                  style={{ width: `${strength.barWidthPercent}%` }}
                />
              </div>
            </div>

            {/* Optional Hint File */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="checkbox-include-hint"
                  checked={includeHintFile}
                  onChange={(e) => setIncludeHintFile(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Include a password reminder note file (`PASSWORD_HINT.txt`) inside archive
                </span>
              </label>

              {includeHintFile && (
                <div className="mt-2 pl-6">
                  <input
                    type="text"
                    id="input-hint-text"
                    value={hintText}
                    onChange={(e) => setHintText(e.target.value)}
                    placeholder="e.g. Hint: Favorite place we visited in 2024"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Encryption Standard Selection */}
          <div className="lg:col-span-5 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Encryption Method
            </label>

            <div className="space-y-2">
              <button
                type="button"
                id="btn-enc-aes256"
                onClick={() => setEncryptionStandard("aes256")}
                className={`w-full p-3 rounded-xl text-left border transition-all ${
                  encryptionStandard === "aes256"
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>AES-256 (WinZip / 7-Zip Standard)</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Military-grade encryption. Supported by 7-Zip, WinRAR, modern macOS, and modern tools.
                </p>
              </button>

              <button
                type="button"
                id="btn-enc-zipcrypto"
                onClick={() => setEncryptionStandard("zipcrypto")}
                className={`w-full p-3 rounded-xl text-left border transition-all ${
                  encryptionStandard === "zipcrypto"
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <Lock className="w-4 h-4 text-slate-600" />
                    <span>ZipCrypto (Legacy Standard)</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    Legacy
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Compatible with older Windows Explorer built-in unzipping without 3rd-party software.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error display if any */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress & Submit Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <span>Summary:</span>
            <span className="text-indigo-600 font-mono">{fullFileName}</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-900 font-mono">{formatBytes(totalBytes)}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Locked with password &bull; Encryption: {encryptionStandard === "aes256" ? "AES-256" : "ZipCrypto"}
          </p>
        </div>

        {isGenerating ? (
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
              <span>{progressStage}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            type="submit"
            id="btn-create-and-lock"
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Create & Lock File</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
    </form>
  );
};
