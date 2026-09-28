import React, { useState, useRef } from 'react';
import { Heart } from 'lucide-react';
import FloatingHearts from './FloatingHearts';
import PleadingEmoji from './PleadingEmoji';
import RunawayButton from './RunawayButton';
import TimeSelection from './TimeSelection';
import DateConfirmed from './DateConfirmed';
import type { AvailableTime } from '../config/dateConfig';
import type { InvitationStep } from '../types';

export const DateInvitation: React.FC = () => {
  const [step, setStep] = useState<InvitationStep>('ask');
  const [confirmedTime, setConfirmedTime] = useState<AvailableTime | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleYesClick = () => {
    setStep('time');
  };

  const handleTimeConfirmed = (time: AvailableTime) => {
    setConfirmedTime(time);
    setStep('confirmed');
  };

  return (
    <main className="romantic-container">
      <FloatingHearts />

      {/* Top Badge */}
      <header className="top-capsule" role="banner">
        <span>POR FAVOR!!</span>
        <Heart size={16} fill="#ffffff" color="#ffffff" />
      </header>

      {/* Center Dynamic Content */}
      {step === 'ask' && (
        <>
          <PleadingEmoji />

          <section ref={cardRef} className="content-box" aria-labelledby="question-heading">
            <div className="question-text">
              <h1 id="question-heading" className="question-title">
                <strong>Vossa Senhoria</strong>, <span className="nowrap">conceder-me-ia</span> a honra de vossa companhia para um encontro?
              </h1>
              <p className="question-subtitle">
                Seria para este humilde cavalheiro um grande privilégio desfrutar de algumas horas ao lado de tão distinta dama.
              </p>
              <p className="question-subtitle">
                Resta-me apenas aguardar, com esperança, vosso gracioso “sim”. 🌹
              </p>
            </div>

            <div className="buttons-group">
              <button
                type="button"
                className="btn-yes"
                onClick={handleYesClick}
                aria-label="Aceitar convite de encontro"
              >
                <span>SIM</span>
                <Heart size={20} fill="#ffffff" color="#ffffff" />
              </button>

              <RunawayButton avoidRef={cardRef} />
            </div>
          </section>
        </>
      )}

      {step === 'time' && (
        <>
          <PleadingEmoji />
          <TimeSelection onConfirmed={handleTimeConfirmed} />
        </>
      )}

      {step === 'confirmed' && confirmedTime && (
        <DateConfirmed time={confirmedTime} />
      )}

      {/* Subtle bottom spacer for safe area balance */}
      <footer style={{ height: '10px' }} aria-hidden="true" />
    </main>
  );
};

export default DateInvitation;
