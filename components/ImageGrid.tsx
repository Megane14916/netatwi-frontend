'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGridProps {
  images?: string[];
}

export default function ImageGrid({ images }: ImageGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null); // 1枚目の画像のアスペクト比

  if (!images || images.length === 0) return null;

  const count = images.length;

  // 1枚の画像のアスペクト比を取得してレイアウトを決定する
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

  // キーボード操作対応
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage(e);
      if (e.key === 'ArrowLeft') prevImage(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  // --- 1枚表示のスタイル計算 ---
  const getSingleImageStyle = () => {
    if (!aspectRatio) return { maxHeight: '500px' }; // ロード前デフォルト

    // Xの仕様に近いトリミング基準
    // 縦長すぎる場合 (1:1.91以上) -> 縦をトリミング
    // 横長すぎる場合 (1.91:1以上) -> 横をトリミング（今回はコンテナ幅依存なので実質高さ制限）
    
    // 許容範囲
    const minRatio = 1 / 1.91; // 約0.52
    const maxRatio = 1.91 / 1; // 1.91

    let style: React.CSSProperties = {
        maxWidth: '100%',
        borderRadius: '0.75rem', // rounded-xl
        border: '1px solid #374151', // border-gray-700
        cursor: 'pointer',
        objectFit: 'cover'
    };

    if (aspectRatio < minRatio) {
        // 縦長すぎる -> アスペクト比を強制して中央トリミング
        style.aspectRatio = `${minRatio}`;
        style.maxHeight = '600px'; 
    } else if (aspectRatio > maxRatio) {
        // 横長すぎる -> アスペクト比を強制して中央トリミング
        style.aspectRatio = `${maxRatio}`;
    } else {
        // 範囲内 -> 元の比率を使用 (ただし高さ制限は設ける)
        style.aspectRatio = `${aspectRatio}`;
        style.maxHeight = '600px'; 
    }

    return style;
  };

  return (
    <>
      {/* --- グリッド表示 --- */}
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
          <div className="grid grid-cols-2 gap-0.5 w-full aspect-video rounded-xl overflow-hidden border border-gray-700">
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

      {/* --- ライトボックス --- */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-sm" onClick={closeLightbox}>
          {/* 閉じるボタン */}
          <button 
            onClick={closeLightbox} 
            className="absolute top-4 left-4 text-white hover:text-white p-2 bg-black/20 rounded-full hover:bg-white/10 transition-colors z-[110]"
          >
            <X className="w-8 h-8" />
          </button>

          {/* 前へボタン */}
          {lightboxIndex > 0 && (
            <button 
                onClick={prevImage}
                className="absolute left-4 text-white/70 hover:text-white p-2 bg-black/20 rounded-full hover:bg-white/10 transition-colors z-[110]"
            >
                <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          {/* 画像本体 */}
          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-10">
              <img 
                  src={images[lightboxIndex]} 
                  alt={`lightbox-${lightboxIndex}`} 
                  className="max-w-full max-h-full object-contain shadow-2xl select-none"
                  onClick={(e) => e.stopPropagation()}
              />
          </div>

          {/* 次へボタン */}
          {lightboxIndex < count - 1 && (
             <button 
                onClick={nextImage}
                className="absolute right-4 text-white/70 hover:text-white p-2 bg-black/20 rounded-full hover:bg-white/10 transition-colors z-[110]"
            >
                <ChevronRight className="w-10 h-10" />
            </button>
          )}
          
          {/* カウンター */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/80 font-medium text-sm bg-black/50 px-3 py-1 rounded-full">
             {lightboxIndex + 1} / {count}
          </div>
        </div>
      )}
    </>
  );
}