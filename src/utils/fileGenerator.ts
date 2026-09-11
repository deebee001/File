import {
  BlobWriter,
  ZipWriter,
  BlobReader,
  ZipReader,
  Uint8ArrayReader,
  TextReader,
  TextWriter
} from "@zip.js/zip.js";
import type { GenerateFileConfig, VerificationResult, VerifiedEntry } from "../types";
import { sanitizeFileName } from "./formatters";

/**
 * Generates buffer of exact target byte size based on chosen pattern.
 */
export function generatePayloadBuffer(
  totalBytes: number,
  pattern: GenerateFileConfig["dataPattern"],
  customText = "",
  onProgress?: (pct: number) => void
): Uint8Array {
  const buffer = new Uint8Array(totalBytes);
  const cryptoObj = typeof window !== "undefined" ? window.crypto : null;

  if (pattern === "zeroes") {
    buffer.fill(0);
    onProgress?.(100);
    return buffer;
  }

  if (pattern === "custom_text") {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(customText || "Confidential Document Data\n");
    const len = encoded.length;

    if (len >= totalBytes) {
      buffer.set(encoded.subarray(0, totalBytes));
    } else {
      // Set the custom text first
      buffer.set(encoded, 0);
      // Pad the rest with a structured padding footer and repeat pattern
      const padNotice = `\n--- [Target Padding: ${totalBytes} Bytes] ---\n`;
      const encodedNotice = encoder.encode(padNotice);
      let offset = len;

      if (offset + encodedNotice.length < totalBytes) {
        buffer.set(encodedNotice, offset);
        offset += encodedNotice.length;
      }

      // Fill remainder with repeating readable line
      const filler = encoder.encode(`[SEC-PAD-${totalBytes}] DATA-RECORD-VERIFIED-INTEGRITY\n`);
      while (offset < totalBytes) {
        const chunk = Math.min(filler.length, totalBytes - offset);
        buffer.set(filler.subarray(0, chunk), offset);
        offset += chunk;
      }
    }
    onProgress?.(100);
    return buffer;
  }

  if (pattern === "structured_text") {
    const encoder = new TextEncoder();
    let offset = 0;
    let lineIdx = 1;
    const nowIso = new Date().toISOString();

    const header = encoder.encode(`# SECURE LOG DUMP - TARGET SIZE: ${totalBytes} BYTES\n# GENERATED: ${nowIso}\n# INTEGRITY VERIFIED\n\n`);
    if (header.length <= totalBytes) {
      buffer.set(header, 0);
      offset += header.length;
    }

    while (offset < totalBytes) {
      const lineStr = `[${nowIso}] [SEC_AUDIT] Record #${lineIdx.toString().padStart(6, '0')} - payload verification token 0x${Math.random().toString(16).slice(2, 10)}\n`;
      const lineBytes = encoder.encode(lineStr);
      const chunk = Math.min(lineBytes.length, totalBytes - offset);
      buffer.set(lineBytes.subarray(0, chunk), offset);
      offset += chunk;
      lineIdx++;
    }
    onProgress?.(100);
    return buffer;
  }

  // Default: 'random' (Cryptographic or high-entropy pseudo-random bytes)
  const chunkSize = 65536; // 64KB chunks
  let offset = 0;

  while (offset < totalBytes) {
    const chunk = Math.min(chunkSize, totalBytes - offset);
    if (cryptoObj && cryptoObj.getRandomValues && chunk <= 65536) {
      const sub = new Uint8Array(chunk);
      cryptoObj.getRandomValues(sub);
      buffer.set(sub, offset);
    } else {
      // Fallback fast pseudo-random
      for (let i = 0; i < chunk; i++) {
        buffer[offset + i] = Math.floor(Math.random() * 256);
      }
    }
    offset += chunk;
    if (onProgress && totalBytes > 1024 * 1024) {
      onProgress(Math.round((offset / totalBytes) * 100));
    }
  }

  onProgress?.(100);
  return buffer;
}

/**
 * Creates a password-protected encrypted ZIP containing the generated payload file.
 */
