'use client';

import React, { useMemo } from 'react';
// 'twemoji'ライブラリのインポート方法を修正
import twemoji from 'twemoji';

const Twemoji = ({ text }: { text: string }) => {
  // textが変更されたときだけ、パース処理を実行する
  const parsedText = useMemo(
    () =>
      twemoji.parse(text, {
        folder: 'svg',
        ext: '.svg',
        className: 'twemoji-emoji', // globals.cssで定義したCSSクラスを適用
      }),
    [text]
  );

  return (
    <div
      className="mt-1 text-gray-300 whitespace-pre-wrap"
      // パースしたHTMLを安全に表示
      dangerouslySetInnerHTML={{ __html: parsedText }}
    />
  );
};

export default Twemoji;

