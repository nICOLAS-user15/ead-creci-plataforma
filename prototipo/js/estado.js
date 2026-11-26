/*
 * Estado da interface (tela atual, filtros, rascunhos) e preferências de tema e tamanho de fonte.
 */
'use strict';

const STATE = {
    loggedIn: false,
    regional: null,
    profile: null,
    emailLocal: '',
    view: null,
    loginStep: 1,
    magicExpiresAt: 0,
    magicTimer: null,
    resendTimer: null,
    resendAvailableAt: 0,
    catalog: { q: '', tipo: 'todos', categoria: 'todas', situacao: 'todas' },
    admin: { q: '', status: 'todos', regional: 'todas' },
    classroom: null,
    profileDraft: null,
    importPreview: null,
    importHistory: [],
    fontScale: 100,
    report: { q: '', from: '', to: '', courses: [], results: [], regionals: [] },
    courseDraft: null,
};

const can = perm => !!STATE.profile && PROFILES[STATE.profile].perms.includes(perm);
const currentUser = () => (STATE.profile ? USERS[STATE.profile] : null);
const userEmail = (profile = STATE.profile) => `${(profile === STATE.profile && STATE.emailLocal) || USERS[profile].emailLocal}@creci.org.br`;

// Tema claro/escuro e tamanho da fonte
function applyTheme(theme, persist = true) {
    const dark = theme === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    $$('.theme-toggle').forEach(btn => {
        btn.setAttribute('aria-pressed', String(dark));
        btn.title = dark ? 'Mudar para tema claro' : 'Mudar para tema escuro';
    });
    if (persist) storageSet('ead-theme', theme);
    if (typeof Scene !== 'undefined') Scene.onTheme();
}

function toggleTheme() {
    applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
}

const FONT_STEPS = [90, 100, 110, 120];
function applyFontScale(scale, persist = true) {
    STATE.fontScale = FONT_STEPS.includes(scale) ? scale : 100;
    document.documentElement.style.fontSize = `${16 * STATE.fontScale / 100}px`;
    const label = $('#font-scale-label');
    if (label) label.textContent = `${STATE.fontScale}%`;
    if (persist) storageSet('ead-font', String(STATE.fontScale));
}

function cycleFontScale() {
    const idx = FONT_STEPS.indexOf(STATE.fontScale);
    applyFontScale(FONT_STEPS[(idx + 1) % FONT_STEPS.length]);
    showToast(`Tamanho do texto: ${STATE.fontScale}%`, 'info');
}

// Padrão isométrico (cubos) do fundo, inspirado no CRECI Integra
function buildIsoPattern(stroke) {
    const cubes = [[30, 34.64], [0, 86.6], [60, 86.6], [0, -17.32], [60, -17.32]];
    const path = cubes.map(([cx, cy]) =>
        `M${cx} ${cy - 34.64}L${cx + 30} ${cy - 17.32}L${cx + 30} ${cy + 17.32}L${cx} ${cy + 34.64}L${cx - 30} ${cy + 17.32}L${cx - 30} ${cy - 17.32}Z` +
        `M${cx} ${cy}L${cx} ${cy + 34.64}M${cx} ${cy}L${cx - 30} ${cy - 17.32}M${cx} ${cy}L${cx + 30} ${cy - 17.32}`
    ).join('');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='103.92' viewBox='0 0 60 103.92'><path d='${path}' fill='none' stroke='${stroke}' stroke-width='0.7'/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
