/*
 * Eventos globais (teclado, cliques fora de menus) e inicialização da página.
 * Precisa ser o último arquivo carregado.
 */
'use strict';

document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dropdown]')) closeDropdowns();
    if (e.target.id === 'modal') closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && $('#modal').classList.contains('active')) {
        const box = $('#modal-box');
        const focusables = $$('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', box)
            .filter(el => el.offsetParent !== null);
        if (focusables.length) {
            const first = focusables[0], last = focusables[focusables.length - 1];
            if (!box.contains(document.activeElement) || (e.shiftKey && document.activeElement === first)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    }
    if (e.key === 'Escape') {
        if ($('.dropdown.open')) closeDropdowns();
        else if ($('#modal').classList.contains('active')) closeModal();
        else toggleSidebar(false);
    }
});

window.addEventListener('error', (e) => {
    console.error('[EAD CRECI]', e.error || e.message);
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Padrões isométricos (claro/escuro) como variáveis CSS
    const root = document.documentElement.style;
    root.setProperty('--iso-light', buildIsoPattern('rgba(29,78,160,0.07)'));
    root.setProperty('--iso-dark', buildIsoPattern('rgba(148,180,230,0.07)'));

    applyTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light', false);
    applyFontScale(Number(storageGet('ead-font')) || 100, false);

    STATE.courseDraft = COURSE_DRAFT_EMPTY();
    renderLoginOptions();
    showLoginStep(1);
    Scene.init();
    Scene.start();
    icons();

    // Segue o tema do sistema enquanto o usuário não escolher um manualmente
    if (window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = ev => { if (!storageGet('ead-theme')) applyTheme(ev.matches ? 'dark' : 'light', false); };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
    }

    if (!window.lucide) console.warn('Lucide não carregou: os ícones não serão exibidos (verifique a conexão).');
});
