import React, { useState } from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dateConfig } from '../config/dateConfig';
import type { AvailableTime } from '../config/dateConfig';

interface TimeSelectionProps {
  onConfirmed: (time: AvailableTime) => void;
}

export const TimeSelection: React.FC<TimeSelectionProps> = ({ onConfirmed }) => {
  const [selectedTime, setSelectedTime] = useState<AvailableTime | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectTime = (time: AvailableTime) => {
    setSelectedTime(time);
    if (errorMessage) setErrorMessage(null);
  };

  const handleConfirm = async () => {
    if (!selectedTime || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isSupabaseConfigured) {
        // See supabase/schema.sql: one response per invitation, validated server-side
        const { error } = await supabase.rpc('submit_date_response', {
          p_invitation_id: dateConfig.invitationId,
          p_selected_time: selectedTime,
        });

        if (error) {
          console.error('Supabase error:', error);
          throw new Error(error.message);
        }
      } else {
        // Fallback for preview / dev if keys not set
        console.warn('Supabase not configured with live credentials. Simulating response save.');
        await new Promise((resolve) => setTimeout(resolve, 600));
        localStorage.setItem(
          'preview_date_response',
          JSON.stringify({
            invitation_id: dateConfig.invitationId,
            selected_time: selectedTime,
            response: 'accepted',
            created_at: new Date().toISOString(),
          })
        );
      }

      // Notify parent to transition to final celebration screen
      onConfirmed(selectedTime);
    } catch (err: unknown) {
      console.error('Error confirming date:', err);
      setErrorMessage('Ops... não consegui confirmar ainda 🥺');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-box">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
          Agora só falta escolher o horário ❤️
        </h2>
        <p style={{ fontSize: '0.98rem', color: '#ffb3c1', fontWeight: 500 }}>
          Que horas eu passo para te buscar?
        </p>
      </div>

      <div className="time-options-grid" role="radiogroup" aria-label="Escolha do horário">
        {dateConfig.availableTimes.map((time) => {
          const isSelected = selectedTime === time;
          return (
            <button
              key={time}
              type="button"
              className={`time-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelectTime(time)}
              role="radio"
              aria-checked={isSelected}
              disabled={isSubmitting}
            >
              <Clock size={24} color={isSelected ? '#ff3366' : '#ffccd5'} />
              <span className="time-card-val">{time}</span>
              <span className="time-card-status">
                {isSelected ? (
                  <>
                    <Check size={16} strokeWidth={3} /> Selecionado
                  </>
                ) : (
                  'Disponível'
                )}
              </span>
            </button>
          );
        })}
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'rgba(255, 50, 50, 0.2)',
            border: '1px solid rgba(255, 100, 100, 0.4)',
            borderRadius: '12px',
            color: '#ffcdd2',
            fontSize: '0.9rem',
            width: '100%',
          }}
          role="alert"
        >
          <AlertCircle size={18} color="#ff5252" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        className="btn-confirm"
        disabled={!selectedTime || isSubmitting}
        onClick={handleConfirm}
      >
        {isSubmitting ? (
          <>
            <div className="spinner" />
            <span>Confirmando...</span>
          </>
        ) : errorMessage ? (
          'Tentar novamente ❤️'
        ) : (
          'Confirmar nosso encontro ❤️'
        )}
      </button>
    </div>
  );
};

export default TimeSelection;
