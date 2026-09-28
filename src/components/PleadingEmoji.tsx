import React from 'react';
import roseEmoji from '../assets/rose-emoji.png';

export const PleadingEmoji: React.FC = () => {
  return (
    <div className="emoji-wrapper">
      <div className="emoji-glow" />
      <img
        className="emoji-img"
        src={roseEmoji}
        alt="Emoji galanteador com uma rosa na boca"
        width={210}
        height={140}
        draggable={false}
      />
    </div>
  );
};

export default PleadingEmoji;
