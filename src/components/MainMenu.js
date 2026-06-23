export default function MainMenu({ onSelectMode }) {
  return (
    <div className="modal-content form-container" style={{textAlign: 'center', maxWidth: '400px', margin: '0 auto'}}>
      <div className="bubble-icon">🎮</div>
      <h2>¡Bienvenido!</h2>
      <p style={{marginBottom: '2rem'}}>Elige un modo de juego o revisa los puntajes.</p>

      <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
        <button onClick={() => onSelectMode('classic')} className="btn-primary">
          Modo Clásico (Por Vidas)
        </button>
        <button onClick={() => onSelectMode('time_attack')} className="btn-primary" style={{background: 'var(--color-secondary)'}}>
          Modo Contrarreloj (Por Tiempo)
        </button>
        <button onClick={() => onSelectMode('ranking')} className="btn-secondary" style={{marginTop: '1rem'}}>
          🏆 Ver Ranking de Jugadores
        </button>
      </div>
    </div>
  );
}