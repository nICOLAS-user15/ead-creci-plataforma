/*
 * Menu lateral, barra superior, notificações e troca de telas (com controle de permissão por perfil).
 */
'use strict';

function avatarHTML(user, size = 'sm') {
    if (!user) return '';
    if (user.photo) return `<span class="avatar avatar-${size}"><img src="${esc(user.photo)}" alt="Foto de ${esc(user.name)}"></span>`;
    return `<span class="avatar avatar-${size}" aria-hidden="true">${esc(initials(user.name))}</span>`;
}

function renderChrome() {
    const user = currentUser();
    if (!user) return;
    const r = regionalInfo(STATE.regional);

    // Permissões: mostra/oculta seções e itens
    $$('[data-perm]').forEach(el => { el.hidden = !can(el.dataset.perm); });

    $('#sidebar-regional').textContent = `CRECI-${r.sigla} · ${r.estado}`;
    $('#topbar-title').textContent = can('all_regions') ? 'COFECI · Todas as Regionais' : `CRECI-${r.sigla} · ${r.regiao}`;
    $('#topbar-sub').textContent = PROFILES[STATE.profile].label;
    $('#topbar-avatar').innerHTML = avatarHTML(user, 'sm');
    $('#dd-user-avatar').innerHTML = avatarHTML(user, 'md');
    $('#dd-user-name').textContent = user.name;
    $('#dd-user-email').textContent = userEmail();

    updatePtamCount();
    renderNotifs();
    icons();
}

function updatePtamCount() {
    const el = $('#nav-count-ptam');
    if (!el) return;
    const n = visiblePtam().filter(p => p.status === 'analyzing').length;
    el.textContent = n;
    el.hidden = !n;
}

function toggleNavSection(btn) {
    const section = btn.closest('.nav-section');
    const collapsed = section.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', String(!collapsed));
}

function toggleSidebar(force) {
    const mobile = window.innerWidth < 1024; // celular e tablet usam gaveta
    if (force === false) { document.body.classList.remove('sidebar-open'); return; }
    if (mobile) document.body.classList.toggle('sidebar-open');
    else document.body.classList.toggle('sidebar-collapsed');
}

/* Dropdowns */
function toggleDropdown(id, event) {
    if (event) event.stopPropagation();
    const dd = $(`#${id}`);
    if (!dd) return;
    const willOpen = !dd.classList.contains('open');
    closeDropdowns();
    if (willOpen) dd.classList.add('open');
}

function closeDropdowns() { $$('.dropdown.open').forEach(d => d.classList.remove('open')); }

/* Notificações */
function pushNotif(profile, notif) {
    NOTIFS[profile] = NOTIFS[profile] || [];
    NOTIFS[profile].unshift({ id: `n${Date.now()}${Math.random().toString(16).slice(2, 6)}`, time: 'Agora', read: false, ...notif });
    if (profile === STATE.profile) renderNotifs();
}

function renderNotifs() {
    const list = NOTIFS[STATE.profile] || [];
    const unread = list.filter(n => !n.read).length;
    const badge = $('#notif-badge');
    badge.textContent = unread > 9 ? '9+' : unread;
    badge.hidden = !unread;
    $('#notif-btn').classList.toggle('has-unread', !!unread);
    $('#notif-list').innerHTML = list.length ? list.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}">
            <span class="dot"></span>
            <div class="min-w-0">
                <div class="font-semibold">${esc(n.title)}</div>
                <div class="text-muted" style="font-size:.76rem">${esc(n.msg)}</div>
                <div class="label-mono" style="margin-top:.3rem;font-size:.58rem">${esc(n.time)}</div>
            </div>
        </div>`).join('') : `<div class="empty"><i data-lucide="bell-off"></i><p>Nenhuma notificação.</p></div>`;
    icons();
}

function markAllNotifsRead() {
    (NOTIFS[STATE.profile] || []).forEach(n => { n.read = true; });
    renderNotifs();
}

// Navegação entre telas
const VIEW_PERMS = { 'meus-cursos': 'learn', catalogo: 'catalog', certificados: 'validate', admin: 'ptam_queue', notas: 'import_grades', relatorios: 'reports', 'criar-curso': 'create_course' };

function switchView(view) {
    if (!STATE.loggedIn) return;
    if (!VIEW_PERMS[view] || !can(VIEW_PERMS[view])) view = PROFILES[STATE.profile].home;
    STATE.view = view;

    $$('.nav-link[data-view], .bottom-nav-item[data-view]').forEach(el => {
        const active = el.dataset.view === view;
        el.classList.toggle('active', active);
        if (active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
    });
    toggleSidebar(false);
    renderView();
    const main = $('#main');
    if (main) main.scrollTop = 0;
}

function renderView() {
    const root = $('#view-root');
    if (!root || !STATE.loggedIn) return;
    const renderers = {
        'meus-cursos': viewMeusCursos,
        catalogo: viewCatalogo,
        certificados: viewCertificados,
        admin: viewAdmin,
        notas: viewNotas,
        relatorios: viewRelatorios,
        'criar-curso': viewCriarCurso,
    };
    try {
        root.innerHTML = `<div class="animate-in">${(renderers[STATE.view] || viewMeusCursos)()}</div>`;
    } catch (err) {
        console.error(err);
        root.innerHTML = `<div class="alert alert-danger"><i data-lucide="triangle-alert"></i><div>Não foi possível carregar esta tela. Detalhe técnico: ${esc(err.message)}</div></div>`;
    }
    if (STATE.view === 'catalogo') updateCatalogGrid();
    if (STATE.view === 'admin') updateAdminTable();
    if (STATE.view === 'relatorios') updateReportTable();
    icons();
}

// Re-renderiza a tela atual sem a animação de entrada (após ações)
function refresh() {
    if (!STATE.loggedIn) return;
    const main = $('#main');
    const top = main ? main.scrollTop : 0;
    renderView();
    const wrapper = $('#view-root > .animate-in');
    if (wrapper) wrapper.classList.remove('animate-in');
    if (main) main.scrollTop = top;
    updatePtamCount();
}
