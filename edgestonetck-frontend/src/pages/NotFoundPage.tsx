import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw, Shield, Zap, Crosshair } from 'lucide-react';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [activePowerup, setActivePowerup] = useState<string | null>(null);

    // Load Highscore
    useEffect(() => {
        const storedScore = localStorage.getItem('404_advanced_highscore');
        if (storedScore) setHighScore(parseInt(storedScore));
    }, []);

    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Audio Context (Simple synthesized sounds)
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContext();
        
        const playSound = (type: 'shoot' | 'explosion' | 'powerup' | 'hit' | 'boss_shoot') => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            
            if (type === 'shoot') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'explosion') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'powerup') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.1);
                osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'hit') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'boss_shoot') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            }
        };

        // Resize
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Game State Variables
        let player = {
            x: canvas.width / 2,
            y: canvas.height - 100,
            width: 40,
            height: 50,
            speed: 9,
            vx: 0,
            vy: 0,
            color: '#A688C4', // EdgeStone purple
            cooldown: 0,
            maxCooldown: 12,
            lives: 3,
            invulnerableTime: 0,
            powerup: null as 'spread' | 'rapid' | 'shield' | null,
            powerupTime: 0
        };

        let bullets: any[] = [];
        let enemyBullets: any[] = [];
        let enemies: any[] = [];
        let particles: any[] = [];
        let stars: any[] = [];
        let powerups: any[] = [];
        let floatingTexts: any[] = [];
        
        let screenShake = 0;
        let currentScore = 0;
        let combo = 0;
        let comboTimer = 0;
        let frameCount = 0;
        let animationId: number;
        let isRunning = true;
        let currentLevel = 1;

        // Init Stars
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2,
                speed: Math.random() * 1.5 + 0.2,
                color: Math.random() > 0.9 ? '#A688C4' : '#FFFFFF'
            });
        }

        let keys: { [key: string]: boolean } = {};
        const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Utility: Screen Shake
        const applyScreenShake = (ctx: CanvasRenderingContext2D) => {
            if (screenShake > 0) {
                const dx = (Math.random() - 0.5) * screenShake;
                const dy = (Math.random() - 0.5) * screenShake;
                ctx.translate(dx, dy);
                screenShake *= 0.9;
                if (screenShake < 0.5) screenShake = 0;
            }
        };

        const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
            floatingTexts.push({ x, y, text, color, life: 1, vy: -1 });
        };

        const createExplosion = (x: number, y: number, color: string, count: number = 20) => {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    life: 1,
                    color,
                    size: Math.random() * 5 + 2,
                    decay: Math.random() * 0.03 + 0.01
                });
            }
        };

        const spawnPowerup = (x: number, y: number) => {
            const types = ['spread', 'rapid', 'shield'];
            const type = types[Math.floor(Math.random() * types.length)];
            powerups.push({
                x, y, type,
                width: 24, height: 24,
                speed: 2,
                color: type === 'spread' ? '#3B82F6' : type === 'rapid' ? '#EF4444' : '#10B981',
                angle: 0
            });
        };

        const spawnEnemy = () => {
            const isBossLevel = currentLevel % 5 === 0;
            const bossExists = enemies.some(e => e.type === 'boss');

            if (isBossLevel && !bossExists && frameCount > 200) {
                // Spawn Boss
                enemies.push({
                    type: 'boss',
                    x: canvas.width / 2 - 80,
                    y: -100,
                    width: 160,
                    height: 100,
                    speed: 1,
                    hp: 50 + (currentLevel * 20),
                    maxHp: 50 + (currentLevel * 20),
                    color: '#9333EA',
                    vx: 2,
                    cooldown: 0
                });
                spawnFloatingText(canvas.width/2, canvas.height/2, "WARNING: BOSS INCOMING", "#EF4444");
                return;
            }

            if (bossExists) return; // Don't spawn normal enemies while boss is alive

            const rand = Math.random();
            let type = 'grunt';
            let hp = 1;
            let speed = Math.random() * 2 + 2 + (currentLevel * 0.2);
            let size = Math.random() * 20 + 25;
            let color = `hsl(${Math.random() * 40 + 340}, 80%, 60%)`; // Reddish

            if (currentLevel > 2 && rand > 0.7) {
                type = 'chaser'; // Follows player
                speed = 4 + (currentLevel * 0.3);
                size = 20;
                color = '#F59E0B'; // Orange
            } else if (currentLevel > 3 && rand > 0.9) {
                type = 'tank'; // High HP, slow, drops powerup
                hp = 5 + Math.floor(currentLevel / 2);
                speed = 1 + (currentLevel * 0.1);
                size = 50;
                color = '#10B981'; // Green
            }

            enemies.push({
                type, x: Math.random() * (canvas.width - size), y: -50,
                width: size, height: size, speed, hp, maxHp: hp, color,
                wobble: Math.random() * Math.PI * 2
            });
        };

        const gameLoop = () => {
            if (!isRunning) return;
            frameCount++;
            
            ctx.save();
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            applyScreenShake(ctx);

            // Draw Stars (Parallax)
            stars.forEach(star => {
                star.y += star.speed + (keys['ArrowUp'] || keys['w'] ? 1 : 0);
                if (star.y > canvas.height) {
                    star.y = 0;
                    star.x = Math.random() * canvas.width;
                }
                ctx.fillStyle = star.color;
                ctx.globalAlpha = star.size / 3;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            // Player Logic
            if (player.invulnerableTime > 0) player.invulnerableTime--;
            if (player.powerupTime > 0) {
                player.powerupTime--;
                if (player.powerupTime <= 0) {
                    player.powerup = null;
                    setActivePowerup(null);
                }
            }

            if (keys['ArrowLeft'] || keys['a']) player.vx = -player.speed;
            else if (keys['ArrowRight'] || keys['d']) player.vx = player.speed;
            else player.vx *= 0.8; // Friction

            if (keys['ArrowUp'] || keys['w']) player.vy = -player.speed;
            else if (keys['ArrowDown'] || keys['s']) player.vy = player.speed;
            else player.vy *= 0.8;

            player.x += player.vx;
            player.y += player.vy;

            if (player.x < 0) player.x = 0;
            if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
            if (player.y < 0) player.y = 0;
            if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

            // Shooting
            if (player.cooldown > 0) player.cooldown--;
            let fireRate = player.powerup === 'rapid' ? 4 : player.maxCooldown;
            
            if ((keys[' '] || keys['Shift']) && player.cooldown === 0) {
                playSound('shoot');
                if (player.powerup === 'spread') {
                    for(let i=-1; i<=1; i++) {
                        bullets.push({
                            x: player.x + player.width / 2 - 3, y: player.y,
                            vx: i * 3, vy: -15, width: 6, height: 18, color: '#3B82F6', damage: 1
                        });
                    }
                } else {
                    bullets.push({
                        x: player.x + player.width / 2 - 3, y: player.y,
                        vx: 0, vy: -16, width: 6, height: 20, color: player.powerup === 'rapid' ? '#EF4444' : '#F59E0B', damage: player.powerup === 'rapid' ? 0.8 : 1
                    });
                }
                player.cooldown = fireRate;
            }

            // Draw Player
            if (player.invulnerableTime === 0 || Math.floor(frameCount / 4) % 2 === 0) {
                ctx.save();
                ctx.translate(player.x + player.width/2, player.y + player.height/2);
                // Tilt based on movement
                ctx.rotate(player.vx * 0.02);
                
                // Shield aura
                if (player.powerup === 'shield') {
                    ctx.beginPath();
                    ctx.arc(0, 0, player.width, 0, Math.PI*2);
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
                    ctx.fill();
                    ctx.strokeStyle = '#10B981';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Ship Body
                ctx.fillStyle = player.color;
                ctx.beginPath();
                ctx.moveTo(0, -player.height/2); // Nose
                ctx.lineTo(player.width/2, player.height/2); // Right wing
                ctx.lineTo(0, player.height/3); // Inner tail
                ctx.lineTo(-player.width/2, player.height/2); // Left wing
                ctx.closePath();
                ctx.fill();
                
                // Ship Cockpit
                ctx.fillStyle = '#60A5FA';
                ctx.beginPath();
                ctx.ellipse(0, -player.height/6, 6, 12, 0, 0, Math.PI*2);
                ctx.fill();

                // Engine Thrust
                if (player.vy < 0 || keys['ArrowUp'] || keys['w']) {
                    ctx.fillStyle = '#EF4444';
                    ctx.beginPath();
                    ctx.moveTo(-8, player.height/3);
                    ctx.lineTo(8, player.height/3);
                    ctx.lineTo(0, player.height/3 + Math.random() * 25 + 10);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }

            // Combo logic
            if (comboTimer > 0) {
                comboTimer--;
                if (comboTimer <= 0) combo = 0;
            }

            // Move & Draw Bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
                let b = bullets[i];
                b.x += b.vx;
                b.y += b.vy;
                ctx.fillStyle = b.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = b.color;
                ctx.fillRect(b.x, b.y, b.width, b.height);
                ctx.shadowBlur = 0;
                if (b.y < -50 || b.x < -50 || b.x > canvas.width + 50) bullets.splice(i, 1);
            }

            // Enemy Bullets
            for (let i = enemyBullets.length - 1; i >= 0; i--) {
                let eb = enemyBullets[i];
                eb.x += eb.vx;
                eb.y += eb.vy;
                ctx.fillStyle = eb.color;
                ctx.beginPath();
                ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI*2);
                ctx.fill();
                
                if (eb.y > canvas.height + 50) enemyBullets.splice(i, 1);
                else if (player.invulnerableTime <= 0) {
                    // Collision with player
                    const dx = eb.x - (player.x + player.width/2);
                    const dy = eb.y - (player.y + player.height/2);
                    if (Math.sqrt(dx*dx + dy*dy) < player.width/2) {
                        enemyBullets.splice(i, 1);
                        playerHit();
                    }
                }
            }

            // Spawning Logic
            let spawnRate = Math.max(15, 50 - currentLevel * 3);
            if (frameCount % spawnRate === 0) spawnEnemy();

            // Move & Draw Enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                let e = enemies[i];
                
                if (e.type === 'chaser') {
                    if (e.x + e.width/2 < player.x + player.width/2) e.x += e.speed * 0.5;
                    else e.x -= e.speed * 0.5;
                    e.y += e.speed;
                } else if (e.type === 'boss') {
                    e.x += e.vx;
                    if (e.x < 0 || e.x + e.width > canvas.width) e.vx *= -1;
                    if (e.y < 50) e.y += e.speed; // Slide in
                    
                    // Boss shooting
                    e.cooldown--;
                    if (e.cooldown <= 0) {
                        playSound('boss_shoot');
                        for(let k=-2; k<=2; k++) {
                            enemyBullets.push({
                                x: e.x + e.width/2, y: e.y + e.height,
                                vx: k * 2, vy: 6, radius: 8, color: '#EF4444'
                            });
                        }
                        e.cooldown = 60 - Math.min(30, currentLevel);
                    }
                } else {
                    e.y += e.speed;
                    e.wobble += 0.1;
                    e.x += Math.sin(e.wobble) * 2;
                }

                // Draw Enemy
                ctx.save();
                ctx.translate(e.x + e.width/2, e.y + e.height/2);
                if (e.type === 'tank') {
                    ctx.fillStyle = e.color;
                    ctx.fillRect(-e.width/2, -e.height/2, e.width, e.height);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(-e.width/2 + 5, -e.height/2 + 5, e.width - 10, e.height - 10);
                } else if (e.type === 'boss') {
                    ctx.fillStyle = e.color;
                    ctx.beginPath();
                    ctx.moveTo(0, e.height/2);
                    ctx.lineTo(e.width/2, -e.height/2);
                    ctx.lineTo(-e.width/2, -e.height/2);
                    ctx.closePath();
                    ctx.fill();
                    // Boss HP bar
                    ctx.fillStyle = '#4B5563';
                    ctx.fillRect(-e.width/2, -e.height/2 - 15, e.width, 8);
                    ctx.fillStyle = '#EF4444';
                    ctx.fillRect(-e.width/2, -e.height/2 - 15, e.width * (e.hp / e.maxHp), 8);
                } else {
                    ctx.fillStyle = e.color;
                    ctx.beginPath();
                    ctx.arc(0, 0, e.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    // Eyes
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(-e.width/6, -e.height/6, e.width/6, 0, Math.PI*2);
                    ctx.arc(e.width/6, -e.height/6, e.width/6, 0, Math.PI*2);
                    ctx.fill();
                }
                ctx.restore();

                if (e.y > canvas.height + 100) {
                    enemies.splice(i, 1);
                    continue;
                }

                // Player Collision
                if (player.invulnerableTime <= 0) {
                    if (player.x < e.x + e.width && player.x + player.width > e.x &&
                        player.y < e.y + e.height && player.y + player.height > e.y) {
                        if (e.type !== 'boss') enemies.splice(i, 1);
                        playerHit();
                        continue;
                    }
                }

                // Bullet Collision
                let enemyDestroyed = false;
                for (let j = bullets.length - 1; j >= 0; j--) {
                    let b = bullets[j];
                    if (b.x < e.x + e.width && b.x + b.width > e.x &&
                        b.y < e.y + e.height && b.y + b.height > e.y) {
                        
                        bullets.splice(j, 1);
                        e.hp -= b.damage;
                        createExplosion(b.x, b.y, '#FFFFFF', 5);
                        
                        if (e.hp <= 0) {
                            playSound('explosion');
                            createExplosion(e.x + e.width/2, e.y + e.height/2, e.color, e.type === 'boss' ? 100 : 20);
                            
                            combo++;
                            comboTimer = 120;
                            const points = (e.type === 'boss' ? 1000 : e.type === 'tank' ? 200 : e.type === 'chaser' ? 100 : 50) * Math.max(1, combo);
                            currentScore += points;
                            
                            spawnFloatingText(e.x, e.y, `+${points}`, combo > 1 ? '#F59E0B' : '#FFFFFF');
                            
                            if (e.type === 'boss' || e.type === 'tank' || Math.random() > 0.9) {
                                spawnPowerup(e.x + e.width/2, e.y + e.height/2);
                            }

                            if (e.type === 'boss') screenShake = 20;
                            else screenShake = 3;

                            enemies.splice(i, 1);
                            enemyDestroyed = true;
                            
                            // Check level up
                            const newLevel = Math.floor(currentScore / 2000) + 1;
                            if (newLevel > currentLevel) {
                                currentLevel = newLevel;
                                spawnFloatingText(canvas.width/2, canvas.height/2, `LEVEL ${currentLevel}!`, '#10B981');
                            }
                        }
                        break;
                    }
                }
                if (enemyDestroyed) continue;
            }

            // Powerups
            for (let i = powerups.length - 1; i >= 0; i--) {
                let p = powerups[i];
                p.y += p.speed;
                p.angle += 0.05;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-p.width/4, -p.height/4, p.width/2, p.height/2);
                ctx.restore();

                if (p.y > canvas.height + 50) {
                    powerups.splice(i, 1);
                    continue;
                }

                // Collect
                if (Math.abs(p.x - (player.x + player.width/2)) < p.width/2 + player.width/2 &&
                    Math.abs(p.y - (player.y + player.height/2)) < p.height/2 + player.height/2) {
                    
                    playSound('powerup');
                    player.powerup = p.type;
                    player.powerupTime = 600; // 10 seconds
                    setActivePowerup(p.type);
                    spawnFloatingText(p.x, p.y, p.type.toUpperCase() + '!', p.color);
                    powerups.splice(i, 1);
                }
            }

            // Particles
            for (let i = particles.length - 1; i >= 0; i--) {
                let p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                if (p.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Floating Texts
            for (let i = floatingTexts.length - 1; i >= 0; i--) {
                let t = floatingTexts[i];
                t.y += t.vy;
                t.life -= 0.02;
                if (t.life <= 0) {
                    floatingTexts.splice(i, 1);
                    continue;
                }
                ctx.globalAlpha = t.life;
                ctx.fillStyle = t.color;
                ctx.font = 'bold 16px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(t.text, t.x, t.y);
            }
            ctx.globalAlpha = 1;
            
            ctx.restore();

            // UI Overlays updates
            setScore(currentScore);
            setLevel(currentLevel);
            setLives(player.lives);

            if (isRunning) {
                animationId = requestAnimationFrame(gameLoop);
            }
        };

        const playerHit = () => {
            if (player.powerup === 'shield') {
                playSound('hit');
                player.powerup = null;
                setActivePowerup(null);
                player.invulnerableTime = 60;
                createExplosion(player.x + player.width/2, player.y + player.height/2, '#10B981', 30);
                return;
            }
            
            playSound('explosion');
            screenShake = 15;
            createExplosion(player.x + player.width/2, player.y + player.height/2, player.color, 40);
            player.lives--;
            setLives(player.lives);
            player.powerup = null;
            setActivePowerup(null);
            
            if (player.lives <= 0) {
                isRunning = false;
                setTimeout(() => {
                    setGameState('gameover');
                    if (currentScore > highScore) {
                        setHighScore(currentScore);
                        localStorage.setItem('404_advanced_highscore', currentScore.toString());
                    }
                }, 1000);
            } else {
                player.invulnerableTime = 120; // 2 seconds i-frames
                player.x = canvas.width / 2;
                player.y = canvas.height - 100;
            }
        };

        animationId = requestAnimationFrame(gameLoop);

        return () => {
            isRunning = false;
            cancelAnimationFrame(animationId);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('resize', resize);
        };
    }, [gameState, highScore]);

    return (
        <div className="w-screen h-screen overflow-hidden bg-[#0F172A] relative flex items-center justify-center font-sans selection:bg-transparent">
            {gameState === 'playing' && (
                <>
                    <canvas ref={canvasRef} className="absolute inset-0 z-10 cursor-crosshair" />
                    
                    {/* HUD - Top Left */}
                    <div className="absolute top-6 left-6 z-20 select-none pointer-events-none flex flex-col gap-1">
                        <div className="text-white font-black text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] tracking-tight">
                            {score.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-orange-400 font-bold text-[13px] tracking-widest bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20">
                                SECTOR {level}
                            </div>
                            {activePowerup && (
                                <div className={`flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-widest px-2 py-0.5 rounded border ${
                                    activePowerup === 'spread' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 
                                    activePowerup === 'rapid' ? 'text-red-400 bg-red-400/10 border-red-400/20' : 
                                    'text-green-400 bg-green-400/10 border-green-400/20'
                                }`}>
                                    {activePowerup === 'spread' ? <Crosshair size={12}/> : activePowerup === 'rapid' ? <Zap size={12}/> : <Shield size={12}/>}
                                    {activePowerup}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* HUD - Bottom Left (Lives) */}
                    <div className="absolute bottom-6 left-6 z-20 flex gap-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                i < lives ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_10px_rgba(166,136,196,0.5)]' : 'bg-transparent border-gray-600 opacity-30'
                            }`}>
                                <div className={`w-4 h-4 rounded-sm transition-all duration-300 ${
                                    i < lives ? 'bg-purple-400' : 'bg-gray-600'
                                }`} style={{ transform: 'rotate(45deg)' }} />
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => navigate('/')}
                        className="absolute top-6 right-6 z-20 bg-white/5 hover:bg-white/10 border border-white/10 text-white backdrop-blur-md px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-[13px] transition-all active:scale-95"
                    >
                        <Home size={16} />
                        Abort Mission
                    </button>
                    
                    <div className="absolute bottom-6 right-6 z-20 text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase pointer-events-none select-none text-right">
                        WASD / Arrows to Move<br/>Space / Shift to Fire
                    </div>
                </>
            )}

            {gameState === 'start' && (
                <div className="z-20 flex flex-col items-center animate-in zoom-in duration-500 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
                    
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-px bg-gradient-to-r from-transparent to-orange-500" />
                        <span className="text-orange-400 font-bold tracking-[0.3em] text-[11px] uppercase">EdgeStone Defense Protocol</span>
                        <div className="w-12 h-px bg-gradient-to-l from-transparent to-orange-500" />
                    </div>
                    
                    <h1 className="text-[140px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 leading-none drop-shadow-2xl tracking-tighter relative">
                        404
                        <span className="absolute inset-0 bg-clip-text text-transparent bg-gradient-to-tr from-orange-500/40 to-purple-500/40 mix-blend-overlay">404</span>
                    </h1>
                    <h2 className="text-[28px] font-black text-white mb-4 tracking-tight drop-shadow-md">SECTOR NOT FOUND</h2>
                    <p className="text-gray-400 text-[15px] mb-12 max-w-[480px] text-center leading-relaxed">
                        Critical routing failure. The requested destination has been overrun by corrupted digital entities. You are authorized to deploy lethal countermeasures.
                    </p>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setGameState('playing')}
                            className="px-10 py-4 bg-white text-gray-900 rounded-2xl font-black text-[15px] transition-all hover:scale-105 hover:bg-orange-50 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(249,115,22,0.4)] flex items-center gap-2 group"
                        >
                            <Crosshair size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                            DEPLOY FIGHTER
                        </button>
                        <button 
                            onClick={() => navigate('/')}
                            className="px-8 py-4 bg-gray-800/50 hover:bg-gray-800 text-white rounded-2xl font-bold text-[15px] transition-colors border border-gray-700 flex items-center gap-2"
                        >
                            <Home size={18} />
                            Return to Dashboard
                        </button>
                    </div>

                    {highScore > 0 && (
                        <div className="mt-16 flex flex-col items-center gap-2">
                            <span className="text-gray-500 font-bold text-[10px] tracking-[0.2em] uppercase">Highest Clearance Level</span>
                            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400 drop-shadow-md">
                                {highScore.toLocaleString()} PTS
                            </div>
                        </div>
                    )}
                </div>
            )}

            {gameState === 'gameover' && (
                <div className="z-20 flex flex-col items-center bg-[#0F172A]/90 backdrop-blur-xl p-14 rounded-[40px] border border-gray-800 animate-in fade-in zoom-in duration-300 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-orange-500" />
                    
                    <h2 className="text-[40px] font-black text-white mb-2 tracking-tight">SIGNAL LOST</h2>
                    <p className="text-gray-400 font-medium mb-10">Your fighter was destroyed in Sector {level}.</p>
                    
                    <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 mb-10 w-full text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 relative z-10">Final Score</div>
                        <div className="text-[56px] font-black text-white leading-none tracking-tighter relative z-10">
                            {score.toLocaleString()}
                        </div>
                        {score >= highScore && score > 0 && (
                            <div className="mt-4 text-[11px] font-black text-green-900 bg-green-400 px-3 py-1.5 rounded-full inline-block tracking-widest shadow-[0_0_20px_rgba(74,222,128,0.4)] relative z-10">
                                NEW RECORD
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <button 
                            onClick={() => {
                                setScore(0);
                                setLevel(1);
                                setLives(3);
                                setActivePowerup(null);
                                setGameState('playing');
                            }}
                            className="w-full py-4.5 bg-white hover:bg-gray-100 text-gray-900 rounded-2xl font-black text-[15px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} />
                            REDEPLOY
                        </button>
                        <button 
                            onClick={() => navigate('/')}
                            className="w-full py-4.5 bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white rounded-2xl font-bold text-[15px] transition-colors"
                        >
                            Retreat to Dashboard
                        </button>
                    </div>
                </div>
            )}
            
            {/* Ambient Background Grid */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 pointer-events-none z-0 opacity-20" style={{
                    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-[#0F172A]" />
                </div>
            )}
        </div>
    );
}
