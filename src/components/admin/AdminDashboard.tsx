import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, LogOut, Heart, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { dateConfig } from '../../config/dateConfig';
import type { DateResponse } from '../../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [response, setResponse] = useState<DateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchResponse = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    setFeedback(null);

    try {
      if (!isSupabaseConfigured) {
        // Dev / Demo preview
        const stored = localStorage.getItem('preview_date_response');
        if (stored) {
          setResponse(JSON.parse(stored));
        } else {
          setResponse(null);
        }
        if (showRefreshingSpinner) setFeedback('Dados atualizados com sucesso.');
        return;
      }

      const { data, error } = await supabase
        .from('date_responses')
        .select('*')
        .eq('invitation_id', dateConfig.invitationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setResponse(data as DateResponse | null);
      if (showRefreshingSpinner) setFeedback('Dados atualizados com sucesso.');
    } catch (err: any) {
      console.error('Error fetching responses:', err);
      setFeedback('Erro ao buscar resposta do banco.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchResponse();

    // Supabase Realtime listener
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('date_responses_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'date_responses',
            filter: `invitation_id=eq.${dateConfig.invitationId}`,
          },
          (payload) => {
            if (payload.new) {
              setResponse(payload.new as DateResponse);
              setFeedback('Nova resposta recebida em tempo real! 🎉');
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchResponse]);

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      } else {
        localStorage.removeItem('admin_demo_session');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      onLogout();
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Data não informada';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '580px', margin: '0 auto' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            Painel do Encontro
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
            Acompanhamento do convite em tempo real
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => fetchResponse(true)}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              background: '#232734',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <RefreshCw
              size={15}
              style={{
                animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
              }}
            />
            <span>{isRefreshing ? 'Buscando...' : 'Atualizar'}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              color: '#f87171',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '0.65rem 1rem',
            marginBottom: '1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            background: feedback.includes('Erro')
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${
              feedback.includes('Erro') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'
            }`,
            color: feedback.includes('Erro') ? '#fca5a5' : '#6ee7b7',
          }}
        >
          {feedback}
        </div>
      )}

      {isLoading ? (
        <div
          className="admin-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 1rem',
            gap: '1rem',
          }}
        >
          <div className="spinner" style={{ width: '28px', height: '28px' }} />
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Carregando dados do convite...</p>
        </div>
      ) : response ? (
        /* Confirmed State */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Main Hero Card */}
          <div
            className="admin-card"
            style={{
              background: 'linear-gradient(145deg, #1f2330 0%, #171a24 100%)',
              border: '1px solid rgba(255, 51, 102, 0.25)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 51, 102, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                }}
              >
                HORÁRIO ESCOLHIDO
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  background: 'rgba(230, 0, 57, 0.2)',
                  border: '1px solid rgba(230, 0, 57, 0.4)',
                  color: '#ff6688',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                <Heart size={14} fill="#ff6688" /> Encontro confirmado
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.75rem',
                margin: '0.5rem 0 1.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '3.2rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                {response.selected_time}
              </span>
              <Clock size={28} color="#ff3366" />
            </div>

            <div
              style={{
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#9ca3af',
                fontSize: '0.85rem',
              }}
            >
              <Calendar size={15} />
              <span>Respondido em: {formatDate(response.updated_at || response.created_at)}</span>
            </div>
          </div>

          {/* Details Breakdown */}
          <div className="admin-card">
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '1rem',
              }}
            >
              RESPOSTA
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: '#232734',
                  borderRadius: '12px',
                }}
              >
                <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Aceitou o encontro:</span>
                <span
                  style={{
                    color: '#ffffff',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  SIM <Heart size={15} fill="#ff3366" color="#ff3366" />
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: '#232734',
                  borderRadius: '12px',
                }}
              >
                <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Horário escolhido:</span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>
                  {response.selected_time}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: '#232734',
                  borderRadius: '12px',
                }}
              >
                <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Status da resposta:</span>
                <span
                  style={{
                    color: '#34d399',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <CheckCircle2 size={16} /> Salvo com sucesso
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Waiting / Empty State */
        <div
          className="admin-card"
          style={{
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
            }}
          >
            <Clock size={32} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Aguardando resposta... ❤️
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              O convite ainda não foi respondido.
            </p>
          </div>

          <div
            style={{
              background: '#232734',
              borderRadius: '12px',
              padding: '1rem 1.5rem',
              width: '100%',
              display: 'flex',
              justifyContent: 'space-around',
              marginTop: '0.5rem',
            }}
          >
            <div>
              <div style={{ color: '#6b7280', fontSize: '0.78rem', fontWeight: 600 }}>HORÁRIO</div>
              <div style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>--:--</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: '0.78rem', fontWeight: 600 }}>STATUS</div>
              <div style={{ color: '#f59e0b', fontSize: '0.95rem', fontWeight: 700 }}>Aguardando</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
