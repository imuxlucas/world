import { publicUrl } from '../publicUrl';
import { useEffect, useRef } from 'react';

export default function BackgroundMusic() {
  const audio = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const player = audio.current!;
    player.volume = .5;
    const start = () => {
      if (player.paused) void player.play().catch(() => {});
    };
    start();
    document.addEventListener('pointerdown', start);
    document.addEventListener('keydown', start);
    return () => {
      document.removeEventListener('pointerdown', start);
      document.removeEventListener('keydown', start);
      player.pause();
    };
  }, []);
  return <audio ref={audio} src={publicUrl("/media/audio/thirsty-instrumental.mp3")} loop preload="auto" aria-hidden="true" />;
}
