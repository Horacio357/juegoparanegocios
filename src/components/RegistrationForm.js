'use client';
import { useState } from 'react';

export default function RegistrationForm({ onRegister }) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/verify-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.exists) {
        setErrorMsg('Tus datos (Email, Nombre o Celular) ya registraron un descuento este mes. ¡Vuelve pronto!');
      } else {
        onRegister(formData);
      }
    } catch (err) {
      setErrorMsg('Error de conexión al verificar el correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content form-container">
        <h2>¡Regístrate para Jugar!</h2>
        <p>Ingresa tus datos para empezar. Solo se permite una partida por persona.</p>
        {errorMsg && <div style={{color: '#ff4757', marginBottom: '1rem', fontWeight: 'bold'}}>{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="lead-form">
          <div className="input-group">
            <label>Nombre Completo</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Juan Pérez" />
          </div>
          <div className="input-group">
            <label>Celular</label>
            <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Ej. 555-1234" />
          </div>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="juan@correo.com" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Verificando...' : 'Comenzar Juego'}
          </button>
        </form>
      </div>
    </div>
  );
}