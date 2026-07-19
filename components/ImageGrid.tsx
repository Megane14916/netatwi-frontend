'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGridProps {
  images?: string[];
}

export default function ImageGrid({ images }: ImageGridProps) {
  // 【修正】フックは必ず条件分岐の前に呼ぶ必要があります
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  // キーボード操作対応 (フックなので上に配置)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage(e as any);
      if (e.key === 'ArrowLeft') prevImage(e as any);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  // 画像がない場合のガード句はフックの後に行う
  if (!images || images.length === 0) return null;

  const count = images.length;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (count === 1) {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchOffset, setTouchOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchOffset(0);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null || lightboxIndex === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    
    // 最初/最後の画像でこれ以上進めない場合の抵抗
    if ((lightboxIndex === 0 && diff > 0) || (lightboxIndex === count - 1 && diff < 0)) {
      setTouchOffset(diff * 0.3);
    } else {
      setTouchOffset(diff);
    }
  };

  const onTouchEndEvent = () => {
    setIsDragging(false);
    if (touchStart === null) return;

    if (touchOffset < -minSwipeDistance && lightboxIndex !== null && lightboxIndex < count - 1) {
      setLightboxIndex(lightboxIndex + 1);
    } else if (touchOffset > minSwipeDistance && lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
    
    setTouchOffset(0);
    setTouchStart(null);
  };

  const nextImage = (e: React.MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex < images.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const prevImage = (e: React.MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const getSingleImageStyle = () => {
    if (!aspectRatio) return { maxHeight: '500px' };
    const minRatio = 1 / 1.91;
    const maxRatio = 1.91 / 1;
    let style: React.CSSProperties = {
        maxWidth: '100%',
        borderRadius: '0.75rem',
        cursor: 'pointer',
        objectFit: 'cover'
    };
    if (aspectRatio < minRatio) {
        style.aspectRatio = `${minRatio}`;
        style.maxHeight = '600px'; 
    } else if (aspectRatio > maxRatio) {
        style.aspectRatio = `${maxRatio}`;
    } else {
        style.aspectRatio = `${aspectRatio}`;
        style.maxHeight = '600px'; 
    }
    return style;
  };

  return (
    <>
      {/* グリッド表示 */}
      <div className="mt-2 w-full">
        {count === 1 && (
            <div className="overflow-hidden rounded-xl">
                 <img
                    src={images[0]}
                    alt="post image"
                    onLoad={handleImageLoad}
                    onClick={() => openLightbox(0)}
                    style={getSingleImageStyle()}
                    className="w-full h-full transition-opacity hover:opacity-90 bg-gray-800 dark:bg-gray-200"
                />
            </div>
        )}

        {count > 1 && (
          <div className="grid grid-cols-2 gap-0.5 w-full aspect-video rounded-xl overflow-hidden">
            {count === 2 && images.map((src, idx) => (
               <div key={idx} className="relative h-full w-full cursor-pointer bg-gray-800 dark:bg-gray-200" onClick={() => openLightbox(idx)}>
                  <img src={src} alt={`image-${idx}`} className="absolute inset-0 w-full h-full object-cover hover:opacity-90 transition-opacity" />
               </div>
            ))}
            {count === 3 && (
                <>
                    <div className="relative h-full w-full cursor-pointer bg-gray-800 dark:bg-gray-200" onClick={() => openLightbox(0)}>
                        <img src={images[0]} alt="image-0" className="absolute inset-0 w-full h-full object-cover hover:opacity-90 transition-opacity" />
                    </div>
                    <div className="flex flex-col gap-0.5 h-full w-full">
                        <div className="relative h-full w-full cursor-pointer bg-gray-800 dark:bg-gray-200" onClick={() => openLightbox(1)}>
                             <img src={images[1]} alt="image-1" className="absolute inset-0 w-full h-full object-cover hover:opacity-90 transition-opacity" />
                        </div>
                        <div className="relative h-full w-full cursor-pointer bg-gray-800 dark:bg-gray-200" onClick={() => openLightbox(2)}>
                             <img src={images[2]} alt="image-2" className="absolute inset-0 w-full h-full object-cover hover:opacity-90 transition-opacity" />
                        </div>
                    </div>
                </>
            )}
            {count === 4 && images.map((src, idx) => (
                 <div key={idx} className="relative h-full w-full cursor-pointer bg-gray-800 dark:bg-gray-200" onClick={() => openLightbox(idx)}>
                    <img src={src} alt={`image-${idx}`} className="absolute inset-0 w-full h-full object-cover hover:opacity-90 transition-opacity" />
                 </div>
            ))}
          </div>
        )}
      </div>

      {/* ライトボックス */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-white/95 dark:bg-black/95 flex items-center justify-center backdrop-blur-sm transition-colors" 
          onClick={closeLightbox}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndEvent}
        >
          <button onClick={closeLightbox} className="absolute top-[72px] left-4 text-black dark:text-white p-2 bg-black/10 dark:bg-white/10 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors z-[110]">
            <X className="w-8 h-8" />
          </button>
          {lightboxIndex > 0 && (
            <button onClick={prevImage} className="hidden sm:block absolute left-4 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white p-2 bg-black/10 dark:bg-white/10 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors z-[110]">
                <ChevronLeft className="w-10 h-10" />
            </button>
          )}
          <div 
            className="relative w-full h-full overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className={`flex h-full w-full ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
              style={{ transform: `translateX(calc(-${lightboxIndex * 100}% + ${touchOffset}px))` }}
            >
              {images.map((src, idx) => (
                <div key={idx} className="flex-none w-full h-full flex items-center justify-center p-4 md:p-10">
                  <img 
                      src={src} 
                      alt={`lightbox-${idx}`} 
                      className="max-w-full max-h-full object-contain shadow-2xl select-none pointer-events-none"
                  />
                </div>
              ))}
            </div>
          </div>
          {lightboxIndex < count - 1 && (
             <button onClick={nextImage} className="hidden sm:block absolute right-4 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white p-2 bg-black/10 dark:bg-white/10 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors z-[110]">
                <ChevronRight className="w-10 h-10" />
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-black/80 dark:text-white/80 font-medium text-sm bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full pointer-events-none">
             {lightboxIndex + 1} / {count}
          </div>
        </div>
      )}
    </>
  );
}