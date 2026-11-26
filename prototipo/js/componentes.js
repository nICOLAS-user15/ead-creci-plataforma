/*
 * Peças de interface reaproveitadas pelas telas: cabeçalho de página, indicadores, estado vazio,
 * janela modal e avisos (toasts).
 */
'use strict';

// Etiqueta para funções que não constam nos requisitos originais (PPTX). Ver docs/prompts.md, P-08.
const TAG_PROPOSTA = '<span class="tag-proposta" title="Não consta nos requisitos originais; a validar com o gestor">Proposta</span>';

function pageHeader({ icon, crumb, title, subtitle, actions = '' }) {
    return `
    <div class="page-header">
        <div class="page-header-icon"><i data-lucide="${icon}"></i></div>
        <div class="page-header-body">
            <div class="label-mono">${crumb}</div>
            <h1>${title}</h1>
            <p>${subtitle}</p>
        </div>
        ${actions ? `<div class="page-header-actions">${actions}</div>` : ''}
    </div>`;
}

function kpi({ label, value, icon, tone = '', hint = '' }) {
    return `
    <div class="panel kpi">
        <div class="kpi-top"><span class="label-mono">${label}</span><span class="kpi-icon ${tone ? `tone-${tone}` : ''}"><i data-lucide="${icon}"></i></span></div>
        <div class="kpi-value">${value}</div>
        ${hint ? `<div class="kpi-hint">${hint}</div>` : ''}
    </div>`;
}

function emptyState(icon, title, text, action = '') {
    return `<div class="empty"><i data-lucide="${icon}"></i><h4>${title}</h4><p>${text}</p>${action}</div>`;
}

function simDayControl() {
    return `
    <div class="flex items-center gap-2 panel" style="padding:.35rem .4rem .35rem .75rem">
        <span class="label-mono" title="Data usada pela simulação de liberação diária">Hoje (simulado)</span>
        <span class="font-mono text-sm font-bold">${todayStr()}</span>
        <button class="btn btn-secondary btn-sm" onclick="advanceDay()" title="Simula a passagem de um dia"><i data-lucide="calendar-plus"></i> +1 dia</button>
    </div>`;
}

let lastFocus = null;

function openModal({ title, icon = 'info', body = '', footer = '', size = '', proposta = false }) {
    const overlay = $('#modal');
    const box = $('#modal-box');
    const wasOpen = overlay.classList.contains('active');
    const bodyEl = $('#modal-body');
    const keepScroll = wasOpen ? bodyEl.scrollTop : 0;

    $('#modal-title').textContent = title;
    if (proposta) $('#modal-title').insertAdjacentHTML('beforeend', ` ${TAG_PROPOSTA}`);
    $('#modal-icon').innerHTML = `<i data-lucide="${icon}"></i>`;
    bodyEl.innerHTML = body;
    $('#modal-footer').innerHTML = footer;
    box.className = `modal ${size ? `size-${size}` : ''}`;

    if (!wasOpen) {
        lastFocus = document.activeElement;
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        bodyEl.scrollTop = 0;
        setTimeout(() => box.querySelector('.modal-header .icon-btn')?.focus(), 30);
    } else {
        bodyEl.scrollTop = keepScroll;
    }
    icons();
}

function closeModal() {
    const overlay = $('#modal');
    if (!overlay || !overlay.classList.contains('active')) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    STATE.classroom = null;
    STATE.profileDraft = null;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

// Avisos (toasts)
function showToast(message, type = 'info') {
    const stack = $('#toast-stack');
    if (!stack) return;
    const iconName = { success: 'circle-check', error: 'circle-x', warning: 'triangle-alert', info: 'info' }[type] || 'info';
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = `<i data-lucide="${iconName}"></i><span></span>`;
    toast.querySelector('span').textContent = message;
    stack.appendChild(toast);
    icons();
    while (stack.children.length > 4) stack.firstElementChild.remove();
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, type === 'error' ? 4000 : 2800);
}
