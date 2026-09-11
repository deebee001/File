export type SizeUnit = 'B' | 'KB' | 'MB' | 'GB';

export type DataPattern = 'random' | 'custom_text' | 'structured_text' | 'zeroes';

export type EncryptionStandard = 'aes256' | 'zipcrypto';

export interface GenerateFileConfig {
  fileName: string;
  fileExtension: string;
  archiveName: string;
  targetSizeValue: number;
  targetSizeUnit: SizeUnit;
  totalBytes: number;
  password: string;
  encryptionStandard: EncryptionStandard;
  dataPattern: DataPattern;
  customText?: string;
  includeHintFile?: boolean;
  hintText?: string;
}

export interface GeneratedPackageRecord {
  id: string;
  archiveName: string;
  fileName: string;
  fileExtension: string;
  payloadBytes: number;
  archiveBytes: number;
  password: string;
  encryptionStandard: EncryptionStandard;
  dataPattern: DataPattern;
  createdAt: string;
  downloadUrl?: string;
  blob?: Blob;
  downloadCount?: number;
  hintText?: string;
}

export interface SharedFileInfo {
  id: string;
  archiveName: string;
  fileName: string;
  fileExtension: string;
  payloadBytes: number;
  archiveBytes: number;
  encryptionStandard: EncryptionStandard;
  dataPattern: DataPattern;
  createdAt: string;
  downloadCount: number;
  downloadUrl: string;
  hasPasswordHint?: boolean;
  hintText?: string;
  password?: string;
}

export interface VerifiedEntry {
  filename: string;
  uncompressedSize: number;
  compressedSize: number;
  encrypted: boolean;
  previewSnippet?: string;
  mimeType?: string;
}

export interface VerificationResult {
  success: boolean;
  testedPassword: string;
  archiveName: string;
  archiveSize: number;
  entries: VerifiedEntry[];
  totalExtractedBytes: number;
  errorMessage?: string;
}
