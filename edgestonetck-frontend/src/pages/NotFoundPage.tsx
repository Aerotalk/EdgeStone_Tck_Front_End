import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw, Crosshair, Terminal, ShieldAlert, ChevronRight } from 'lucide-react';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'story' | 'playing' | 'gameover' | 'victory'>('start');
    const [storyStep, setStoryStep] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);

    const storyTexts = [
        { speaker: "SYSTEM", text: "FATAL ERROR 404 DETECTED.", color: "text-red-500" },
        { speaker: "HQ", text: "Sector 404 has been overrun by rogue malicious programs.", color: "text-blue-400" },
        { speaker: "HQ", text: "Deploying Cyber-Commando. Clear the sector and destroy the Root Core.", color: "text-blue-400" },
        { speaker: "COMMANDO", text: "Locked and loaded. Initiating breach.", color: "text-purple-400" }
    ];

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
        let currentScore = 0;
        let bossSpawned = false;

        const keys: { [key: string]: boolean } = {};
        const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const gY = canvas.height - 100;
        const platforms = [
            { x: -500, y: gY, w: 1500, h: 500 },
            { x: 1200, y: gY, w: 800, h: 500 },
            { x: 2300, y: gY, w: 1000, h: 500 },
            { x: 3500, y: gY, w: 2000, h: 500 },
            
            { x: 600, y: gY - 120, w: 200, h: 30 },
            { x: 1400, y: gY - 150, w: 150, h: 30 },
            { x: 1700, y: gY - 250, w: 150, h: 30 },
            { x: 2500, y: gY - 100, w: 300, h: 30 },
            { x: 2900, y: gY - 200, w: 200, h: 30 },
        ];

        let player = {
            x: 100, y: gY - 100, w: 30, h: 50,
            vx: 0, vy: 0, speed: 6, jumpPower: -14,
            facing: 1, isGrounded: false, hp: 3,
            color: '#A688C4', cooldown: 0, invulnerableTime: 0
        };

        let bullets: any[] = [];
        let enemies: any[] = [
            { type: 'soldier', x: 800, y: gY - 60, w: 30, h: 50, hp: 1, vx: 0, vy: 0, color: '#EF4444', facing: -1 },
            { type: 'soldier', x: 1450, y: gY - 210, w: 30, h: 50, hp: 1, vx: 0, vy: 0, color: '#EF4444', facing: -1 },
            { type: 'turret', x: 1800, y: gY - 280, w: 40, h: 30, hp: 3, timer: 0, color: '#F59E0B', facing: -1 },
            { type: 'soldier', x: 2600, y: gY - 160, w: 30, h: 50, hp: 1, vx: 0, vy: 0, color: '#EF4444', facing: -1 },
            { type: 'turret', x: 3000, y: gY - 230, w: 40, h: 30, hp: 3, timer: 0, color: '#F59E0B', facing: -1 },
        ];
        let particles: any[] = [];
        let floatingTexts: any[] = [];

        const createExplosion = (x: number, y: number, color: string, count: number = 20) => {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    life: 1, color,
                    size: Math.random() * 5 + 2,
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
            
            // Input
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
            }

            if ((keys[' '] || keys['Shift'] || keys['Enter']) && player.cooldown <= 0) {
                playSound('shoot');
                bullets.push({
                    x: player.facing === 1 ? player.x + player.w : player.x - 10,
                    y: player.y + player.h/3,
                    w: 12, h: 6,
                    vx: player.facing === 1 ? 16 : -16, vy: 0,
                    color: '#38BDF8', isPlayer: true
                });
                player.cooldown = 12;
            }

            if (player.cooldown > 0) player.cooldown--;
            if (player.invulnerableTime > 0) player.invulnerableTime--;

            applyPhysics(player);

            if (player.y > canvas.height) {
                playerHit();
                player.x -= 200;
                player.y = -100;
                player.vx = 0; player.vy = 0;
                if (player.x < 0) player.x = 0;
            }
            
            if (bossSpawned && player.x > 4300) player.x = 4300;
            if (player.x < cameraX - 50) player.x = cameraX - 50; // Prevent going too far back

            // Camera
            let targetCameraX = player.x - canvas.width / 3;
            if (targetCameraX < 0) targetCameraX = 0;
            if (bossSpawned && targetCameraX > 3500 - canvas.width/2) targetCameraX = 3500 - canvas.width/2;
            cameraX += (targetCameraX - cameraX) * 0.1;

            // Spawn Boss
            if (player.x > 3800 && !bossSpawned) {
                bossSpawned = true;
                enemies.push({
                    type: 'boss', x: 4200, y: gY - 300,
                    w: 150, h: 300, hp: 60, maxHp: 60,
                    timer: 0, color: '#9333EA', isPlayer: false
                });
                spawnFloatingText(4200, gY - 350, "WARNING: ROOT CORE", "#EF4444");
            }

            // Dynamic enemy spawns
            if (Math.random() < 0.015 && cameraX < 3500 && frameCount > 100) {
                enemies.push({
                    type: 'soldier',
                    x: cameraX + canvas.width + 50,
                    y: -100, w: 30, h: 50, hp: 1, vx: 0, vy: 0,
                    color: '#EF4444', facing: -1
                });
            }

            // Draw Background
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Parallax Grid
            for (let i = 0; i < 30; i++) {
                let bx = ((i * 200) - (cameraX * 0.3)) % (canvas.width + 200) - 200;
                ctx.fillStyle = '#1E293B';
                ctx.fillRect(bx, canvas.height - 200 + Math.sin(i)*30, 190, 400);
            }

            // Draw Platforms
            for(let p of platforms) {
                ctx.fillStyle = '#0F172A';
                ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);
                ctx.strokeStyle = '#38BDF8';
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x - cameraX, p.y, p.w, p.h);
                
                ctx.beginPath();
                ctx.moveTo(p.x - cameraX, p.y + 8);
                ctx.lineTo(p.x + p.w - cameraX, p.y + 8);
                ctx.strokeStyle = '#0284C7';
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
                    if (e.timer % 90 === 0 && Math.abs(e.x - player.x) < 600) {
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
                    if (e.timer % 60 === 0) {
                        playSound('boss_shoot');
                        bullets.push({
                            x: e.x, y: e.y + e.h/2 + Math.random()*150 - 75,
                            w: 16, h: 16,
                            vx: -10, vy: (player.y - e.y) * 0.01,
                            color: '#EF4444', isPlayer: false
                        });
                    }
                    if (e.timer % 150 === 0) {
                        playSound('boss_shoot');
                        let dx = player.x - (e.x + e.w/2);
                        let dy = player.y - (e.y + e.h/2);
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        bullets.push({
                            x: e.x + e.w/2, y: e.y + e.h/2, w: 24, h: 24,
                            vx: (dx/dist)*12, vy: (dy/dist)*12,
                            color: '#F59E0B', isPlayer: false
                        });
                    }
                }

                // Collision with player
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
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(e.x - cameraX + (e.facing === 1 ? e.w/2 : 0), e.y + 10, e.w/2, 6);
                } else if (e.type === 'boss') {
                    ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(e.timer*0.1)*0.5})`;
                    ctx.beginPath();
                    ctx.arc(e.x + e.w/2 - cameraX, e.y + e.h/2, 60, 0, Math.PI*2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#4B5563';
                    ctx.fillRect(e.x - cameraX, e.y - 20, e.w, 10);
                    ctx.fillStyle = '#EF4444';
                    ctx.fillRect(e.x - cameraX, e.y - 20, e.w * (e.hp / e.maxHp), 10);
                }

                if (e.y > canvas.height) enemies.splice(i, 1);
            }

            // Bullets
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
                                currentScore += e.type === 'boss' ? 5000 : 100;
                                spawnFloatingText(e.x, e.y, e.type === 'boss' ? "5000" : "100", "#F59E0B");
                                enemies.splice(j, 1);
                                if (e.type === 'boss') {
                                    setTimeout(() => setGameState('victory'), 2000);
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
                // Head
                ctx.fillStyle = '#E9D5FF';
                ctx.fillRect(player.x - cameraX + 5, player.y - 15, 20, 15);
                // Gun
                ctx.fillStyle = '#fff';
                if (player.facing === 1) {
                    ctx.fillRect(player.x - cameraX + player.w/2, player.y + player.h/3, 25, 8);
                } else {
                    ctx.fillRect(player.x - cameraX - 25 + player.w/2, player.y + player.h/3, 25, 8);
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
                ctx.font = 'bold 16px Inter, sans-serif';
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
    }, [gameState]);

    const handleStoryAdvance = () => {
        if (storyStep < storyTexts.length - 1) {
            setStoryStep(storyStep + 1);
        } else {
            setGameState('playing');
        }
    };

    return (
        <div className="w-screen h-screen overflow-hidden bg-[#0F172A] relative flex items-center justify-center font-sans selection:bg-transparent">
            {gameState === 'playing' && (
                <>
                    <canvas ref={canvasRef} className="absolute inset-0 z-10" />
                    
                    {/* HUD */}
                    <div className="absolute top-6 left-6 z-20 select-none pointer-events-none flex flex-col gap-1">
                        <div className="text-white font-black text-3xl tracking-tight drop-shadow-md">
                            SCORE: {score.toLocaleString()}
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-6 z-20 flex gap-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-8 h-8 rounded-sm border-2 flex items-center justify-center transition-all ${
                                i < lives ? 'bg-purple-500/20 border-purple-400' : 'bg-transparent border-gray-600 opacity-30'
                            }`}>
                                <div className={`w-4 h-4 rounded-sm transition-all ${
                                    i < lives ? 'bg-purple-400' : 'bg-gray-600'
                                }`} />
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => navigate('/')}
                        className="absolute top-6 right-6 z-20 bg-white/5 hover:bg-white/10 border border-white/10 text-white backdrop-blur-md px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-[13px] transition-all"
                    >
                        <Home size={16} />
                        Abort
                    </button>
                    
                    <div className="absolute bottom-6 right-6 z-20 text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase pointer-events-none text-right">
                        WASD / Arrows to Move & Jump<br/>Space / Shift to Fire
                    </div>
                </>
            )}

            {gameState === 'start' && (
                <div className="z-20 flex flex-col items-center animate-in zoom-in duration-500 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
                    
                    <ShieldAlert size={64} className="text-red-500 mb-6" />
                    
                    <h1 className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 leading-none drop-shadow-2xl tracking-tighter">
                        404
                    </h1>
                    <h2 className="text-[28px] font-black text-white mb-4 tracking-tight">SECTOR BREACHED</h2>
                    <p className="text-gray-400 text-[15px] mb-12 max-w-[480px] text-center leading-relaxed">
                        The requested routing path has been destroyed. Enemy forces have established a Root Core in this sector.
                    </p>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setGameState('story')}
                            className="px-10 py-4 bg-white text-gray-900 rounded-2xl font-black text-[15px] transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center gap-2"
                        >
                            <Crosshair size={18} />
                            COMMENCE OPERATION
                        </button>
                        <button 
                            onClick={() => navigate('/')}
                            className="px-8 py-4 bg-gray-800/50 hover:bg-gray-800 text-white rounded-2xl font-bold text-[15px] transition-colors border border-gray-700 flex items-center gap-2"
                        >
                            <Home size={18} />
                            Retreat
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'story' && (
                <div 
                    className="z-20 w-full max-w-3xl bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 cursor-pointer shadow-2xl"
                    onClick={handleStoryAdvance}
                >
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                        <Terminal className="text-gray-400" size={24} />
                        <span className="text-gray-400 font-bold tracking-widest text-sm uppercase">Secure Comms Channel</span>
                    </div>
                    
                    <div className="min-h-[120px]">
                        <span className={`font-black text-xl mr-4 ${storyTexts[storyStep].color}`}>
                            {storyTexts[storyStep].speaker}:
                        </span>
                        <span className="text-white text-2xl font-medium tracking-tight">
                            {storyTexts[storyStep].text}
                        </span>
                    </div>

                    <div className="flex justify-end mt-6">
                        <div className="text-gray-500 text-sm font-bold animate-pulse flex items-center gap-1">
                            CLICK TO CONTINUE <ChevronRight size={16} />
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'gameover' && (
                <div className="z-20 flex flex-col items-center bg-[#0F172A]/90 backdrop-blur-xl p-14 rounded-[40px] border border-gray-800 shadow-2xl relative">
                    <h2 className="text-[40px] font-black text-red-500 mb-2 tracking-tight">MISSION FAILED</h2>
                    <p className="text-gray-400 font-medium mb-10">The Commando was KIA. Sector 404 remains hostile.</p>
                    
                    <div className="text-[56px] font-black text-white leading-none tracking-tighter mb-10">
                        {score.toLocaleString()} PTS
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <button 
                            onClick={() => { setScore(0); setLives(3); setGameState('playing'); }}
                            className="w-full py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} />
                            RETRY OPERATION
                        </button>
                        <button 
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white rounded-2xl font-bold text-[15px]"
                        >
                            Return to Base
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'victory' && (
                <div className="z-20 flex flex-col items-center bg-[#0F172A]/90 backdrop-blur-xl p-14 rounded-[40px] border border-gray-800 shadow-2xl relative">
                    <h2 className="text-[40px] font-black text-green-400 mb-2 tracking-tight">SECTOR CLEARED</h2>
                    <p className="text-gray-400 font-medium mb-10">Root Core destroyed. Routing paths restored.</p>
                    
                    <div className="text-[56px] font-black text-white leading-none tracking-tighter mb-10">
                        {score.toLocaleString()} PTS
                    </div>

                    <button 
                        onClick={() => navigate('/')}
                        className="w-full px-10 py-4 bg-green-500 hover:bg-green-400 text-white rounded-2xl font-black text-[15px] flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        RETURN TO DASHBOARD
                    </button>
                </div>
            )}

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
