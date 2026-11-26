/*
 * Funções de apoio usadas em todo o protótipo: seletores, escape de HTML, datas simuladas.
 */
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function icons() {
    try { if (window.lucide) window.lucide.createIcons(); } catch (err) { console.warn('[icons]', err); }
}

function storageGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function storageSet(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* modo privado */ } }

const REDUCED_MOTION = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
const DAY_MS = 86400000;
const BASE_DATE = new Date(new Date().toDateString()); // hoje 00:00
const SIM_DAY_START = 10;

function dateOfDay(day) { return new Date(BASE_DATE.getTime() + (day - SIM_DAY_START) * DAY_MS); }
function fmtDate(d) { return d.toLocaleDateString('pt-BR'); }
function fmtDay(day) { return fmtDate(dateOfDay(day)); }
function todayStr() { return fmtDay(PROGRESS.simDay); }

function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
}

function initials(name) {
    return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}
