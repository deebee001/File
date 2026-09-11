import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import {
  BlobWriter,
  ZipWriter,
  BlobReader,
  ZipReader,
  Uint8ArrayReader,
  TextReader,
  TextWriter
} from "@zip.js/zip.js";

const app = express();
const PORT = 3000;

// Maximum creation size: 5 GB (5,368,709,120 bytes)
const MAX_BYTES = 5 * 1024 * 1024 * 1024;

// Storage configuration for generated locked files
const STORAGE_DIR = path.join(process.cwd(), "data", "locked_files");
const META_FILE = path.join(STORAGE_DIR, "index.json");

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

interface StoredLockedPackage {
  id: string;
  archiveName: string;
  fileName: string;
  fileExtension: string;
  payloadBytes: number;
  archiveBytes: number;
  password: string;
  passwordHint?: string;
  encryptionStandard: "aes256" | "zipcrypto";
  dataPattern: string;
  customText?: string;
  includeHintFile?: boolean;
  hintText?: string;
  createdAt: string;
  downloadCount: number;
}

const lockedFilesMap = new Map<string, StoredLockedPackage>();

function loadMetadata() {
  try {
    if (fs.existsSync(META_FILE)) {
      const data = fs.readFileSync(META_FILE, "utf-8");
      const list: StoredLockedPackage[] = JSON.parse(data);
      for (const item of list) {
        lockedFilesMap.set(item.id, item);
      }
    }
  } catch (err) {
    console.error("Error loading locked files metadata:", err);
  }
}

function saveMetadata() {
  try {
    const list = Array.from(lockedFilesMap.values()).slice(0, 100);
    fs.writeFileSync(META_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving locked files metadata:", err);
  }
}

/**
 * Node stream writer that converts a Node write stream or Express Response
 * to a standard Web WritableStream compatible with ZipWriter.
 */
function createNodeWritableStream(out: {
  write(chunk: any): boolean;
  once(event: string, cb: () => void): any;
  end(): any;
  destroyed?: boolean;
  writableEnded?: boolean;
}): WritableStream<Uint8Array> {
  return new WritableStream<Uint8Array>({
    async write(chunk) {
      if (out.destroyed || out.writableEnded) return;
      if (!out.write(Buffer.from(chunk))) {
        await new Promise<void>((resolve) => out.once("drain", resolve));
      }
    },
    close() {
      if (!out.writableEnded) {
        out.end();
      }
    }
  });
}

/**
 * Virtual stream generator that generates up to 5 GB of exact pattern data
 * using a standard Web ReadableStream with constant ~64KB low memory overhead.
 */
function createVirtualPayloadReadable(
  totalBytes: number,
  pattern: string = "random",
  customText: string = ""
): ReadableStream<Uint8Array> {
  const sampleBlock = crypto.randomBytes(65536);
  let headerBytes: Uint8Array | undefined;
  if (pattern === "custom_text" && customText) {
    headerBytes = new TextEncoder().encode(customText + "\n--- [End of Custom Secret Note] ---\n");
  }

  let bytesProduced = 0;
  const CHUNK_SIZE = 65536;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (bytesProduced >= totalBytes) {
        controller.close();
        return;
      }

      const remaining = totalBytes - bytesProduced;
      const chunkSize = Math.min(CHUNK_SIZE, remaining);

      if (pattern === "zeroes") {
        const chunk = new Uint8Array(chunkSize);
        bytesProduced += chunkSize;
        controller.enqueue(chunk);
        return;
      }

      const chunk = new Uint8Array(chunkSize);

      if (pattern === "custom_text" && headerBytes && bytesProduced < headerBytes.length) {
        const headerRem = headerBytes.length - bytesProduced;
        const copyFromHeader = Math.min(chunkSize, headerRem);
        chunk.set(headerBytes.subarray(bytesProduced, bytesProduced + copyFromHeader), 0);
        let filled = copyFromHeader;
        while (filled < chunkSize) {
          const sampleOffset = (bytesProduced + filled) % sampleBlock.length;
          const toCopy = Math.min(chunkSize - filled, sampleBlock.length - sampleOffset);
          chunk.set(sampleBlock.subarray(sampleOffset, sampleOffset + toCopy), filled);
          filled += toCopy;
        }
      } else {
        let filled = 0;
        while (filled < chunkSize) {
          const sampleOffset = (bytesProduced + filled) % sampleBlock.length;
          const toCopy = Math.min(chunkSize - filled, sampleBlock.length - sampleOffset);
          chunk.set(sampleBlock.subarray(sampleOffset, sampleOffset + toCopy), filled);
          filled += toCopy;
        }
      }

      bytesProduced += chunkSize;
      controller.enqueue(chunk);
    }
  });
}

