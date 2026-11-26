/*
 * Fundo animado da tela de login.
 */
'use strict';

/*
 * Cena minimalista em traço fino, a mesma nos dois temas (só mudam as cores):
 * • skyline de prédios e casas que "sobe" ao abrir a página, com janelas que
 * acendem e apagam devagar (estudo à noite);
 * • ícones de estudo e imóveis (capelo, livro, lápis, casa, chave, prédio,
 * certificado, pino de mapa) subindo lentamente;
 * • lua com estrelas piscando (escuro) ou sol com raios girando e nuvens (claro);
 * • de tempos em tempos, um aviãozinho de papel cruza a tela deixando rastro
 * pontilhado, e no escuro passa uma estrela cadente.
 * Com "reduzir movimento" ativo, desenha um quadro estático.
 */
const SCENE_ICONS = {
    house: 'M3 11 L12 4 L21 11 M5 9.5 V20 H19 V9.5 M10 20 V14 H14 V20',
    cap: 'M2 9 L12 4.5 L22 9 L12 13.5 Z M6 11 V16 C8 17.5 10 18 12 18 C14 18 16 17.5 18 16 V11 M22 9 V14.5',
    book: 'M12 6.5 C10 5 6.5 4.5 3 5 V19 C6.5 18.5 10 19 12 20.5 C14 19 17.5 18.5 21 19 V5 C17.5 4.5 14 5 12 6.5 Z M12 6.5 V20.5',
    pencil: 'M4 20 L5 15.5 L16 4.5 L19.5 8 L8.5 19 Z M14 6.5 L17.5 10',
    key: 'M10.5 15.5 A3.5 3.5 0 1 1 3.5 15.5 A3.5 3.5 0 1 1 10.5 15.5 Z M9.5 13 L20 2.5 M16 6.5 L19 9.5 M18 4.5 L20.5 7',
    building: 'M5 21 V4.5 L13 3 V21 M13 9 H19 V21 M3 21 H21 M8 7.5 H10 M8 11 H10 M8 14.5 H10 M15.5 12.5 H16.5 M15.5 16 H16.5',
    award: 'M17 8.5 A5 5 0 1 1 7 8.5 A5 5 0 1 1 17 8.5 Z M9.2 12.6 L7.8 21 L12 18.7 L16.2 21 L14.8 12.6',
    pin: 'M12 21 C12 21 5 14.5 5 9.5 A7 7 0 0 1 19 9.5 C19 14.5 12 21 12 21 Z M14.5 9.5 A2.5 2.5 0 1 1 9.5 9.5 A2.5 2.5 0 1 1 14.5 9.5 Z',
};
const PLANE_PATH = 'M2 11 L22 3 L15 21 L11 13 Z M11 13 L22 3';

const SCENE_PALETTE = {
    dark: {
        icon: a => `rgba(165,198,245,${a})`, gold: a => `rgba(212,180,106,${a + 0.04})`,
        bFill: 'rgba(5,16,40,0.55)', bStroke: 'rgba(140,175,230,0.20)',
        winLit: a => `rgba(242,207,115,${a})`, winOff: a => `rgba(165,198,245,${a})`,
        ground: 'rgba(212,180,106,0.25)', trail: 'rgba(212,180,106,0.35)', plane: 'rgba(230,237,247,0.45)',
    },
    light: {
        icon: a => `rgba(29,78,160,${a * 1.15})`, gold: a => `rgba(154,116,32,${a + 0.06})`,
        bFill: 'rgba(255,255,255,0.7)', bStroke: 'rgba(29,78,160,0.22)',
        winLit: a => `rgba(217,150,30,${a * 0.85})`, winOff: a => `rgba(29,78,160,${a * 1.4})`,
        ground: 'rgba(154,116,32,0.32)', trail: 'rgba(29,78,160,0.3)', plane: 'rgba(29,78,160,0.5)',
    },
};

