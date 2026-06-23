'use client';
import { useEffect, useRef, useState } from 'react';


export default function GameCanvas({ onReward, settings, gameMode }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, WON_STAGE, GAME_OVER
  const [currentStage, setCurrentStage] = useState(1);
  const [score, setScore] = useState(0);
  const audioCtxRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (freq, type, duration, vol) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playExplosion = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  };

  // Use refs for game loop values to avoid dependency hell
  const gameRef = useRef({
    ball: { x: 400, y: 500, dx: 4, dy: -4, radius: 8 },
    paddle: { x: 350, y: 580, width: 100, height: 10, speed: 8, dx: 0 },
    bricks: [],
    particles: [], // For bubble explosion
    animationId: null,
    bgImages: {},
    rightPressed: false,
    leftPressed: false,
    score: 0,
    stage: 1,
    accumulatedDiscount: 0,
    state: 'START',
    timeLeft: 0,
    lastTime: 0
  });

  const initBricks = (stage) => {
    const rows = Math.min(3 + Math.floor(stage / 2), 8);
    const cols = 8;
    const padding = 10;
    const offsetTop = 50;
    const offsetLeft = 35;
    const width = 80;
    const height = 20;
    const colors = ['#ff0055', '#00ffcc', '#bf00ff', '#feca57', '#1dd1a1', '#ff9f43'];
    
    const bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: (c * (width + padding)) + offsetLeft,
          y: (r * (height + padding)) + offsetTop,
          width,
          height,
          status: 1, // 1: active, 0: broken
          color: colors[(r * cols + c) % colors.length]
        });
      }
    }
    return bricks;
  };

  const createExplosion = (x, y) => {
    const particles = [];
    for(let i=0; i<30; i++) {
      particles.push({
        x, y,
        dx: (Math.random() - 0.5) * 10,
        dy: (Math.random() - 0.5) * 10,
        radius: Math.random() * 5 + 2,
        alpha: 1,
        color: '#bf00ff'
      });
    }
    gameRef.current.particles = particles;
  };

  const createBrickExplosion = (x, y, color) => {
    const particles = gameRef.current.particles;
    for(let i=0; i<10; i++) {
      particles.push({
        x, y,
        dx: (Math.random() - 0.5) * 8,
        dy: (Math.random() - 0.5) * 8,
        radius: Math.random() * 3 + 1,
        alpha: 1,
        color
      });
    }
  };

  const draw = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const g = gameRef.current;

    let currentBgImg = null;
    if (g.stage >= 3 && g.bgImages[3]) currentBgImg = g.bgImages[3];
    else if (g.stage >= 2 && g.bgImages[2]) currentBgImg = g.bgImages[2];
    else if (g.bgImages[1]) currentBgImg = g.bgImages[1];

    if (currentBgImg) {
      ctx.globalAlpha = 0.15; // Lighter transparency for the logo
      const imgW = currentBgImg.width;
      const imgH = currentBgImg.height;
      const canvasW = ctx.canvas.width;
      const canvasH = ctx.canvas.height;
      const pos = settings?.bgImagePosition || 'center';

      if (pos === 'cover') {
        const ratio = Math.max(canvasW / imgW, canvasH / imgH);
        const newW = imgW * ratio;
        const newH = imgH * ratio;
        ctx.drawImage(currentBgImg, (canvasW - newW) / 2, (canvasH - newH) / 2, newW, newH);
      } else if (pos === 'grid') {
        const ratio = 0.3; // Grid size
        const newW = imgW * ratio;
        const newH = imgH * ratio;
        for (let x = 0; x < canvasW; x += newW) {
          for (let y = 0; y < canvasH; y += newH) {
            ctx.drawImage(currentBgImg, x, y, newW, newH);
          }
        }
      } else if (pos === 'topleft') {
        const ratio = Math.min(canvasW / imgW, canvasH / imgH) * 0.25;
        const newW = imgW * ratio;
        const newH = imgH * ratio;
        ctx.drawImage(currentBgImg, 20, 20, newW, newH);
      } else if (pos === 'topright') {
        const ratio = Math.min(canvasW / imgW, canvasH / imgH) * 0.25;
        const newW = imgW * ratio;
        const newH = imgH * ratio;
        ctx.drawImage(currentBgImg, canvasW - newW - 20, 20, newW, newH);
      } else {
        // center
        const ratio = Math.min(canvasW / imgW, canvasH / imgH) * 0.5; // Max 50% of canvas size
        const newW = imgW * ratio;
        const newH = imgH * ratio;
        ctx.drawImage(currentBgImg, (canvasW - newW) / 2, (canvasH - newH) / 2, newW, newH);
      }
      ctx.globalAlpha = 1.0;
    }

    if (g.state === 'START') {
      ctx.fillStyle = 'var(--text-color)';
      ctx.font = '30px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Nivel ${g.stage}`, ctx.canvas.width/2, ctx.canvas.height/2 - 20);
      ctx.font = '20px "Outfit", sans-serif';
      ctx.fillText('Haz clic para jugar', ctx.canvas.width/2, ctx.canvas.height/2 + 20);
      
      if (gameMode === 'time_attack') {
        ctx.fillStyle = '#ff9f43';
        ctx.fillText(`Modo Contrarreloj: ${settings?.timeAttackSeconds || 60}s`, ctx.canvas.width/2, ctx.canvas.height/2 + 60);
      }
      return;
    }

    if (g.state === 'GAME_OVER') {
      ctx.fillStyle = 'red';
      ctx.font = '40px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', ctx.canvas.width/2, ctx.canvas.height/2);
      ctx.fillStyle = 'var(--text-color)';
      ctx.font = '20px "Outfit", sans-serif';
      ctx.fillText('Haz clic para reiniciar', ctx.canvas.width/2, ctx.canvas.height/2 + 40);
      return;
    }

    // Draw Bricks
    g.bricks.forEach(b => {
      if (b.status === 1) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.strokeRect(b.x, b.y, b.width, b.height);
      }
    });

    // Draw Paddle
    ctx.fillStyle = '#ff0055'; // Vibrant pink paddle
    ctx.beginPath();
    ctx.roundRect(g.paddle.x, g.paddle.y, g.paddle.width, g.paddle.height, 5);
    ctx.fill();

    // Draw Ball
    if (g.state !== 'WON_STAGE') {
      ctx.beginPath();
      ctx.arc(g.ball.x, g.ball.y, g.ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffcc'; // Vibrant cyan ball
      ctx.fill();
      ctx.closePath();
    }

    // Draw Particles
    g.particles.forEach((p, index) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
      
      p.x += p.dx;
      p.y += p.dy;
      p.alpha -= 0.02;
      if(p.alpha <= 0) g.particles.splice(index, 1);
    });

    // Draw Info
    ctx.fillStyle = '#ffffff'; // White text
    ctx.font = '16px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Puntos: ${g.score}`, 10, 20);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffcc'; // Cyan text for discount
    ctx.fillText(`Descuento: ${g.accumulatedDiscount.toFixed(1)}%`, ctx.canvas.width/2, 20);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`Nivel: ${g.stage}`, ctx.canvas.width - 10, 20);

    // Draw Timer if Time Attack
    if (gameMode === 'time_attack') {
      ctx.font = '24px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = g.timeLeft <= 10 ? '#ff0055' : '#feca57';
      ctx.fillText(`⏳ ${Math.ceil(g.timeLeft)}s`, ctx.canvas.width/2, 50);
    }
  };

  const update = (ctx) => {
    const g = gameRef.current;
    if (g.state !== 'PLAYING') return;

    // Time Attack Logic
    if (gameMode === 'time_attack') {
      const now = performance.now();
      const dt = (now - g.lastTime) / 1000;
      g.lastTime = now;
      g.timeLeft -= dt;
      if (g.timeLeft <= 0) {
        g.timeLeft = 0;
        g.state = 'GAME_OVER';
        setGameState('GAME_OVER');
        if (g.accumulatedDiscount > 0) {
          setTimeout(() => {
            onReward(g.accumulatedDiscount);
          }, 1000);
        }
        return;
      }
    }

    // Move Paddle
    if (g.rightPressed) {
      g.paddle.x = Math.min(ctx.canvas.width - g.paddle.width, g.paddle.x + g.paddle.speed);
    } else if (g.leftPressed) {
      g.paddle.x = Math.max(0, g.paddle.x - g.paddle.speed);
    }

    // Move Ball
    g.ball.x += g.ball.dx;
    g.ball.y += g.ball.dy;

    // Wall Collision
    if (g.ball.x + g.ball.dx > ctx.canvas.width - g.ball.radius || g.ball.x + g.ball.dx < g.ball.radius) {
      g.ball.dx = -g.ball.dx;
      playSound(300, 'sine', 0.1, 0.1);
    }
    if (g.ball.y + g.ball.dy < g.ball.radius) {
      g.ball.dy = -g.ball.dy;
      playSound(300, 'sine', 0.1, 0.1);
    } else if (g.ball.y + g.ball.dy > ctx.canvas.height - g.ball.radius) {
      // Game Over
      g.state = 'GAME_OVER';
      setGameState('GAME_OVER');
      if (g.accumulatedDiscount > 0) {
        setTimeout(() => {
          onReward(g.accumulatedDiscount);
        }, 1000);
      }
    }

    // Paddle Collision
    if (g.ball.y + g.ball.dy > g.paddle.y - g.ball.radius &&
        g.ball.x > g.paddle.x && g.ball.x < g.paddle.x + g.paddle.width) {
      // Calculate angle based on where it hit paddle
      let hitPoint = g.ball.x - (g.paddle.x + g.paddle.width/2);
      g.ball.dx = hitPoint * 0.15;
      g.ball.dy = -g.ball.dy;
      playSound(500, 'sine', 0.1, 0.2);
    }

    // Brick Collision
    let activeBricks = 0;
    for (let b of g.bricks) {
      if (b.status === 1) {
        activeBricks++;
        if (g.ball.x > b.x && g.ball.x < b.x + b.width && g.ball.y > b.y && g.ball.y < b.y + b.height) {
          g.ball.dy = -g.ball.dy;
          b.status = 0;
          g.score += 10;
          g.accumulatedDiscount = Math.min((settings?.maxDiscount ?? 50), g.accumulatedDiscount + (settings?.discountPerBrick ?? 0.5));
          setScore(g.score);
          createBrickExplosion(b.x + b.width/2, b.y + b.height/2, b.color);
          playExplosion();
        }
      }
    }

    // Win Stage
    if (activeBricks === 0) {
      g.state = 'WON_STAGE';
      setGameState('WON_STAGE');
      
      setTimeout(() => {
        nextStage();
      }, 1000);
    }
  };

  const nextStage = () => {
    const g = gameRef.current;
    g.stage += 1;
    setCurrentStage(g.stage);
    resetPositions();
    g.bricks = initBricks(g.stage);
    g.state = 'START';
    setGameState('START');
    // Increase speed
    g.ball.dy = g.ball.dy < 0 ? -(4 + g.stage*0.5) : (4 + g.stage*0.5);
    
    // In Time Attack, maybe don't reset time? We keep the accumulated time
    // But we need to reset lastTime so dt doesn't jump
    g.lastTime = performance.now();
  };

  const resetGame = () => {
    const g = gameRef.current;
    g.stage = 1;
    g.score = 0;
    g.accumulatedDiscount = 0;
    setCurrentStage(1);
    setScore(0);
    resetPositions();
    g.bricks = initBricks(1);
    g.state = 'START';
    setGameState('START');
    g.timeLeft = settings?.timeAttackSeconds || 60;
    g.lastTime = performance.now();
  };

  const resetPositions = () => {
    const g = gameRef.current;
    g.ball.x = 400;
    g.ball.y = 500;
    const baseSpeed = 4 + g.stage*0.5;
    g.ball.dx = baseSpeed;
    g.ball.dy = -baseSpeed;
    g.paddle.x = 350;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const g = gameRef.current;

    g.bricks = initBricks(1);

    const loop = () => {
      update(ctx);
      draw(ctx);
      g.animationId = requestAnimationFrame(loop);
    };

    loop();

    const handleKeyDown = (e) => {
      if (e.key === 'Right' || e.key === 'ArrowRight') {
        if (g.state === 'PLAYING') e.preventDefault();
        g.rightPressed = true;
      }
      else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        if (g.state === 'PLAYING') e.preventDefault();
        g.leftPressed = true;
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Right' || e.key === 'ArrowRight') g.rightPressed = false;
      else if (e.key === 'Left' || e.key === 'ArrowLeft') g.leftPressed = false;
    };

    const handleClick = () => {
      initAudio();
      if (g.state === 'START') {
        g.state = 'PLAYING';
        setGameState('PLAYING');
        g.lastTime = performance.now();
        if (g.stage === 1) {
          g.timeLeft = settings?.timeAttackSeconds || 60;
        }
      } else if (g.state === 'GAME_OVER') {
        resetGame();
      }
    };

    const handleMouseMove = (e) => {
      if (g.state !== 'PLAYING') return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const relativeX = (e.clientX - rect.left) * scaleX;
      
      let newX = relativeX - g.paddle.width / 2;
      g.paddle.x = Math.max(0, Math.min(canvas.width - g.paddle.width, newX));
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(g.animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  // No longer needed to sync won_stage exactly since reward is on game over,
  // but keeping for effect if wanted.
  useEffect(() => {
    if (gameState === 'WON_STAGE' && !gameRef.current.particles.length) {
       // Just keeping state in sync
    }
  }, [gameState]);

  useEffect(() => {
    gameRef.current.bgImages = {};
    if (settings?.bgImagePath) {
      const img1 = new Image();
      img1.src = settings.bgImagePath;
      img1.onload = () => gameRef.current.bgImages[1] = img1;
    }
    if (settings?.bgImagePathStage2) {
      const img2 = new Image();
      img2.src = settings.bgImagePathStage2;
      img2.onload = () => gameRef.current.bgImages[2] = img2;
    }
    if (settings?.bgImagePathStage3) {
      const img3 = new Image();
      img3.src = settings.bgImagePathStage3;
      img3.onload = () => gameRef.current.bgImages[3] = img3;
    }
  }, [settings?.bgImagePath, settings?.bgImagePathStage2, settings?.bgImagePathStage3]);

  // Method to resume after reward (Game Over context)
  const resumeFromReward = () => {
    resetGame();
  };

  // We attach resume to window just as a hacky way for parent to trigger it, 
  // or better, we pass a key to completely re-render or we expose it.
  // We'll handle it properly by taking a prop.
  return (
    <div className="game-container">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="game-canvas"
      />
    </div>
  );
}
