"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Sparkles, ImageIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { enhancePhotoClientSide } from "@/lib/photoroom/client";
import { compressImageFile } from "@/lib/image-compress";
import { dataUrlToFile } from "@/lib/data-url";

interface PhotoUploadProps {
  photos: string[];
  enhancedPhotos: string[];
  onAdd: (photos: string[]) => void;
  onRemove: (index: number) => void;
  onEnhanced?: (index: number, enhanced: string) => void;
  onProcessingChange?: (processing: boolean) => void;
  maxPhotos?: number;
}

export function PhotoUpload({
  photos,
  enhancedPhotos,
  onAdd,
  onRemove,
  onEnhanced,
  onProcessingChange,
  maxPhotos = 10,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const remaining = maxPhotos - photos.length;
      const toProcess = Array.from(files).slice(0, remaining);
      if (!toProcess.length) return;

      onProcessingChange?.(true);
      try {
        const urls = await Promise.all(
          toProcess.map((file) => compressImageFile(file))
        );
        onAdd(urls);
      } finally {
        onProcessingChange?.(false);
      }
    },
    [maxPhotos, onAdd, onProcessingChange, photos.length]
  );

  const handleEnhance = async (index: number) => {
    const photo = photos[index];
    if (!photo || !onEnhanced) return;

    setEnhancingIndex(index);
    try {
      const file = dataUrlToFile(photo, `photo-${index + 1}.jpg`);
      const enhanced = await enhancePhotoClientSide(file, {
        brightness: 1.08,
        contrast: 1.12,
        whiteBackground: true,
      });
      onEnhanced(index, enhanced);
    } catch {
      // Keep original on failure
    } finally {
      setEnhancingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors",
          photos.length >= maxPhotos
            ? "border-muted bg-muted/30 cursor-not-allowed"
            : "border-[#0064D2]/30 bg-[#0064D2]/5 hover:border-[#0064D2]/50 hover:bg-[#0064D2]/10"
        )}
        onClick={() => photos.length < maxPhotos && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={photos.length >= maxPhotos}
        />
        <Upload className="mb-3 h-10 w-10 text-[#0064D2]/60" />
        <p className="text-sm font-medium">Drop photos here or tap to upload</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {photos.length}/{maxPhotos} photos · JPG, PNG, WEBP
        </p>
      </div>

      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            {photos.map((photo, index) => (
              <motion.div
                key={`${photo.slice(0, 32)}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={enhancedPhotos[index] || photo}
                  alt={`Product photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-end justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs"
                    disabled={enhancingIndex === index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnhance(index);
                    }}
                  >
                    {enhancingIndex === index ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1 h-3 w-3" />
                    )}
                    Enhance
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {enhancedPhotos[index] && (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-green-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Enhanced
                  </span>
                )}
              </motion.div>
            ))}

            {photos.length < maxPhotos && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-[#0064D2]/40 hover:text-[#0064D2]"
              >
                <ImageIcon className="mb-1 h-6 w-6" />
                <span className="text-xs">Add more</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
