/*
 * Fluxo de login: Regional, perfil, e-mail e link de acesso simulado.
 */
'use strict';

function renderLoginOptions() {
    renderRegionalCards(REGIONAIS);
    const count = $('#regional-count');
    if (count) count.textContent = REGIONAIS.length;

    $('#profile-options').innerHTML = Object.entries(PROFILES).map(([key, p]) => `
        <button class="profile-option" onclick="selectProfile('${key}')">
            <span class="ico"><i data-lucide="${p.icon}"></i></span>
            <span><b>${p.label}</b><small>${p.desc}</small></span>
        </button>`).join('');
    icons();
}

function renderRegionalCards(list) {
    const grid = $('#regional-grid');
    if (!grid) return;
    grid.innerHTML = list.length ? list.map((r, i) => `
        <button class="regional-card" style="--i:${i}" onclick="selectRegional('${r.sigla}')" aria-label="Acessar CRECI-${r.sigla}, ${r.regiao}, ${r.estado}">
            <span class="ead-badge" aria-hidden="true"><span><b>EAD</b><small>CRECI</small></span></span>
            <b>CRECI-${r.sigla}</b><small>${r.regiao}</small><em>${r.estado}</em>
            <span class="regional-cta">Acessar <i data-lucide="arrow-right"></i></span>
        </button>`).join('')
        : '<p class="regional-empty">Nenhuma Regional encontrada. Tente a sigla (ex.: SP) ou o nome do estado.</p>';
    icons();
}

// Busca por sigla, estado ou número da região (ignora acentos)
function filterRegionals(query) {
    const q = normalize(String(query || '').trim()).replace(/^creci-?/, '');
    if (!q) return renderRegionalCards(REGIONAIS);
    const exact = REGIONAIS.filter(r => normalize(r.sigla) === q); // sigla exata tem prioridade (ex.: 'sp' não traz Espírito Santo)
    if (exact.length) return renderRegionalCards(exact);
    renderRegionalCards(REGIONAIS.filter(r =>
        normalize(r.sigla) === q || normalize(r.estado).includes(q) || normalize(r.sigla).startsWith(q) || String(r.n) === q.replace(/[^0-9]/g, '')));
}

function showLoginStep(step) {
    STATE.loginStep = step;
    for (let i = 1; i <= 4; i++) {
        const el = $(`#login-step-${i}`);
        if (!el) continue;
        el.hidden = i !== step;
        if (i === step) { el.classList.remove('animate-in'); void el.offsetWidth; el.classList.add('animate-in'); }
    }
    $$('#login-stepper > div').forEach(d => {
        const s = Number(d.dataset.step);
        d.classList.toggle('done', s < step);
        d.classList.toggle('current', s === step);
    });
    if (step !== 4) stopMagicTimers();
    if (step === 3) setTimeout(() => $('#login-email')?.focus(), 60);
}

function selectRegional(sigla) {
    STATE.regional = sigla;
    const r = regionalInfo(sigla);
    const label = `CRECI-${r.sigla} · ${r.regiao} · ${r.estado}`;
    $('#chip-regional-2').textContent = label;
    $('#chip-regional-3').textContent = label;
    showLoginStep(2);
}

function selectProfile(profile) {
    if (!PROFILES[profile]) return;
    STATE.profile = profile;
    $('#step3-profile').textContent = PROFILES[profile].short;
    const input = $('#login-email');
    input.value = USERS[profile].emailLocal;
    setEmailError('');
    showLoginStep(3);
}

function setEmailError(msg) {
    const err = $('#login-email-error');
    const input = $('#login-email');
    err.textContent = msg;
    err.hidden = !msg;
    input.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

function submitEmail(event) {
    if (event) event.preventDefault();
    let value = ($('#login-email').value || '').trim().toLowerCase();

    if (value.includes('@')) {
        const [local, domain] = value.split('@');
        if (domain !== 'creci.org.br') return setEmailError('Use o seu e-mail institucional @creci.org.br.');
        value = local;
    }
    if (!value) return setEmailError('Informe o seu e-mail institucional.');
    if (!/^[a-z0-9]+([._][a-z0-9]+)*$/.test(value)) return setEmailError('Caracteres especiais não são aceitos (ex.: / ( % &).');

    setEmailError('');
    STATE.emailLocal = value;
    $('#sent-email').textContent = `${value}@creci.org.br`;
    startMagicTimers();
    showLoginStep(4);
    showToast('Link de acesso enviado (simulação).', 'success');
}

function startMagicTimers() {
    stopMagicTimers();
    STATE.magicExpiresAt = Date.now() + 20 * 60 * 1000;
    STATE.resendAvailableAt = Date.now() + 30 * 1000;
    const tick = () => {
        const left = Math.max(0, STATE.magicExpiresAt - Date.now());
        const mm = String(Math.floor(left / 60000)).padStart(2, '0');
        const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
        const cd = $('#magic-countdown');
        if (cd) { cd.textContent = left ? `${mm}:${ss}` : 'Expirado'; cd.classList.toggle('expired', !left); }
        const openBtn = $('#btn-open-magic');
        if (openBtn) openBtn.disabled = !left;

        const resend = $('#btn-resend');
        const wait = Math.ceil((STATE.resendAvailableAt - Date.now()) / 1000);
        if (resend) {
            resend.disabled = wait > 0;
            resend.textContent = wait > 0 ? `Reenviar em ${wait}s` : 'Reenviar link';
        }
        if (!left) stopMagicTimers();
    };
    tick();
    STATE.magicTimer = setInterval(tick, 1000);
}

function stopMagicTimers() {
    if (STATE.magicTimer) clearInterval(STATE.magicTimer);
    STATE.magicTimer = null;
}

function resendLink() {
    if (Date.now() < STATE.resendAvailableAt) return;
    startMagicTimers();
    showToast('Novo link enviado. O anterior deixou de valer.', 'info');
}

function openMagicLink() {
    if (!STATE.regional || !STATE.profile) { showLoginStep(1); return; }
    if (Date.now() > STATE.magicExpiresAt) { showToast('O link expirou. Solicite um novo.', 'error'); return; }
    stopMagicTimers();
    enterApp();
}

function enterApp() {
    STATE.loggedIn = true;
    const login = $('#app-login');
    login.classList.add('leaving');
    setTimeout(() => {
        login.hidden = true;
        login.classList.remove('leaving');
        Scene.stop();
        $('#app-main').hidden = false;
        $('#bottom-nav').hidden = false;
        STATE.view = null;
        renderChrome();
        switchView(PROFILES[STATE.profile].home);
        const first = currentUser().name.split(' ')[0];
        showToast(`Bem-vindo(a), ${first}!`, 'success');
    }, REDUCED_MOTION ? 0 : 380);
}

function logout() {
    closeDropdowns();
    closeModal();
    toggleSidebar(false);
    STATE.loggedIn = false;
    STATE.profile = null;
    STATE.regional = null;
    STATE.emailLocal = '';
    STATE.view = null;
    STATE.importPreview = null;
    $('#app-main').hidden = true;
    $('#bottom-nav').hidden = true;
    $('#app-login').hidden = false;
    const search = $('#regional-search');
    if (search) { search.value = ''; renderRegionalCards(REGIONAIS); }
    showLoginStep(1);
    Scene.start();
}
