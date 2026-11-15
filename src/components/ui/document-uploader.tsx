'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { compressImageToWebP, CompressionResult } from '@/lib/utils/image-compression';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  FileCheck,
  FileText,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploaderProps {
  label: string;
  description?: string;
  category: 'kyc' | 'complaints';
  value?: string;
  onChange: (fileUrl: string) => void;
  disabled?: boolean;
  accept?: string;
}

export function DocumentUploader({
  label,
  description,
  category,
  value,
  onChange,
  disabled = false,
  accept = 'image/jpeg,image/png,image/webp,image/heic,application/pdf',
}: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalKb: number;
    compressedKb: number;
    savingsPct: number;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(value || '');

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = '';

    setIsProcessing(true);
    setCompressionInfo(null);

    try {
      // 1. In-browser client WebP compression (FR-2.2 & FR-4.2)
      toast.info('Compressing image to WebP in browser...', { duration: 1500 });
      const compressed: CompressionResult = await compressImageToWebP(file, {
        maxDimension: 1600,
        maxSizeBytes: 150 * 1024, // 150 KB threshold
      });

      const savingsPct = Math.round((1 - compressed.compressedSize / compressed.originalSize) * 100);
      setCompressionInfo({
        originalKb: Math.round(compressed.originalSize / 1024),
        compressedKb: Math.round(compressed.compressedSize / 1024),
        savingsPct: Math.max(0, savingsPct),
      });

      setPreviewUrl(compressed.dataUrl);

      // 2. Fetch presigned PUT URL from API
      setIsUploading(true);
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: compressed.file.name,
          fileType: compressed.file.type,
          category,
        }),
      });

      if (!presignRes.ok) {
        throw new Error('Failed to obtain presigned upload URL');
      }

      const { uploadUrl, fileUrl } = await presignRes.json();

      // 3. Direct client-to-R2 upload (zero compute load on backend)
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': compressed.file.type,
        },
        body: compressed.blob,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with status ${uploadRes.status}`);
      }

      onChange(fileUrl);
      toast.success(
        `Uploaded successfully! (${Math.round(compressed.compressedSize / 1024)} KB)`,
        {
          description: savingsPct > 0 ? `Saved ${savingsPct}% space via WebP compression.` : undefined,
        }
      );
    } catch (err: any) {
      console.error('Document upload error:', err);
      toast.error('Upload failed: ' + (err.message || 'Please try again'));
      setPreviewUrl(value || '');
      setCompressionInfo(null);
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl('');
    setCompressionInfo(null);
    onChange('');
  };

  const isPdf = previewUrl.includes('.pdf') || previewUrl.startsWith('data:application/pdf');

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <span>{label}</span>
          {compressionInfo && (
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold">
              {compressionInfo.compressedKb} KB ({compressionInfo.savingsPct}% smaller)
            </Badge>
          )}
        </label>
        {description && (
          <span className="text-[11px] text-muted-foreground">{description}</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelected}
        className="hidden"
        disabled={disabled || isProcessing || isUploading}
      />

      {previewUrl ? (
        <div className="relative rounded-xl border border-border p-3 bg-card flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            {isPdf ? (
              <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            ) : (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                <Image
                  src={previewUrl}
                  alt="Uploaded preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold truncate text-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Uploaded &amp; Compressed</span>
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {compressionInfo
                  ? `${compressionInfo.originalKb} KB → ${compressionInfo.compressedKb} KB (WebP)`
                  : 'Stored securely in Cloud Storage'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || isProcessing || isUploading}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-rose-600 shrink-0"
            title="Remove document"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`
            border border-dashed border-border hover:border-primary/50 transition-colors
            rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer
            bg-muted/20 hover:bg-muted/40 min-h-[96px]
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isProcessing || isUploading ? (
            <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>
                {isProcessing ? 'Compressing to WebP (<150 KB)...' : 'Uploading to secure storage...'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Camera className="w-5 h-5 sm:hidden" />
                <UploadCloud className="w-5 h-5 hidden sm:block" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                <span className="sm:hidden">Tap to capture or upload photo</span>
                <span className="hidden sm:inline">Click to upload or drag and drop</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Aadhaar, Student ID, or photo • Auto-compressed to WebP &lt;150 KB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

