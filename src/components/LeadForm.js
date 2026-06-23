'use client';
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function LeadForm({ discount, playerData, onSubmitSuccess }) {
  const [loading, setLoading] = useState(true);
  const [showCard, setShowCard] = useState(false);
  const hasSubmitted = React.useRef(false);

  useEffect(() => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    const submitLead = async () => {
      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...playerData, stageReached: 0, discountWon: discount })
        });

        if (res.ok) {
          setShowCard(true);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 10000 });
          
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc1 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
            osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
            osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); // C6
            
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
            
            osc1.connect(gain);
            gain.connect(ctx.destination);
            osc1.start();
            osc1.stop(ctx.currentTime + 1.0);
          } catch(e) { console.log(e); }
        } else {
          alert('Hubo un error al guardar tus datos.');
        }
      } catch (error) {
        console.error(error);
        alert('Error de conexión al enviar el premio.');
      } finally {
        setLoading(false);
      }
    };

    submitLead();
  }, [discount, playerData]);

  if (showCard) {
    return (
      <div className="modal-overlay">
        <div className="modal-content premium-card" id="discount-card">
          <h2>¡Felicidades {playerData.name}!</h2>
          <div className="discount-badge">
            <span className="percent">{discount}%</span>
            <span className="off">OFF</span>
          </div>
          <p>¡Gran esfuerzo en el juego!</p>
          <div className="card-details">
            <p>Válido para tu próxima compra.</p>
            <p className="code">CÓDIGO: JUGADOR-{discount.toFixed(1)}</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => {
              window.print();
            }}
          >
            Descargar tarjeta
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => {
              onSubmitSuccess();
            }}
          >
            Jugar de Nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content form-container" style={{textAlign: 'center'}}>
        <div className="bubble-icon">✨</div>
        <h2>Procesando Premio...</h2>
        <p>Asegurando tu {discount.toFixed(1)}% de descuento total.</p>
        <div style={{marginTop: '2rem'}}>Cargando...</div>
      </div>
    </div>
  );
}
