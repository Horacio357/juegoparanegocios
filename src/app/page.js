'use client';
import { useEffect, useState } from 'react';
import GameCanvas from '@/components/GameCanvas';
import LeadForm from '@/components/LeadForm';
import RegistrationForm from '@/components/RegistrationForm';
import MainMenu from '@/components/MainMenu';
import Leaderboard from '@/components/Leaderboard';

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [earnedDiscount, setEarnedDiscount] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('MENU'); // MENU, REGISTER, GAME, RANKING
  const [selectedMode, setSelectedMode] = useState('classic');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data);
        // Apply color theme class to body
        document.body.className = `theme-${data.colorTheme || 1}`;
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleReward = (discount) => {
    setEarnedDiscount(discount);
  };

  const handleFormClose = () => {
    setEarnedDiscount(null);
    setPlayerData(null); // Reset to allow another person to play
    setCurrentScreen('MENU');
  };

  const handleSelectMode = (mode) => {
    if (mode === 'ranking') {
      setCurrentScreen('RANKING');
    } else {
      setSelectedMode(mode);
      setCurrentScreen('REGISTER');
    }
  };

  const handleRegister = (data) => {
    setPlayerData(data);
    setCurrentScreen('GAME');
  };

  if (loading) {
    return <div className="loading-screen">Cargando juego...</div>;
  }

  return (
    <main className="main-container">
      <header className="header">
        <h1>Arkanoid Premium</h1>
        <p>Juega, gana niveles y obtén descuentos exclusivos</p>
      </header>

      <section className="game-section">
        {currentScreen === 'MENU' && (
          <MainMenu onSelectMode={handleSelectMode} />
        )}
        
        {currentScreen === 'RANKING' && (
          <Leaderboard onBack={() => setCurrentScreen('MENU')} />
        )}

        {currentScreen === 'REGISTER' && (
          <RegistrationForm onRegister={handleRegister} />
        )}

        {currentScreen === 'GAME' && (
          <GameCanvas onReward={handleReward} settings={settings} gameMode={selectedMode} />
        )}
      </section>

      {earnedDiscount !== null && playerData && (
        <LeadForm 
          discount={earnedDiscount} 
          playerData={playerData}
          onSubmitSuccess={handleFormClose}
        />
      )}
    </main>
  );
}
