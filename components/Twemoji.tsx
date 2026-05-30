'use client';

import React, { useMemo } from 'react';
import twemoji from 'twemoji';

// HTMLエスケープ用関数
const escapeHtml = (text: string) => {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const Twemoji = ({ text }: { text: string }) => {
  const parsedText = useMemo(() => {
    // 1. まずXSS対策としてHTMLエスケープを行う
    const escapedText = escapeHtml(text);

    // 2. その後、twemojiで絵文字コードを画像タグに変換する
    // (twemojiは既存のHTMLタグを壊さず、絵文字部分だけを<img>に置換します)
    return twemoji.parse(escapedText, {
      folder: 'svg',
      ext: '.svg',
      className: 'twemoji-emoji', // CSSクラス (width/height調整用)
    });
  }, [text]);

  return (
    <div
      className="text-base whitespace-pre-wrap leading-relaxed mb-2"
      // パース済みのHTML（絵文字画像を含む）を安全に表示
      dangerouslySetInnerHTML={{ __html: parsedText }}
    />
  );
};

export default Twemoji;