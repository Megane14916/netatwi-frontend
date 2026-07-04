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
                    className="w-full h-full transition-opacity hover:opacity-90 bg-gray-800"
                />
            </div>
        )}

        {count > 1 && (
          <div className="grid grid-cols-2 gap-0.5 w-full aspect-video rounded-xl overflow-hidden">
            {count === 2 && images.map((src, idx) => (
               <div key={idx} className="relative h-full w-full cursor-pointer bg-gray-800" onClick={() => openLightbox(idx)}>
                  <img src={src} alt={`image-${idx}`} className="absolute inset-0 w-full h-full object-cover hover:opacity-90 transition-opacity" />
               </div>
            ))}
            {count === 3 && (
                <>
                    <div className="relative h-full w-full cursor-pointer bg-gray-800" onClick={() => openLightbox(0)}>
                        <img src={images[0]} alt="image-0" className="absolute inset-0 w-full h-full object-cover hover:opacity-90 transition-opacity" />
                    </div>
                    <div className="flex flex-col gap-0.5 h-full w-full">
                        <div className="relative h-full w-full cursor-pointer bg-gray-800" onClick={() => openLightbox(1)}>
                             <img src={images[1]} alt="image-1" className="absolute inset-0 w-full h-full object-cover hover:opacity-90 transition-opacity" />
                        </div>
                        <div className="relative h-full w-full cursor-pointer bg-gray-800" onClick={() => openLightbox(2)}>
                             <img src={images[2]} alt="image-2" className="absolute inset-0 w-full h-full object-cover hover:opacity-90 transition-opacity" />
                        </div>
                    </div>
                </>
            )}
            {count === 4 && images.map((src, idx) => (
                 <div key={idx} className="relative h-full w-full cursor-pointer bg-gray-800" onClick={() => openLightbox(idx)}>
                    <img src={src} alt={`image-${idx}`} className="absolute inset-0 w-full h-full object-cover hover:opacity-90 transition-opacity" />
                 </div>
            ))}
          </div>
        )}
      </div>

      {/* ライトボックス */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-sm" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 left-4 text-white/70 hover:text-white p-2 bg-black/20 rounded-full hover:bg-white/10 transition-colors z-[110]">
            <X className="w-8 h-8" />
          </button>
          {lightboxIndex > 0 && (
            <button onClick={prevImage} className="absolute left-4 text-white/70 hover:text-white p-2 bg-black/20 rounded-full hover:bg-white/10 transition-colors z-[110]">
                <ChevronLeft className="w-10 h-10" />
            </button>
          )}
          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-10" onClick={(e) => e.stopPropagation()}>
              <img 
                  src={images[lightboxIndex]} 
                  alt={`lightbox-${lightboxIndex}`} 
                  className="max-w-full max-h-full object-contain shadow-2xl select-none"
              />
          </div>
          {lightboxIndex < count - 1 && (
             <button onClick={nextImage} className="absolute right-4 text-white/70 hover:text-white p-2 bg-black/20 rounded-full hover:bg-white/10 transition-colors z-[110]">
                <ChevronRight className="w-10 h-10" />
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/80 font-medium text-sm bg-black/50 px-3 py-1 rounded-full">
             {lightboxIndex + 1} / {count}
          </div>
        </div>
      )}
    </>
  );
}