// Multer for upload testing/verification (up to 200 MB)
const upload = multer({
  limits: { fileSize: 200 * 1024 * 1024 },
  storage: multer.memoryStorage()
});

async function startServer() {
  loadMetadata();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      appName: "Locked File Generator",
      storageCount: lockedFilesMap.size
    });
  });

  // 1. Generate & Save Locked ZIP File (supports up to 5 GB)
  app.post("/api/generate-locked", async (req, res) => {
    try {
      const {
        fileName = "custom_file",
        fileExtension = ".txt",
        archiveName = "locked_archive.zip",
        totalBytes = 1048576, // default 1MB
        password = "",
        encryptionStandard = "aes256",
        dataPattern = "random",
        customText = "",
        includeHintFile = false,
        hintText = ""
      } = req.body;

      if (!password || password.trim().length === 0) {
        res.status(400).json({ error: "A password is required to lock the ZIP file." });
        return;
      }

      const safeBytes = Math.min(Math.max(1, Number(totalBytes) || 1024), MAX_BYTES);
      const cleanBaseName = fileName.replace(/[/\\?%*:|"<>]/g, "_").trim() || "payload";
      const cleanExt = fileExtension.startsWith(".") ? fileExtension : `.${fileExtension}`;
      const fullFileName = `${cleanBaseName}${cleanExt}`;

      let cleanArchiveName = archiveName.replace(/[/\\?%*:|"<>]/g, "_").trim() || "archive.zip";
      if (!cleanArchiveName.toLowerCase().endsWith(".zip")) {
        cleanArchiveName += ".zip";
      }

      const id = crypto.randomBytes(8).toString("hex");

      // Approximate archive overhead (headers + encryption salt/HMAC + ZIP64 descriptors)
      const archiveBytes = safeBytes + 380 + (includeHintFile && hintText ? 300 : 0);

      const record: StoredLockedPackage = {
        id,
        archiveName: cleanArchiveName,
        fileName: fullFileName,
        fileExtension: cleanExt,
        payloadBytes: safeBytes,
        archiveBytes,
        password: String(password),
        passwordHint: includeHintFile ? hintText : undefined,
        encryptionStandard: encryptionStandard === "aes256" ? "aes256" : "zipcrypto",
        dataPattern,
        customText,
        includeHintFile,
        hintText,
        createdAt: new Date().toISOString(),
        downloadCount: 0
      };

      // For smaller files (<= 15MB), optionally cache pre-built zip to disk
      if (safeBytes <= 15 * 1024 * 1024) {
        try {
          const filePath = path.join(STORAGE_DIR, `${id}.zip`);
          const fileOut = fs.createWriteStream(filePath);
          const writerStream = createNodeWritableStream(fileOut);

          const zipWriter = new ZipWriter(writerStream, {
            password: String(password),
            encryptionStrength: encryptionStandard === "aes256" ? 3 : undefined,
            zipCrypto: encryptionStandard === "zipcrypto",
            zip64: safeBytes >= 2 * 1024 * 1024 * 1024,
            level: 0
          });

          const readerStream = createVirtualPayloadReadable(safeBytes, dataPattern, customText);
          await zipWriter.add(fullFileName, readerStream);

          if (includeHintFile && hintText && hintText.trim()) {
            const note = `=== SECURE ARCHIVE ACCESS NOTE ===\nArchive: ${cleanArchiveName}\nPayload: ${fullFileName} (${safeBytes} bytes)\nHint: ${hintText.trim()}\n==================================\n`;
            await zipWriter.add("PASSWORD_HINT.txt", new TextReader(note));
          }

          await zipWriter.close();
          await new Promise<void>((resolve) => fileOut.once("finish", () => resolve()));

          if (fs.existsSync(filePath)) {
            record.archiveBytes = fs.statSync(filePath).size;
          }
        } catch (cacheErr) {
          console.warn("Could not pre-cache archive to disk, will stream dynamically:", cacheErr);
        }
      }

      lockedFilesMap.set(id, record);
      saveMetadata();

      res.status(201).json({
        success: true,
        record: {
          ...record,
          downloadUrl: `/api/download-locked/${id}`
        }
      });
    } catch (err: any) {
      console.error("Failed to generate locked file:", err);
      res.status(500).json({ error: `Generation failed: ${err.message || "Internal error"}` });
    }
  });

  // 2. Download or Stream Generated Locked File (handles up to 5 GB without memory exhaustion)
  app.get("/api/download-locked/:id", async (req, res) => {
    const { id } = req.params;
    const item = lockedFilesMap.get(id);

    if (!item) {
      res.status(404).json({ error: "Locked file record not found or expired." });
      return;
    }

    item.downloadCount++;
    saveMetadata();

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(item.archiveName)}"`);
    res.setHeader("Content-Type", "application/zip");

    const filePath = path.join(STORAGE_DIR, `${id}.zip`);
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Length", fs.statSync(filePath).size);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      return;
    }

    // Dynamic streaming generation with constant low memory footprint (ZIP64 enabled for >= 4GB)
    try {
      const writerStream = createNodeWritableStream(res);

      const zipWriter = new ZipWriter(writerStream, {
        password: item.password,
        encryptionStrength: item.encryptionStandard === "aes256" ? 3 : undefined,
        zipCrypto: item.encryptionStandard === "zipcrypto",
        zip64: true, // Always enable ZIP64 for streaming multi-gigabyte files
        level: 0
      });

      const readerStream = createVirtualPayloadReadable(item.payloadBytes, item.dataPattern, item.customText || "");
      await zipWriter.add(item.fileName, readerStream);

      if (item.includeHintFile && item.hintText) {
        const note = `=== SECURE ARCHIVE ACCESS NOTE ===\nArchive: ${item.archiveName}\nPayload: ${item.fileName} (${item.payloadBytes} bytes)\nHint: ${item.hintText.trim()}\n==================================\n`;
        await zipWriter.add("PASSWORD_HINT.txt", new TextReader(note));
      }

      await zipWriter.close();
      if (!res.writableEnded) {
        res.end();
      }
    } catch (streamErr: any) {
      console.error("Streaming download failed:", streamErr);
      if (!res.headersSent) {
        res.status(500).json({ error: "Streaming download failed." });
      }
    }
  });

  // Direct on-demand stream endpoint for external cURL or direct download
  app.get("/api/stream-locked", async (req, res) => {
    try {
      const {
        fileName = "payload",
        fileExtension = ".dat",
        archiveName = "locked_archive.zip",
        totalBytes = 1048576,
        password = "LockPassword123!",
        encryptionStandard = "aes256",
        dataPattern = "random",
        customText = ""
      } = req.query as Record<string, string>;

      const safeBytes = Math.min(Math.max(1, Number(totalBytes) || 1024), MAX_BYTES);
      const cleanBaseName = (fileName || "payload").replace(/[/\\?%*:|"<>]/g, "_").trim();
      const cleanExt = (fileExtension || ".dat").startsWith(".") ? fileExtension : `.${fileExtension}`;
      const fullFileName = `${cleanBaseName}${cleanExt}`;

      let cleanArchiveName = (archiveName || "archive.zip").replace(/[/\\?%*:|"<>]/g, "_").trim();
      if (!cleanArchiveName.toLowerCase().endsWith(".zip")) {
        cleanArchiveName += ".zip";
      }

      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(cleanArchiveName)}"`);
      res.setHeader("Content-Type", "application/zip");

      const writerStream = createNodeWritableStream(res);

      const zipWriter = new ZipWriter(writerStream, {
        password: String(password),
        encryptionStrength: encryptionStandard === "aes256" ? 3 : undefined,
        zipCrypto: encryptionStandard === "zipcrypto",
        zip64: true,
        level: 0
      });

      const readerStream = createVirtualPayloadReadable(safeBytes, dataPattern, customText);
      await zipWriter.add(fullFileName, readerStream);
      await zipWriter.close();
      if (!res.writableEnded) {
        res.end();
      }
    } catch (err: any) {
      console.error("Direct stream failed:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    }
  });

  // 3. Verify Password on an Uploaded ZIP
  app.post("/api/verify-locked", upload.single("archive"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No archive file uploaded." });
        return;
      }

      const password = req.body.password || "";
      const archiveBlob = new Blob([req.file.buffer], { type: "application/zip" });

      const zipReader = new ZipReader(new BlobReader(archiveBlob), { password });
      const entries = await zipReader.getEntries();

      const verifiedEntries: any[] = [];
      let totalExtractedBytes = 0;

      for (const rawEntry of entries) {
        if (rawEntry.directory) continue;
        const entry = rawEntry as any;

        let previewSnippet = "";
        try {
          const textWriter = new TextWriter();
          const text = await entry.getData(textWriter);
          if (text) {
            previewSnippet = text.slice(0, 300);
          }
        } catch {
          // If binary or password failed
          try {
            const discardStream = new WritableStream<Uint8Array>({ write() {} });
            await entry.getData(discardStream);
          } catch (entryErr: any) {
            await zipReader.close();
            res.status(400).json({
              success: false,
              errorMessage: "Incorrect password. Could not decrypt entry data."
            });
            return;
          }
        }

        const size = entry.uncompressedSize || 0;
        totalExtractedBytes += size;

        verifiedEntries.push({
          filename: entry.filename,
          uncompressedSize: size,
          compressedSize: entry.compressedSize || 0,
          encrypted: entry.encrypted ?? true,
          previewSnippet
        });
      }

      await zipReader.close();

      res.json({
        success: true,
        archiveName: req.file.originalname,
        archiveSize: req.file.size,
        totalExtractedBytes,
        entries: verifiedEntries
      });
    } catch (err: any) {
      console.error("Verification failed:", err);
      res.status(400).json({
        success: false,
        errorMessage: err.message?.includes("password")
          ? "Invalid password. The ZIP archive could not be unlocked."
          : `Verification failed: ${err.message || "Unknown error"}`
      });
    }
  });

  // 4. List Recent Server Packages
  app.get("/api/locked-files", (req, res) => {
    const list = Array.from(lockedFilesMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30)
      .map(item => ({
        ...item,
        downloadUrl: `/api/download-locked/${item.id}`
      }));
    res.json(list);
  });

  // 4b. Get Single Locked File Metadata for Sharing & Direct Downloads
  app.get("/api/locked-files/:id", (req, res) => {
    const { id } = req.params;
    const item = lockedFilesMap.get(id);
    if (!item) {
      res.status(404).json({ error: "Shared file not found or expired." });
      return;
    }

    res.json({
      id: item.id,
      archiveName: item.archiveName,
      fileName: item.fileName,
      fileExtension: item.fileExtension,
      payloadBytes: item.payloadBytes,
      archiveBytes: item.archiveBytes,
      encryptionStandard: item.encryptionStandard,
      dataPattern: item.dataPattern,
      hasPasswordHint: !!(item.includeHintFile && item.hintText),
      hintText: item.includeHintFile ? item.hintText : undefined,
      createdAt: item.createdAt,
      downloadCount: item.downloadCount,
      downloadUrl: `/api/download-locked/${item.id}`,
      password: item.password
    });
  });

  // 5. Delete a Locked File
  app.delete("/api/locked-files/:id", (req, res) => {
    const { id } = req.params;
    const item = lockedFilesMap.get(id);
    const filePath = path.join(STORAGE_DIR, `${id}.zip`);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }

    lockedFilesMap.delete(id);
    saveMetadata();

    res.json({ success: true, message: "File removed." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Locked File Generator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
