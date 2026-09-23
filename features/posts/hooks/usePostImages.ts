"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/imageCompression";
import {
  IMAGE_SIZE_ERROR,
  MAX_IMAGE_TOTAL_BYTES,
  MAX_POST_IMAGES,
  getTotalImageSize,
} from "../model/postForm";

interface AddPostImagesResult {
  ok: boolean;
  error?: string;
}

export const usePostImages = (initialUrls: string[] = []) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialUrls);
  const [isCompressingImages, setIsCompressingImages] = useState(false);
  const selectedImagesRef = useRef(selectedImages);
  const previewUrlsRef = useRef(previewUrls);
  const ownedUrlsRef = useRef(new Set<string>());

  selectedImagesRef.current = selectedImages;
  previewUrlsRef.current = previewUrls;

  const revokeOwnedUrl = useCallback((url: string) => {
    if (!ownedUrlsRef.current.delete(url)) return;
    URL.revokeObjectURL(url);
  }, []);

  const replaceWithExistingImages = useCallback((urls: string[]) => {
    ownedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    ownedUrlsRef.current.clear();
    setSelectedImages([]);
    setPreviewUrls(urls);
  }, []);

  const addImages = useCallback(async (files: File[]): Promise<AddPostImagesResult> => {
    const remaining = MAX_POST_IMAGES - previewUrlsRef.current.length;
    const filesToAdd = files.slice(0, remaining);
    if (filesToAdd.length === 0) return { ok: true };

    setIsCompressingImages(true);
    try {
      const compressedFiles: File[] = [];
      for (const file of filesToAdd) compressedFiles.push(await compressImage(file));
      if (
        getTotalImageSize([...selectedImagesRef.current, ...compressedFiles]) >
        MAX_IMAGE_TOTAL_BYTES
      ) {
        return { ok: false, error: IMAGE_SIZE_ERROR };
      }

      const urls = compressedFiles.map((file) => {
        const url = URL.createObjectURL(file);
        ownedUrlsRef.current.add(url);
        return url;
      });
      setSelectedImages((current) => [...current, ...compressedFiles]);
      setPreviewUrls((current) => [...current, ...urls]);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "画像の圧縮に失敗しました",
      };
    } finally {
      setIsCompressingImages(false);
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    const targetUrl = previewUrlsRef.current[index];
    if (!targetUrl) return;
    const blobIndex = previewUrlsRef.current
      .slice(0, index)
      .filter((url) => ownedUrlsRef.current.has(url)).length;
    setPreviewUrls((current) => current.filter((_, currentIndex) => currentIndex !== index));
    if (ownedUrlsRef.current.has(targetUrl)) {
      setSelectedImages((current) => current.filter((_, currentIndex) => currentIndex !== blobIndex));
      revokeOwnedUrl(targetUrl);
    }
  }, [revokeOwnedUrl]);

  useEffect(
    () => () => {
      ownedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      ownedUrlsRef.current.clear();
    },
    [],
  );

  return {
    selectedImages,
    previewUrls,
    isCompressingImages,
    addImages,
    removeImage,
    replaceWithExistingImages,
  };
};
