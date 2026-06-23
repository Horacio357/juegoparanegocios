'use client';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [settings, setSettings] = useState(null);
  const [leads, setLeads] = useState([]);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState({ 1: null, 2: null, 3: null });
  const [uploadingStage, setUploadingStage] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
      fetchLeads();
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
      showToast('Error cargando configuración. La base de datos puede estar desactualizada.', 'error');
      // Set default settings to prevent crash
      setSettings({ colorTheme: 1, discountPerBrick: 0.5, maxDiscount: 50, gameMode: 'classic' });
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
      showToast('Error cargando leads.', 'error');
      setLeads([]);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      showToast('Configuración guardada con éxito', 'success');
    } catch (e) {
      showToast('Error guardando configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (stage) => {
    const fileToUpload = files[stage];
    if (!fileToUpload) return;
    setUploadingStage(stage);
    const formData = new FormData();
    formData.append('image', fileToUpload);
    formData.append('stageField', stage.toString());
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setSettings(data);
      showToast(`Imagen del Nivel ${stage} subida correctamente`, 'success');
      setFiles(prev => ({ ...prev, [stage]: null }));
    } catch (err) {
      showToast(`Error al subir imagen del Nivel ${stage}`, 'error');
    } finally {
      setUploadingStage(null);
    }
  };

  const downloadCSV = () => {
    const headers = ['Fecha', 'Nombre', 'Email', 'Celular', 'Nivel Alcanzado', 'Dcto Ganado (%)'];
    const rows = leads.map(l => [
      new Date(l.createdAt).toLocaleDateString(),
      `"${l.name}"`,
      `"${l.email}"`,
      `"${l.phone}"`,
      l.stageReached,
      l.discountWon
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leads_arkanoid.csv';
    link.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="main-container" style={{ justifyContent: 'center', height: '100vh' }}>
        <form onSubmit={handleLogin} className="modal-content" style={{ animation: 'none' }}>
          <h2>Acceso Admin</h2>
          <div className="input-group" style={{ margin: '2rem 0' }}>
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">Entrar</button>
        </form>
      </div>
    );
  }

  if (!settings) return <div className="main-container">Cargando...</div>;

  return (
    <div className="main-container" style={{ alignItems: 'flex-start', width: '100%', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'success' ? '✨' : '❌'} {toast.message}
        </div>
      )}
      <header className="header" style={{ textAlign: 'left', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
        <h1>Panel de Control</h1>
        <button className="btn-secondary" onClick={() => setIsAuthenticated(false)}>Salir</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', width: '100%' }}>
        {/* Configuración */}
        <section className="modal-content" style={{ animation: 'none', margin: 0, padding: '2rem', textAlign: 'left' }}>
          <h2>Configuración del Juego</h2>
          <form onSubmit={saveSettings} className="lead-form">
            <div className="input-group">
              <label>Tema de Colores</label>
              <select 
                value={settings.colorTheme}
                onChange={e => setSettings({...settings, colorTheme: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', color: 'inherit', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              >
                <option value={1} style={{color: 'black'}}>1. Neon Cyberpunk</option>
                <option value={2} style={{color: 'black'}}>2. Oscuro Elegante Dorado</option>
                <option value={3} style={{color: 'black'}}>3. Atardecer Vibrante</option>
                <option value={4} style={{color: 'black'}}>4. Corporativo Azul</option>
                <option value={5} style={{color: 'black'}}>5. Bosque Esmeralda</option>
              </select>
            </div>

            <div className="input-group" style={{ marginTop: '1rem', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
              <label style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Imágenes de Fondo por Nivel</label>
              
              {/* Nivel 1 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <strong>Nivel 1 (Por Defecto)</strong>
                {settings.bgImagePath && (
                  <div style={{ margin: '0.5rem 0' }}>
                    <img src={settings.bgImagePath} alt="Logo Nivel 1" style={{ maxWidth: '150px', borderRadius: '8px' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input type="file" accept="image/*" onChange={e => setFiles({...files, 1: e.target.files[0]})} style={{ flex: 1 }} />
                  <button type="button" onClick={() => handleImageUpload(1)} disabled={!files[1] || uploadingStage === 1} className="btn-secondary" style={{ margin: 0, padding: '0.5rem 1rem' }}>
                    {uploadingStage === 1 ? 'Subiendo...' : 'Subir N1'}
                  </button>
                </div>
              </div>

              {/* Nivel 2 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <strong>Nivel 2</strong>
                {settings.bgImagePathStage2 && (
                  <div style={{ margin: '0.5rem 0' }}>
                    <img src={settings.bgImagePathStage2} alt="Logo Nivel 2" style={{ maxWidth: '150px', borderRadius: '8px' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input type="file" accept="image/*" onChange={e => setFiles({...files, 2: e.target.files[0]})} style={{ flex: 1 }} />
                  <button type="button" onClick={() => handleImageUpload(2)} disabled={!files[2] || uploadingStage === 2} className="btn-secondary" style={{ margin: 0, padding: '0.5rem 1rem' }}>
                    {uploadingStage === 2 ? 'Subiendo...' : 'Subir N2'}
                  </button>
                </div>
              </div>

              {/* Nivel 3 */}
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Nivel 3+</strong>
                {settings.bgImagePathStage3 && (
                  <div style={{ margin: '0.5rem 0' }}>
                    <img src={settings.bgImagePathStage3} alt="Logo Nivel 3" style={{ maxWidth: '150px', borderRadius: '8px' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input type="file" accept="image/*" onChange={e => setFiles({...files, 3: e.target.files[0]})} style={{ flex: 1 }} />
                  <button type="button" onClick={() => handleImageUpload(3)} disabled={!files[3] || uploadingStage === 3} className="btn-secondary" style={{ margin: 0, padding: '0.5rem 1rem' }}>
                    {uploadingStage === 3 ? 'Subiendo...' : 'Subir N3+'}
                  </button>
                </div>
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label>Posición de Imagen de Fondo</label>
              <select 
                value={settings.bgImagePosition || 'center'}
                onChange={e => setSettings({...settings, bgImagePosition: e.target.value})}
                style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', color: 'inherit', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              >
                <option value="center" style={{color: 'black'}}>Centrado (Original)</option>
                <option value="cover" style={{color: 'black'}}>Cubrir Toda la Pantalla</option>
                <option value="topleft" style={{color: 'black'}}>Esquina Superior Izquierda</option>
                <option value="topright" style={{color: 'black'}}>Esquina Superior Derecha</option>
                <option value="grid" style={{color: 'black'}}>Mosaico (Repetir)</option>
              </select>
            </div>

            <h3 style={{ marginTop: '2rem', opacity: 0.8 }}>Modo de Juego</h3>
            <div className="input-group" style={{ marginTop: '0.5rem' }}>
              <label>Tipo de Juego</label>
              <select 
                value={settings.gameMode || 'classic'}
                onChange={e => setSettings({...settings, gameMode: e.target.value})}
                style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', color: 'inherit', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              >
                <option value="classic" style={{color: 'black'}}>Clásico (Pierdes al caer la pelota)</option>
                <option value="time_attack" style={{color: 'black'}}>Contrarreloj (Tiempo Límite)</option>
              </select>
            </div>

            {settings.gameMode === 'time_attack' && (
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label>Segundos de Límite (Contrarreloj)</label>
                <input 
                  type="number" 
                  value={settings.timeAttackSeconds || 60}
                  onChange={e => setSettings({...settings, timeAttackSeconds: parseInt(e.target.value)})}
                  min="10"
                  max="300"
                />
              </div>
            )}

            <h3 style={{ marginTop: '2rem', opacity: 0.8 }}>Reglas de Descuento</h3>
            <div className="input-group" style={{ marginTop: '0.5rem' }}>
              <label>Porcentaje ganado por bloque destruido (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={settings.discountPerBrick}
                onChange={e => setSettings({...settings, discountPerBrick: parseFloat(e.target.value)})}
                min="0"
                max="100"
              />
            </div>
            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label>Límite máximo de descuento permitido (%)</label>
              <input 
                type="number" 
                value={settings.maxDiscount}
                onChange={e => setSettings({...settings, maxDiscount: parseInt(e.target.value)})}
                min="0"
                max="100"
              />
            </div>

            <button type="submit" disabled={saving} className={`btn-primary ${saving ? 'pulse-anim' : ''}`} style={{ marginTop: '1rem', transition: 'all 0.3s' }}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </section>

        {/* Leads */}
        <section className="modal-content" style={{ animation: 'none', margin: 0, padding: '2rem', textAlign: 'left', maxWidth: 'none', width: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Leads Capturados ({leads.length})</h2>
            <button onClick={downloadCSV} className="btn-secondary" style={{ margin: 0 }}>
              Descargar CSV
            </button>
          </div>
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <th style={{ padding: '1rem 0' }}>Fecha</th>
                  <th style={{ padding: '1rem 0' }}>Nombre</th>
                  <th style={{ padding: '1rem 0' }}>Email</th>
                  <th style={{ padding: '1rem 0' }}>Celular</th>
                  <th style={{ padding: '1rem 0' }}>Nivel</th>
                  <th style={{ padding: '1rem 0' }}>Dcto</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0' }}>{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem 0' }}>{lead.name}</td>
                    <td style={{ padding: '1rem 0' }}>{lead.email}</td>
                    <td style={{ padding: '1rem 0' }}>{lead.phone}</td>
                    <td style={{ padding: '1rem 0' }}>{lead.stageReached}</td>
                    <td style={{ padding: '1rem 0' }}>{lead.discountWon}%</td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem 0', textAlign: 'center', opacity: 0.5 }}>
                      No hay datos capturados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