export async function createLockedZipFile(
  config: GenerateFileConfig,
  onProgress?: (stage: string, percent: number) => void
): Promise<{ blob: Blob; fullFileName: string; archiveName: string }> {
  onProgress?.("Generating byte payload...", 15);

  const cleanBaseName = sanitizeFileName(config.fileName || "custom_file", "custom_file");
  const ext = config.fileExtension.startsWith(".") ? config.fileExtension : `.${config.fileExtension}`;
  const fullFileName = `${cleanBaseName}${ext}`;

  let archiveName = sanitizeFileName(config.archiveName || "secure_archive", "secure_archive");
  if (!archiveName.toLowerCase().endsWith(".zip")) {
    archiveName += ".zip";
  }

  // Generate byte payload buffer
  const payloadBuffer = generatePayloadBuffer(
    config.totalBytes,
    config.dataPattern,
    config.customText,
    (pct) => onProgress?.("Generating byte payload...", Math.round(15 + (pct * 0.35)))
  );

  onProgress?.("Encrypting and locking ZIP archive...", 55);

  const blobWriter = new BlobWriter("application/zip");
  const zipWriterOptions: {
    password?: string;
    encryptionStrength?: 1 | 2 | 3;
    zipCrypto?: boolean;
    level?: number;
  } = {
    password: config.password,
    level: config.dataPattern === "random" ? 0 : 6 // Store mode for random (already 100% entropy, avoids wasting CPU)
  };

  if (config.encryptionStandard === "aes256") {
    zipWriterOptions.encryptionStrength = 3; // AES-256
  } else {
    zipWriterOptions.zipCrypto = true; // Legacy PKWARE ZipCrypto
  }

  const zipWriter = new ZipWriter(blobWriter, zipWriterOptions);

  // Add the primary generated file
  await zipWriter.add(fullFileName, new Uint8ArrayReader(payloadBuffer));

  // Add optional hint file if requested
  if (config.includeHintFile && config.hintText?.trim()) {
    const hintContent = `=== SECURE ARCHIVE ACCESS NOTE ===\nArchive Name: ${archiveName}\nPayload: ${fullFileName} (${config.totalBytes} bytes)\nHint / Reminder: ${config.hintText.trim()}\n==================================\n`;
    await zipWriter.add("PASSWORD_HINT.txt", new TextReader(hintContent));
  }

  onProgress?.("Finalizing encrypted archive...", 90);
  await zipWriter.close();

  const finalBlob = await blobWriter.getData();
  onProgress?.("Ready!", 100);

  return {
    blob: finalBlob,
    fullFileName,
    archiveName
  };
}

/**
 * Tests and verifies password extraction on a locked zip file.
 */
export async function verifyLockedZip(
  file: File | Blob,
  password: string
): Promise<VerificationResult> {
  const archiveName = file instanceof File ? file.name : "archive.zip";
  const archiveSize = file.size;

  try {
    const zipReader = new ZipReader(new BlobReader(file), { password });
    const entries = await zipReader.getEntries();

    if (!entries || entries.length === 0) {
      await zipReader.close();
      return {
        success: false,
        testedPassword: password,
        archiveName,
        archiveSize,
        entries: [],
        totalExtractedBytes: 0,
        errorMessage: "The ZIP archive is empty or contains no valid files."
      };
    }

    const verifiedEntries: VerifiedEntry[] = [];
    let totalBytes = 0;

    for (const rawEntry of entries) {
      if (rawEntry.directory) continue;
      const entry = rawEntry as any;

      let previewSnippet: string | undefined;
      const isLargeEntry = (entry.uncompressedSize || 0) > 1024 * 1024;

      if (!isLargeEntry) {
        try {
          // Attempt decrypting entry and getting preview snippet for small entries
          const textWriter = new TextWriter();
          const text = await entry.getData(textWriter);
          if (text && text.length > 0) {
            previewSnippet = text.slice(0, 300);
          }
        } catch {
          // If not text or preview failed, verify decryption via discard WritableStream
          try {
            const discardStream = new WritableStream<Uint8Array>({ write() {} });
            await entry.getData(discardStream);
          } catch (entryErr: any) {
            await zipReader.close();
            return {
              success: false,
              testedPassword: password,
              archiveName,
              archiveSize,
              entries: [],
              totalExtractedBytes: 0,
              errorMessage: entryErr.message?.includes("password")
                ? "Incorrect password. Failed to decrypt file entries."
                : `Decryption error: ${entryErr.message || "Failed to decrypt entry"}`
            };
          }
        }
      } else {
        // Large entry (up to 5 GB): Verify password authentication directly without allocating memory
        try {
          const discardStream = new WritableStream<Uint8Array>({ write() {} });
          await entry.getData(discardStream);
          previewSnippet = `[Binary/Large payload verified: ${entry.filename} (${entry.uncompressedSize} bytes)]`;
        } catch (entryErr: any) {
          await zipReader.close();
          return {
            success: false,
            testedPassword: password,
            archiveName,
            archiveSize,
            entries: [],
            totalExtractedBytes: 0,
            errorMessage: entryErr.message?.includes("password")
              ? "Incorrect password. Failed to decrypt file entries."
              : `Decryption error: ${entryErr.message || "Failed to decrypt entry"}`
          };
        }
      }

      const size = entry.uncompressedSize ?? 0;
      totalBytes += size;

      verifiedEntries.push({
        filename: entry.filename,
        uncompressedSize: size,
        compressedSize: entry.compressedSize ?? 0,
        encrypted: entry.encrypted ?? true,
        previewSnippet
      });
    }

    await zipReader.close();

    return {
      success: true,
      testedPassword: password,
      archiveName,
      archiveSize,
      entries: verifiedEntries,
      totalExtractedBytes: totalBytes
    };
  } catch (err: any) {
    return {
      success: false,
      testedPassword: password,
      archiveName,
      archiveSize,
      entries: [],
      totalExtractedBytes: 0,
      errorMessage: err.message?.includes("password")
        ? "Invalid password. The archive could not be unlocked."
        : `Verification failed: ${err.message || "Unknown error"}`
    };
  }
}