const Scene = {
    canvas: null, ctx: null, raf: 0, last: 0, t: 0, intro: 0, w: 0, h: 0, dark: true,
    paths: {}, plane: null, buildings: [], windows: [], floaters: [], stars: [], clouds: [],
    flight: null, nextFlight: 4, meteor: null, nextMeteor: 6,

    init() {
        this.canvas = $('#login-scene');
        if (!this.canvas || !this.canvas.getContext) return;
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx || typeof Path2D !== 'function') { this.ctx = null; return; }
        Object.entries(SCENE_ICONS).forEach(([k, d]) => { this.paths[k] = new Path2D(d); });
        this.plane = new Path2D(PLANE_PATH);
        this.dark = document.documentElement.classList.contains('dark');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    onTheme() {
        this.dark = document.documentElement.classList.contains('dark');
        if (this.ctx && !this.raf) this.draw(0);
    },

    resize() {
        if (!this.ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.layout();
        this.draw(0);
    },

    skylineMax() { return Math.min(190, this.h * 0.24); },

    layout() {
        let seed = 20261111;
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const maxH = this.skylineMax();

        this.buildings = [];
        let x = -8;
        while (x < this.w + 8) {
            const house = rnd() < 0.2;
            const bw = house ? 38 + rnd() * 18 : 30 + rnd() * 52;
            const bh = house ? 34 + rnd() * 12 : 55 + rnd() * (maxH - 55);
            this.buildings.push({ x, bw, bh, house, antenna: !house && rnd() < 0.25 });
            x += bw + 5 + rnd() * 12;
        }

        this.windows = [];
        this.buildings.forEach((b, bi) => {
            if (b.house) return;
            const cols = Math.max(1, Math.floor((b.bw - 10) / 11));
            const rows = Math.max(1, Math.floor((b.bh - 14) / 15));
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
                this.windows.push({ bi, dx: 7 + c * 11, dy: 9 + r * 15, lit: rnd() < 0.2, phase: rnd() * Math.PI * 2, speed: 0.15 + rnd() * 0.5 });
            }
        });

        const skyH = this.h - maxH;
        this.stars = Array.from({ length: Math.round(Math.min(70, this.w / 22)) }, () => ({
            x: rnd() * this.w, y: rnd() * skyH * 0.75, r: 0.6 + rnd() * 0.9, phase: rnd() * Math.PI * 2, speed: 0.6 + rnd() * 1.6,
        }));
        this.clouds = Array.from({ length: this.w > 900 ? 4 : 2 }, (_, i) => ({
            x: rnd() * this.w, y: 60 + rnd() * skyH * 0.45, s: 0.7 + rnd() * 0.6, speed: 5 + rnd() * 7 + i,
        }));

        const n = Math.round(Math.min(20, Math.max(8, (this.w * this.h) / 85000)));
        this.floaters = Array.from({ length: n }, () => this.spawn(true));
    },

    spawn(initial) {
        const keys = Object.keys(SCENE_ICONS);
        const skylineTop = this.h - this.skylineMax();
        return {
            icon: keys[Math.floor(Math.random() * keys.length)],
            x: Math.random() * this.w,
            y: initial ? Math.random() * skylineTop : this.h + 30,
            size: 18 + Math.random() * 20,
            speed: 5 + Math.random() * 9,
            rot: (Math.random() - 0.5) * 0.6,
            vr: (Math.random() - 0.5) * 0.08,
            alpha: 0.07 + Math.random() * 0.09,
            gold: Math.random() < 0.22,
            sway: Math.random() * Math.PI * 2,
        };
    },

    drawCelestial(p) {
        const { ctx, w, h, t } = this;
        const r = w < 640 ? 20 : 30;
        const cx = w * (w < 640 ? 0.86 : 0.9), cy = h * 0.16 + Math.sin(t * 0.3) * 4;
        const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 3.2);
        glow.addColorStop(0, this.dark ? 'rgba(200,215,245,0.14)' : 'rgba(244,190,70,0.22)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, r * 3.2, 0, Math.PI * 2); ctx.fill();

        if (this.dark) {
            // Lua crescente
            ctx.save();
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
            ctx.fillStyle = 'rgba(226,234,248,0.16)'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath(); ctx.arc(cx + r * 0.45, cy - r * 0.25, r * 0.88, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            ctx.strokeStyle = 'rgba(226,234,248,0.22)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 0.05, Math.PI * 1.45); ctx.stroke();
        } else {
            // Sol com raios girando
            ctx.fillStyle = 'rgba(244,190,70,0.20)'; ctx.strokeStyle = 'rgba(217,150,30,0.5)'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.lineCap = 'round';
            for (let i = 0; i < 12; i++) {
                const a = t * 0.12 + (i * Math.PI) / 6;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * (r + 7), cy + Math.sin(a) * (r + 7));
                ctx.lineTo(cx + Math.cos(a) * (r + 15), cy + Math.sin(a) * (r + 15));
                ctx.stroke();
            }
        }
    },

    drawCloud(c) {
        const { ctx } = this;
        const s = c.s;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(s, s);
        ctx.beginPath();
        ctx.moveTo(-40, 12);
        ctx.arc(-22, 4, 14, Math.PI * 0.75, Math.PI * 1.6);
        ctx.arc(0, -4, 20, Math.PI * 1.15, Math.PI * 1.95);
        ctx.arc(26, 4, 14, Math.PI * 1.4, Math.PI * 0.25);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.strokeStyle = 'rgba(29,78,160,0.16)';
        ctx.lineWidth = 1 / s;
        ctx.fill(); ctx.stroke();
        ctx.restore();
    },

    updateEvents(dt) {
        const { w, h } = this;
        // Aviãozinho de papel
        if (!this.flight) {
            this.nextFlight -= dt;
            if (this.nextFlight <= 0) {
                const y0 = h * (0.45 + Math.random() * 0.2);
                this.flight = { p: 0, dur: 7 + Math.random() * 3, x0: -40, y0, x1: w + 40, y1: y0 - h * (0.2 + Math.random() * 0.15), arc: 40 + Math.random() * 50 };
            }
        } else {
            this.flight.p += dt / this.flight.dur;
            if (this.flight.p >= 1) { this.flight = null; this.nextFlight = 8 + Math.random() * 6; }
        }
        // Estrela cadente (só no escuro)
        if (this.dark) {
            if (!this.meteor) {
                this.nextMeteor -= dt;
                if (this.nextMeteor <= 0) this.meteor = { p: 0, x: w * (0.2 + Math.random() * 0.6), y: h * (0.05 + Math.random() * 0.2), len: 120 + Math.random() * 80 };
            } else {
                this.meteor.p += dt / 1.1;
                if (this.meteor.p >= 1) { this.meteor = null; this.nextMeteor = 7 + Math.random() * 8; }
            }
        }
    },

    flightPoint(f, p) {
        return { x: f.x0 + (f.x1 - f.x0) * p, y: f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * f.arc };
    },

    draw(dt) {
        const { ctx, w, h } = this;
        if (!ctx || !w) return;
        const pal = this.dark ? SCENE_PALETTE.dark : SCENE_PALETTE.light;
        if (dt) this.updateEvents(dt);
        ctx.clearRect(0, 0, w, h);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Céu: estrelas (escuro) ou nuvens (claro), e lua/sol
        if (this.dark) {
            this.stars.forEach(s => {
                const a = 0.12 + 0.38 * (0.5 + 0.5 * Math.sin(this.t * s.speed + s.phase));
                ctx.fillStyle = `rgba(226,234,248,${a})`;
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
            });
        } else {
            this.clouds.forEach(c => {
                if (dt) { c.x += c.speed * dt; if (c.x > w + 80) c.x = -80; }
                this.drawCloud(c);
            });
        }
        this.drawCelestial();

        if (this.meteor && this.dark) {
            const m = this.meteor;
            const hx = m.x + m.p * m.len * 1.6, hy = m.y + m.p * m.len * 0.6;
            const g = ctx.createLinearGradient(hx - m.len * 0.8, hy - m.len * 0.3, hx, hy);
            g.addColorStop(0, 'rgba(226,234,248,0)');
            g.addColorStop(1, `rgba(226,234,248,${0.6 * (1 - m.p)})`);
            ctx.strokeStyle = g; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(hx - m.len * 0.8, hy - m.len * 0.3); ctx.lineTo(hx, hy); ctx.stroke();
        }

        // Ícones de estudo e imóveis
        this.floaters.forEach((f, i) => {
            if (dt) { f.y -= f.speed * dt; f.rot += f.vr * dt; }
            if (f.y < -50) { this.floaters[i] = this.spawn(false); return; }
            const x = f.x + Math.sin(this.t * 0.35 + f.sway) * 14;
            const s = f.size / 24;
            ctx.save();
            ctx.translate(x, f.y);
            ctx.rotate(f.rot);
            ctx.scale(s, s);
            ctx.translate(-12, -12);
            ctx.lineWidth = 1.4 / s;
            ctx.strokeStyle = f.gold ? pal.gold(f.alpha) : pal.icon(f.alpha);
            ctx.stroke(this.paths[f.icon]);
            ctx.restore();
        });

        // Aviãozinho de papel com rastro pontilhado
        if (this.flight) {
            const f = this.flight;
            ctx.save();
            ctx.setLineDash([3, 6]);
            ctx.strokeStyle = pal.trail; ctx.lineWidth = 1.2;
            ctx.beginPath();
            const start = Math.max(0, f.p - 0.35);
            for (let q = start; q <= f.p; q += 0.01) { const pt = this.flightPoint(f, q); if (q === start) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); }
            ctx.stroke();
            ctx.restore();
            const pt = this.flightPoint(f, f.p), nx = this.flightPoint(f, Math.min(1, f.p + 0.01));
            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.rotate(Math.atan2(nx.y - pt.y, nx.x - pt.x) + 0.38);
            ctx.scale(1.3, 1.3);
            ctx.translate(-12, -12);
            ctx.lineWidth = 1.2; ctx.strokeStyle = pal.plane;
            ctx.stroke(this.plane);
            ctx.restore();
        }

        // Skyline sobe ao abrir (intro), depois fica parado
        ctx.lineWidth = 1;
        const grow = this.buildings.map((b, i) => {
            const k = Math.min(1, Math.max(0, (this.intro - i * 0.035) / 0.9));
            return 1 - Math.pow(1 - k, 3);
        });
        this.buildings.forEach((b, i) => {
            const bh = b.bh * grow[i];
            if (bh < 1) return;
            const top = h - bh;
            ctx.fillStyle = pal.bFill;
            ctx.strokeStyle = pal.bStroke;
            ctx.beginPath();
            if (b.house) {
                const roof = bh * 0.45;
                ctx.moveTo(b.x, h); ctx.lineTo(b.x, top + roof); ctx.lineTo(b.x + b.bw / 2, top); ctx.lineTo(b.x + b.bw, top + roof); ctx.lineTo(b.x + b.bw, h);
                ctx.fill(); ctx.stroke();
                if (grow[i] === 1) ctx.strokeRect(b.x + b.bw / 2 - 4.5, h - 13, 9, 13);
            } else {
                ctx.rect(b.x + 0.5, top + 0.5, b.bw, bh);
                ctx.fill(); ctx.stroke();
                if (b.antenna && grow[i] === 1) { ctx.beginPath(); ctx.moveTo(b.x + b.bw / 2, top); ctx.lineTo(b.x + b.bw / 2, top - 14); ctx.stroke(); }
            }
        });

        this.windows.forEach(win => {
            if (grow[win.bi] < 1) return;
            const b = this.buildings[win.bi];
            const a = win.lit ? 0.10 + 0.32 * (0.5 + 0.5 * Math.sin(this.t * win.speed + win.phase)) : 0.035;
            ctx.fillStyle = win.lit ? pal.winLit(a) : pal.winOff(a);
            ctx.fillRect(b.x + win.dx, h - b.bh + win.dy, 5, 7);
        });

        ctx.strokeStyle = pal.ground;
        ctx.beginPath(); ctx.moveTo(0, h - 0.5); ctx.lineTo(w, h - 0.5); ctx.stroke();
    },

    loop(ts) {
        const dt = this.last ? Math.min(0.05, (ts - this.last) / 1000) : 0;
        this.last = ts;
        this.t += dt;
        this.intro += dt;
        this.draw(dt);
        this.raf = requestAnimationFrame(tt => this.loop(tt));
    },

    start() {
        if (!this.ctx) return;
        this.stop();
        this.dark = document.documentElement.classList.contains('dark');
        this.intro = REDUCED_MOTION ? 99 : 0;
        this.resize();
        if (REDUCED_MOTION) return;
        this.last = 0;
        this.raf = requestAnimationFrame(tt => this.loop(tt));
    },

    stop() {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = 0;
    },
};
