import { useEffect, useState } from 'react';

export default function Leaderboard({ onBack }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        setLeads(data);
      } catch (err) {
        console.error('Error fetching leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="modal-content form-container" style={{textAlign: 'center', maxWidth: '500px', margin: '0 auto'}}>
      <div className="bubble-icon">🏆</div>
      <h2>Ranking de Jugadores</h2>
      <p style={{marginBottom: '2rem'}}>Los mejores puntajes y descuentos históricos.</p>

      {loading ? (
        <div>Cargando ranking...</div>
      ) : (
        <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '2rem'}}>
          <thead>
            <tr style={{borderBottom: '1px solid rgba(255,255,255,0.2)', opacity: 0.8}}>
              <th style={{padding: '0.5rem'}}>#</th>
              <th style={{padding: '0.5rem', textAlign: 'left'}}>Jugador</th>
              <th style={{padding: '0.5rem'}}>Nivel</th>
              <th style={{padding: '0.5rem', textAlign: 'right'}}>Descuento</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
              <tr key={lead.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: index < 3 ? 'bold' : 'normal', color: index === 0 ? '#feca57' : index === 1 ? '#e1e1e1' : index === 2 ? '#cd7f32' : 'inherit'}}>
                <td style={{padding: '0.8rem'}}>{index + 1}</td>
                <td style={{padding: '0.8rem', textAlign: 'left'}}>{lead.name}</td>
                <td style={{padding: '0.8rem'}}>{lead.stageReached}</td>
                <td style={{padding: '0.8rem', textAlign: 'right'}}>{lead.discountWon}%</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan="4" style={{padding: '2rem', opacity: 0.5}}>Aún no hay jugadores. ¡Sé el primero!</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <button onClick={onBack} className="btn-secondary">Volver al Menú</button>
    </div>
  );
}