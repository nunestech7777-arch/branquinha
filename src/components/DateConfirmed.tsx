import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Sparkles, MapPin, Calendar } from 'lucide-react';
import { dateConfig } from '../config/dateConfig';
import type { AvailableTime } from '../config/dateConfig';

interface DateConfirmedProps {
  time: AvailableTime;
}

export const DateConfirmed: React.FC<DateConfirmedProps> = ({ time }) => {
  useEffect(() => {
    // Fire celebratory romantic confetti
    const count = 200;
    const defaults = {
      origin: { y: 0.65 },
      colors: ['#ff3366', '#ff758c', '#ffffff', '#ffd166', '#ff0055'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  return (
    <div className="confirmed-card">
      <div
        style={{
          width: '74px',
          height: '74px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff3366 0%, #e60039 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(255, 51, 102, 0.5)',
        }}
      >
        <Heart size={38} color="#ffffff" fill="#ffffff" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            color: '#ffd166',
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <Sparkles size={16} /> É oficial! <Sparkles size={16} />
        </div>
        <h1
          style={{
            fontSize: '1.65rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#ffffff',
          }}
        >
          ENCONTRO CONFIRMADO ❤️
        </h1>
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '18px',
          padding: '1.1rem 1.4rem',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
        }}
      >
        <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
          Te busco às <span style={{ color: '#ff4d6d' }}>{time}</span>.
        </p>

        {dateConfig.location && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.88rem',
              color: '#ffccd5',
            }}
          >
            <MapPin size={15} color="#ff758c" />
            <span>{dateConfig.location}</span>
          </div>
        )}

        {dateConfig.date && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.88rem',
              color: '#ffccd5',
            }}
          >
            <Calendar size={15} color="#ff758c" />
            <span>{dateConfig.date}</span>
          </div>
        )}
      </div>

      <p
        style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: '#ffb3c1',
          fontStyle: 'italic',
        }}
      >
        Agora não tem mais volta... 🥰
      </p>
    </div>
  );
};

export default DateConfirmed;
