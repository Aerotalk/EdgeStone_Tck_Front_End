import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Crosshair, Skull } from 'lucide-react';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [gameState, setGameState] = useState<'menu' | 'mission_intro' | 'playing' | 'gameover' | 'victory'>('menu');
    const [missionIndex, setMissionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);

    const missions = [
        { 
            title: "MISSION 1: PERIMETER BREACH", 
            desc: "Infiltrate the outer defenses.",
            length: 3000, 
            bg: '#0F172A', 
            accent: '#38BDF8'
        },
        { 
            title: "MISSION 2: DATA VAULT", 
            desc: "Navigate the fragmented server clusters.",
            length: 4000, 
            bg: '#170F2A', 
            accent: '#A855F7'
        },
        { 
            title: "FINAL MISSION: ROOT CORE", 
            desc: "Destroy the mainframe.",
            length: 1500, 
            bg: '#2A0F17', 
            accent: '#EF4444',
            hasBoss: true
        }
    ];

    useEffect(() => {
        if (gameState === 'mission_intro') {
            const timer = setTimeout(() => {
                setGameState('playing');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [gameState]);

    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContext();
        
        const playSound = (type: 'shoot' | 'explosion' | 'jump' | 'hit' | 'boss_shoot') => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            const now = audioCtx.currentTime;
            
            if (type === 'shoot') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            } else if (type === 'explosion') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
            } else if (type === 'jump') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now); osc.stop(now + 0.2);
            } else if (type === 'hit') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now); osc.stop(now + 0.2);
            } else if (type === 'boss_shoot') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now); osc.stop(now + 0.4);
            }
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        let isRunning = true;
        let animationId: number;
        let frameCount = 0;
        let cameraX = 0;
        let currentScore = score;
        let bossSpawned = false;

        const keys: { [key: string]: boolean } = {};
        const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const currentMission = missions[missionIndex];
        const gY = canvas.height - 100;
        
        // Generate platforms based on mission
        const platforms: any[] = [];
        if (missionIndex === 0) {
            platforms.push({ x: -200, y: gY, w: 1000, h: 500 });
            platforms.push({ x: 1000, y: gY, w: 800, h: 500 });
            platforms.push({ x: 2000, y: gY, w: 1500, h: 500 });
            platforms.push({ x: 600, y: gY - 120, w: 200, h: 30 });
            platforms.push({ x: 1400, y: gY - 150, w: 200, h: 30 });
            platforms.push({ x: 2400, y: gY - 120, w: 300, h: 30 });
        } else if (missionIndex === 1) {
            platforms.push({ x: -200, y: gY, w: 800, h: 500 });
            platforms.push({ x: 800, y: gY - 100, w: 400, h: 30 });
            platforms.push({ x: 1400, y: gY - 200, w: 400, h: 30 });
            platforms.push({ x: 2000, y: gY, w: 800, h: 500 });
            platforms.push({ x: 3000, y: gY, w: 1500, h: 500 });
            platforms.push({ x: 2400, y: gY - 150, w: 200, h: 30 });
        } else {
            platforms.push({ x: -200, y: gY, w: 3000, h: 500 });
            platforms.push({ x: 600, y: gY - 150, w: 200, h: 30 });
            platforms.push({ x: 1000, y: gY - 250, w: 200, h: 30 });
        }

        let player = {
            x: 100, y: gY - 100, w: 30, h: 50,
            vx: 0, vy: 0, speed: 6, jumpPower: -14,
            facing: 1, isGrounded: false, hp: lives,
            color: '#fff', cooldown: 0, invulnerableTime: 0
        };

        let bullets: any[] = [];
        let enemies: any[] = [];
        let particles: any[] = [];
        let floatingTexts: any[] = [];

        // Pre-spawn some enemies
        for (let i = 800; i < currentMission.length; i += 600) {
            if (Math.random() > 0.3) {
                enemies.push({
                    type: 'soldier', x: i, y: gY - 100, w: 30, h: 50, 
                    hp: 1, vx: 0, vy: 0, color: '#EF4444', facing: -1
                });
            } else {
                enemies.push({
                    type: 'turret', x: i, y: gY - 200, w: 40, h: 30, 
                    hp: 3, timer: 0, color: '#F59E0B', facing: -1
                });
            }
        }

        const createExplosion = (x: number, y: number, color: string, count: number = 20) => {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
                    life: 1, color, size: Math.random() * 5 + 2,
                    decay: Math.random() * 0.03 + 0.01
                });
            }
        };

        const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
            floatingTexts.push({ x, y, text, color, life: 1, vy: -1 });
        };

        const playerHit = () => {
            if (player.invulnerableTime > 0) return;
            playSound('hit');
            createExplosion(player.x + player.w/2, player.y + player.h/2, player.color, 30);
            player.hp--;
            setLives(player.hp);
            if (player.hp <= 0) {
                isRunning = false;
                setTimeout(() => setGameState('gameover'), 1000);
            } else {
                player.invulnerableTime = 120;
            }
        };

        const applyPhysics = (entity: any) => {
            entity.vy += 0.6; // Gravity
            entity.y += entity.vy;
            entity.isGrounded = false;
            
            for (let p of platforms) {
                if (entity.x + entity.w > p.x && entity.x < p.x + p.w) {
                    if (entity.vy >= 0 && entity.y + entity.h - entity.vy <= p.y && entity.y + entity.h >= p.y) {
                        entity.y = p.y - entity.h;
                        entity.vy = 0;
                        entity.isGrounded = true;
                    } else if (entity.vy < 0 && entity.y - entity.vy >= p.y + p.h && entity.y <= p.y + p.h) {
                        entity.y = p.y + p.h;
                        entity.vy = 0;
                    }
                }
            }

            entity.x += entity.vx;
            for (let p of platforms) {
                if (entity.y + entity.h > p.y && entity.y < p.y + p.h) {
                    if (entity.x + entity.w > p.x && entity.x < p.x + p.w) {
                        if (entity.vx > 0) entity.x = p.x - entity.w;
                        else if (entity.vx < 0) entity.x = p.x + p.w;
                        entity.vx = 0;
                    }
                }
            }
        };

        const gameLoop = () => {
            if (!isRunning) return;
            frameCount++;
            
            // Input Handling
            if (keys['a'] || keys['ArrowLeft']) {
                player.vx = -player.speed;
                player.facing = -1;
            } else if (keys['d'] || keys['ArrowRight']) {
                player.vx = player.speed;
                player.facing = 1;
            } else {
                player.vx *= 0.5; // Friction
            }

            if ((keys['w'] || keys['ArrowUp']) && player.isGrounded) {
                player.vy = player.jumpPower;
                playSound('jump');
                keys['w'] = false; keys['ArrowUp'] = false; // Prevent hold jumping
            }

            if ((keys[' '] || keys['Shift'] || keys['Enter']) && player.cooldown <= 0) {
                playSound('shoot');
                bullets.push({
                    x: player.facing === 1 ? player.x + player.w : player.x - 10,
                    y: player.y + player.h/3,
                    w: 12, h: 6,
                    vx: player.facing === 1 ? 16 : -16, vy: 0,
                    color: currentMission.accent, isPlayer: true
                });
                player.cooldown = 12;
            }

            if (player.cooldown > 0) player.cooldown--;
            if (player.invulnerableTime > 0) player.invulnerableTime--;

            applyPhysics(player);

            // Pit death
            if (player.y > canvas.height) {
                playerHit();
                player.x = Math.max(0, cameraX);
                player.y = -100;
                player.vx = 0; player.vy = 0;
            }

            // Mission Bounds
            if (player.x < cameraX - 50) player.x = cameraX - 50;
            if (currentMission.hasBoss && bossSpawned && player.x > currentMission.length + 500) {
                player.x = currentMission.length + 500;
            }

            // Mission Completion Check
            if (!currentMission.hasBoss && player.x > currentMission.length) {
                isRunning = false;
                setScore(currentScore);
                if (missionIndex < missions.length - 1) {
                    setMissionIndex(missionIndex + 1);
                    setGameState('mission_intro');
                } else {
                    setGameState('victory');
                }
                return;
            }

            // Camera Tracking
            let targetCameraX = player.x - canvas.width / 3;
            if (targetCameraX < 0) targetCameraX = 0;
            if (currentMission.hasBoss && bossSpawned && targetCameraX > currentMission.length - canvas.width/2 + 200) {
                targetCameraX = currentMission.length - canvas.width/2 + 200;
            }
            cameraX += (targetCameraX - cameraX) * 0.1;

            // Boss Spawning
            if (currentMission.hasBoss && player.x > currentMission.length - 200 && !bossSpawned) {
                bossSpawned = true;
                enemies.push({
                    type: 'boss', x: currentMission.length + 400, y: gY - 300,
                    w: 150, h: 300, hp: 80, maxHp: 80,
                    timer: 0, color: '#EF4444', isPlayer: false
                });
                spawnFloatingText(currentMission.length + 400, gY - 350, "WARNING: ROOT CORE", "#EF4444");
            }

            // Dynamic random enemies
            if (Math.random() < 0.01 && cameraX < currentMission.length - 500 && frameCount > 100) {
                enemies.push({
                    type: 'soldier',
                    x: cameraX + canvas.width + 50,
                    y: -100, w: 30, h: 50, hp: 1, vx: 0, vy: 0,
                    color: '#EF4444', facing: -1
                });
            }

            // --- DRAWING ---
            ctx.fillStyle = currentMission.bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Parallax Background
            for (let i = 0; i < 30; i++) {
                let bx = ((i * 200) - (cameraX * 0.3)) % (canvas.width + 200) - 200;
                ctx.fillStyle = 'rgba(255,255,255,0.02)';
                ctx.fillRect(bx, canvas.height - 200 + Math.sin(i)*30, 190, 400);
            }

            // Draw Platforms
            for(let p of platforms) {
                ctx.fillStyle = currentMission.bg;
                ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);
                ctx.strokeStyle = currentMission.accent;
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x - cameraX, p.y, p.w, p.h);
                
                ctx.beginPath();
                ctx.moveTo(p.x - cameraX, p.y + 8);
                ctx.lineTo(p.x + p.w - cameraX, p.y + 8);
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.stroke();
            }

            // Entities Update & Draw
            for (let i = enemies.length - 1; i >= 0; i--) {
                let e = enemies[i];
                
                if (e.type !== 'boss' && e.type !== 'turret') {
                    applyPhysics(e);
                }

                if (e.type === 'soldier') {
                    if (Math.abs(e.x - player.x) < 500) {
                        e.facing = e.x > player.x ? -1 : 1;
                        e.vx = e.facing * 3;
                    }
                    if (Math.random() < 0.02 && Math.abs(e.x - player.x) < 400) {
                        playSound('shoot');
                        bullets.push({
                            x: e.facing === 1 ? e.x + e.w : e.x - 10,
                            y: e.y + e.h/3, w: 8, h: 8,
                            vx: e.facing === 1 ? 8 : -8, vy: 0,
                            color: '#EF4444', isPlayer: false
                        });
                    }
                } else if (e.type === 'turret') {
                    e.timer++;
                    e.facing = e.x > player.x ? -1 : 1;
                    if (e.timer % 80 === 0 && Math.abs(e.x - player.x) < 600) {
                        playSound('shoot');
                        let dx = player.x - e.x;
                        let dy = player.y - e.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        bullets.push({
                            x: e.x + e.w/2, y: e.y + e.h/2, w: 10, h: 10,
                            vx: (dx/dist)*7, vy: (dy/dist)*7,
                            color: '#F59E0B', isPlayer: false
                        });
                    }
                } else if (e.type === 'boss') {
                    e.timer++;
                    if (e.timer % 50 === 0) {
                        playSound('boss_shoot');
                        bullets.push({
                            x: e.x, y: e.y + e.h/2 + Math.random()*200 - 100,
                            w: 16, h: 16,
                            vx: -12, vy: (player.y - e.y) * 0.01,
                            color: '#EF4444', isPlayer: false
                        });
                    }
                    if (e.timer % 120 === 0) {
                        playSound('boss_shoot');
                        let dx = player.x - (e.x + e.w/2);
                        let dy = player.y - (e.y + e.h/2);
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        bullets.push({
                            x: e.x + e.w/2, y: e.y + e.h/2, w: 24, h: 24,
                            vx: (dx/dist)*10, vy: (dy/dist)*10,
                            color: '#F59E0B', isPlayer: false
                        });
                    }
                }

                // Player Collision
                if (e.type !== 'boss' && player.invulnerableTime <= 0) {
                    if (player.x < e.x + e.w && player.x + player.w > e.x &&
                        player.y < e.y + e.h && player.y + player.h > e.y) {
                        playerHit();
                    }
                }

                // Draw Enemy
                ctx.fillStyle = e.color;
                ctx.fillRect(e.x - cameraX, e.y, e.w, e.h);
                
                if (e.type === 'soldier') {
                    ctx.fillStyle = '#111';
                    ctx.fillRect(e.x - cameraX + (e.facing === 1 ? e.w/2 : 0), e.y + 10, e.w/2, 6);
                } else if (e.type === 'boss') {
                    ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(e.timer*0.1)*0.5})`;
                    ctx.beginPath();
                    ctx.arc(e.x + e.w/2 - cameraX, e.y + e.h/2, 80, 0, Math.PI*2);
                    ctx.fill();
                    
                    // Boss HP bar
                    ctx.fillStyle = '#4B5563';
                    ctx.fillRect(e.x - cameraX, e.y - 30, e.w, 15);
                    ctx.fillStyle = '#EF4444';
                    ctx.fillRect(e.x - cameraX, e.y - 30, e.w * (e.hp / e.maxHp), 15);
                }

                if (e.y > canvas.height) enemies.splice(i, 1);
            }

            // Bullets Logic
            for (let i = bullets.length - 1; i >= 0; i--) {
                let b = bullets[i];
                b.x += b.vx; b.y += b.vy;
                
                ctx.fillStyle = b.color;
                ctx.fillRect(b.x - cameraX, b.y, b.w, b.h);
                
                let hitPlatform = false;
                for (let p of platforms) {
                    if (b.x < p.x + p.w && b.x + b.w > p.x && b.y < p.y + p.h && b.y + b.h > p.y) {
                        hitPlatform = true; break;
                    }
                }
                if (hitPlatform || b.x < cameraX - 200 || b.x > cameraX + canvas.width + 200) {
                    bullets.splice(i, 1); continue;
                }
                
                if (b.isPlayer) {
                    let hitEnemy = false;
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        let e = enemies[j];
                        if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
                            e.hp--;
                            bullets.splice(i, 1);
                            createExplosion(b.x, b.y, '#fff', 5);
                            hitEnemy = true;
                            if (e.hp <= 0) {
                                playSound('explosion');
                                createExplosion(e.x + e.w/2, e.y + e.h/2, e.color, e.type === 'boss' ? 100 : 20);
                                let points = e.type === 'boss' ? 5000 : e.type === 'turret' ? 200 : 100;
                                currentScore += points;
                                spawnFloatingText(e.x, e.y, points.toString(), "#F59E0B");
                                enemies.splice(j, 1);
                                if (e.type === 'boss') {
                                    setTimeout(() => {
                                        isRunning = false;
                                        setScore(currentScore);
                                        setGameState('victory');
                                    }, 3000);
                                }
                            }
                            break;
                        }
                    }
                    if (hitEnemy) continue;
                } else {
                    if (player.invulnerableTime <= 0 && b.x < player.x + player.w && b.x + b.w > player.x && b.y < player.y + player.h && b.y + b.h > player.y) {
                        bullets.splice(i, 1);
                        playerHit();
                    }
                }
            }

            // Draw Player
            if (player.invulnerableTime === 0 || Math.floor(frameCount / 4) % 2 === 0) {
                ctx.fillStyle = player.color;
                ctx.fillRect(player.x - cameraX, player.y, player.w, player.h);
                // Bandana
                ctx.fillStyle = currentMission.accent;
                ctx.fillRect(player.x - cameraX, player.y + 5, player.w, 8);
                // Gun
                ctx.fillStyle = '#64748B';
                if (player.facing === 1) {
                    ctx.fillRect(player.x - cameraX + player.w/2, player.y + player.h/3, 25, 10);
                } else {
                    ctx.fillRect(player.x - cameraX - 25 + player.w/2, player.y + player.h/3, 25, 10);
                }
            }

            // Particles & Text
            for (let i = particles.length - 1; i >= 0; i--) {
                let p = particles[i];
                p.x += p.vx; p.y += p.vy; p.life -= p.decay;
                if (p.life <= 0) { particles.splice(i, 1); continue; }
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x - cameraX, p.y, p.size, 0, Math.PI*2); ctx.fill();
            }
            ctx.globalAlpha = 1;

            for (let i = floatingTexts.length - 1; i >= 0; i--) {
                let t = floatingTexts[i];
                t.y += t.vy; t.life -= 0.02;
                if (t.life <= 0) { floatingTexts.splice(i, 1); continue; }
                ctx.globalAlpha = t.life;
                ctx.fillStyle = t.color;
                ctx.font = 'bold 18px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(t.text, t.x - cameraX, t.y);
            }
            ctx.globalAlpha = 1;

            setScore(currentScore);

            if (isRunning) {
                animationId = requestAnimationFrame(gameLoop);
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
    }, [gameState, missionIndex]);

    return (
        <div className="w-screen h-screen overflow-hidden bg-[#050505] relative flex items-center justify-center font-sans selection:bg-transparent text-white">
            
            {gameState === 'playing' && (
                <>
                    <canvas ref={canvasRef} className="absolute inset-0 z-10" />
                    
                    {/* HUD */}
                    <div className="absolute top-6 left-6 z-20 select-none pointer-events-none flex flex-col gap-1">
                        <div className="text-white font-black text-3xl tracking-tight drop-shadow-md">
                            {score.toString().padStart(6, '0')}
                        </div>
                        <div className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: missions[missionIndex].accent }}>
                            {missions[missionIndex].title}
                        </div>
                    </div>

                    <div className="absolute top-6 right-6 z-20 flex gap-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-10 h-10 border-2 flex items-center justify-center transition-all ${
                                i < lives ? 'border-white bg-white/20' : 'border-gray-700 bg-transparent opacity-50'
                            }`}>
                                <Skull size={20} className={i < lives ? 'text-white' : 'text-gray-700'} />
                            </div>
                        ))}
                    </div>

                    <div className="absolute bottom-6 right-6 z-20 text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase pointer-events-none text-right">
                        WASD / ARROWS : MOVE & JUMP<br/>SPACE / SHIFT : FIRE
                    </div>
                </>
            )}

            {gameState === 'menu' && (
                <div className="z-20 flex flex-col items-center animate-in zoom-in duration-500">
                    <div className="text-sm font-bold tracking-[0.5em] text-gray-500 mb-4">ARCADE PROTOCOL</div>
                    <h1 className="text-[100px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-300 to-gray-600 leading-none drop-shadow-2xl tracking-tighter mb-12">
                        CONTRA: 404
                    </h1>
                    
                    <button 
                        onClick={() => {
                            setScore(0);
                            setLives(3);
                            setMissionIndex(0);
                            setGameState('mission_intro');
                        }}
                        className="px-12 py-5 bg-white text-black rounded-none font-black text-[18px] tracking-widest transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3 border-4 border-white hover:bg-transparent hover:text-white"
                    >
                        <Crosshair size={24} />
                        INSERT COIN (START)
                    </button>

                    <button 
                        onClick={() => navigate('/')}
                        className="mt-6 px-8 py-3 text-gray-500 hover:text-white font-bold tracking-widest text-[12px] uppercase transition-colors"
                    >
                        EXIT TO DASHBOARD
                    </button>
                </div>
            )}

            {gameState === 'mission_intro' && (
                <div className="z-20 flex flex-col items-center animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold tracking-[0.3em] text-gray-400 mb-2">
                        STAGE {missionIndex + 1}
                    </h2>
                    <h1 className="text-5xl font-black text-white tracking-tight mb-6" style={{ textShadow: `0 0 20px ${missions[missionIndex].accent}` }}>
                        {missions[missionIndex].title}
                    </h1>
                    <p className="text-gray-400 font-medium tracking-widest uppercase">
                        {missions[missionIndex].desc}
                    </p>
                    
                    <div className="mt-12 w-64 h-1 bg-gray-800 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-white animate-[pulse_1s_ease-in-out_infinite] w-full origin-left scale-x-0 transition-transform duration-[3000ms]" style={{ transform: 'scaleX(1)' }} />
                    </div>
                </div>
            )}

            {gameState === 'gameover' && (
                <div className="z-20 flex flex-col items-center animate-in slide-in-from-bottom-10 duration-500">
                    <h2 className="text-[80px] font-black text-red-600 mb-2 tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                        GAME OVER
                    </h2>
                    <div className="text-2xl font-bold text-gray-400 tracking-[0.2em] mb-12">
                        SCORE: {score.toString().padStart(6, '0')}
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => { 
                                setScore(0); setLives(3); setMissionIndex(0); setGameState('mission_intro'); 
                            }}
                            className="px-8 py-4 bg-red-600 text-white font-black tracking-widest hover:bg-red-500 transition-colors border-2 border-red-600"
                        >
                            CONTINUE?
                        </button>
                        <button 
                            onClick={() => setGameState('menu')}
                            className="px-8 py-4 bg-transparent text-gray-400 border-2 border-gray-700 hover:text-white hover:border-gray-500 font-bold tracking-widest transition-colors"
                        >
                            QUIT
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'victory' && (
                <div className="z-20 flex flex-col items-center animate-in zoom-in duration-1000">
                    <h2 className="text-[80px] font-black text-green-500 mb-2 tracking-tighter drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                        MISSION ACCOMPLISHED
                    </h2>
                    <p className="text-xl text-gray-300 font-bold tracking-widest mb-10">
                        THE ROOT CORE HAS BEEN DESTROYED.
                    </p>
                    <div className="text-4xl font-black text-white tracking-[0.2em] mb-12 border-y-4 border-gray-800 py-6 w-full text-center">
                        FINAL SCORE: {score.toString().padStart(6, '0')}
                    </div>

                    <button 
                        onClick={() => navigate('/')}
                        className="px-10 py-5 bg-white text-black font-black text-xl tracking-widest hover:bg-gray-200 transition-colors flex items-center gap-3"
                    >
                        <Home size={24} />
                        RETURN TO DASHBOARD
                    </button>
                </div>
            )}

            {/* Scanlines Effect */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-10 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
        </div>
    );
}
