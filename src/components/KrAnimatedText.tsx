import type { CSSProperties } from 'react';

/** Preserve the full accessible text and its line wrapping while fading glyphs. */
export default function KrAnimatedText({ text }: { text: string }) {
  const characters = Array.from(text);
  return <span className="okr-copy-text">
    <span className="okr-copy-accessible">{text}</span>
    <span aria-hidden="true">{characters.map((character, index) => <span
      className="okr-copy-char" key={index}
      style={{ '--char-progress': (characters.length - index - 1) / Math.max(1, characters.length - 1) } as CSSProperties}
    >{character}</span>)}</span>
  </span>;
}
