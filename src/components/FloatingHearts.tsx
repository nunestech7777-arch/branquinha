import React, { useMemo } from 'react';

interface HeartData {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  char: string;
}

export const FloatingHearts: React.FC = () => {
  const hearts: HeartData[] = useMemo(() => {
    const heartChars = ['❤️', '💖', '💕', '✨', '💓'];
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: Math.random() * 92 + 4, // 4% to 96%
      size: Math.random() * 1.2 + 0.9, // 0.9rem to 2.1rem
      duration: Math.random() * 6 + 7, // 7s to 13s
      delay: Math.random() * 5, // 0s to 5s
      opacity: Math.random() * 0.35 + 0.2, // 0.2 to 0.55
      char: heartChars[Math.floor(Math.random() * heartChars.length)],
    }));
  }, []);

  return (
    <div className="floating-hearts-layer" aria-hidden="true">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="floating-heart"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}rem`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            opacity: h.opacity,
          }}
        >
          {h.char}
        </span>
      ))}
    </div>
  );
};

export default FloatingHearts;
