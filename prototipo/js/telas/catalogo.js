/*
 * Tela "Todos os Cursos" (catálogo com filtros).
 */
'use strict';

function viewCatalogo() {
    const f = STATE.catalog;
    const isAdmin = !can('learn');
    const hasExclusive = visibleCourses().some(c => c.type === 'exclusivo');
    return `
    ${pageHeader({
        icon: 'library',
        crumb: isAdmin ? 'Gestão / Catálogo' : 'Aprendizagem / Todos os Cursos',
        title: isAdmin ? 'Catálogo de cursos' : 'Todos os Cursos',
        subtitle: isAdmin
            ? (can('all_regions') ? 'Todos os cursos publicados, de todas as Regionais.' : `Cursos disponíveis para os corretores da CRECI-${esc(STATE.regional)}.`)
            : 'Cursos padrão abrem para inscrição na hora. Os exclusivos são turmas fechadas da sua Regional.',
    })}

    <div class="panel mb-5">
        <div class="filter-bar">
            <div style="flex:2 1 240px">
                <label class="field-label" for="cat-q">Buscar</label>
                <div class="input-icon"><i data-lucide="search"></i><input id="cat-q" class="input" type="search" placeholder="Nome do curso ou assunto" value="${esc(f.q)}" oninput="setCatalogFilter('q', this.value)"></div>
            </div>
            <div>
                <label class="field-label" for="cat-tipo">Modalidade</label>
                <select id="cat-tipo" class="select" onchange="setCatalogFilter('tipo', this.value)">
                    ${[['todos', 'Todas'], ['padrao', 'Padrão'], ['exclusivo', 'Exclusivo (turma regional)']].map(([v, l]) => `<option value="${v}" ${f.tipo === v ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="field-label" for="cat-cat">Categoria</label>
                <select id="cat-cat" class="select" onchange="setCatalogFilter('categoria', this.value)">
                    <option value="todas">Todas</option>
                    ${CATEGORIAS.map(c => `<option ${f.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            ${!isAdmin ? `
            <div>
                <label class="field-label" for="cat-sit">Situação</label>
                <select id="cat-sit" class="select" onchange="setCatalogFilter('situacao', this.value)">
                    ${[['todas', 'Todas'], ['available', 'Disponível'], ['enrolled', 'Em andamento'], ['completed', 'Concluído']].map(([v, l]) => `<option value="${v}" ${f.situacao === v ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </div>` : ''}
        </div>
    </div>

    <div class="flex items-center justify-between mb-3">
        <span class="label-mono" id="catalog-count"></span>
        <button class="btn btn-ghost btn-sm" onclick="clearCatalogFilters()"><i data-lucide="filter-x"></i> Limpar filtros</button>
    </div>
    ${!hasExclusive && !isAdmin ? `<div class="alert alert-info mb-4"><i data-lucide="info"></i><div>Não há turmas exclusivas abertas na CRECI-${esc(STATE.regional)} no momento.</div></div>` : ''}
    <div id="catalog-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"></div>`;
}

function setCatalogFilter(key, value) {
    STATE.catalog[key] = value;
    updateCatalogGrid();
}

function clearCatalogFilters() {
    STATE.catalog = { q: '', tipo: 'todos', categoria: 'todas', situacao: 'todas' };
    refresh();
}

function normalize(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

function updateCatalogGrid() {
    const grid = $('#catalog-grid');
    if (!grid) return;
    const f = STATE.catalog;
    const q = normalize(f.q.trim());
    const list = visibleCourses().filter(c =>
        (f.tipo === 'todos' || c.type === f.tipo) &&
        (f.categoria === 'todas' || c.category === f.categoria) &&
        (f.situacao === 'todas' || !can('learn') || courseStatus(c.id) === f.situacao) &&
        (!q || normalize(`${c.title} ${c.description} ${c.category}`).includes(q)));

    const count = $('#catalog-count');
    if (count) count.textContent = `${list.length} curso${list.length === 1 ? '' : 's'} encontrado${list.length === 1 ? '' : 's'}`;

    grid.innerHTML = list.length
        ? list.map(courseCard).join('')
        : `<div class="panel sm:col-span-2 xl:col-span-3">${emptyState('search-x', 'Nenhum curso encontrado', 'Tente outro termo ou limpe os filtros.')}</div>`;
    icons();
}

function courseCard(c) {
    const excl = c.type === 'exclusivo';
    const status = courseStatus(c.id);
    const full = excl && c.seatsTaken >= c.seats;
    let action;
    if (!can('learn')) {
        action = `<button class="btn btn-secondary btn-sm" onclick="openClassroom('${c.id}', true)"><i data-lucide="eye"></i> Ver conteúdo</button>`;
    } else if (status === 'completed') {
        action = `<button class="btn btn-ghost btn-sm" onclick="openClassroom('${c.id}', true)"><i data-lucide="eye"></i> Consultar</button>`;
    } else if (status === 'enrolled') {
        action = `<button class="btn btn-primary btn-sm" onclick="openClassroom('${c.id}')"><i data-lucide="play-circle"></i> Continuar</button>`;
    } else if (excl) {
        action = full
            ? `<button class="btn btn-secondary btn-sm" disabled>Turma lotada</button>`
            : `<button class="btn btn-gold btn-sm" onclick="enrollCourse('${c.id}')"><i data-lucide="plus"></i> Inscrever-se</button>`;
    } else {
        action = `<button class="btn btn-primary btn-sm" onclick="enrollCourse('${c.id}')"><i data-lucide="plus"></i> Inscrever-se</button>`;
    }

    const statusBadge = { completed: '<span class="badge badge-success"><i data-lucide="check"></i> Concluído</span>', enrolled: '<span class="badge badge-primary">Em andamento</span>' }[status] || '';
    const scopeLabel = excl ? `Turma CRECI-${c.regional}` : (c.scope === 'Nacional' ? 'Nacional' : `Regional · CRECI-${c.scope}`);

    return `
    <article class="panel course-card">
        <div class="course-thumb ${excl ? 'thumb-exclusivo' : 'thumb-padrao'}">
            <span class="badge ${excl ? 'badge-gold' : 'badge-primary'}">${excl ? 'Exclusivo' : 'Padrão'}</span>
            <i data-lucide="${c.icon}"></i>
        </div>
        <div class="p-4 flex flex-col flex-1">
            <div class="flex items-center justify-between gap-2 mb-1">
                <span class="label-mono" style="color:rgb(var(${excl ? '--c-gold' : '--c-primary'}))">${esc(c.category)} · ${esc(scopeLabel)}</span>
                ${can('learn') ? statusBadge : ''}
            </div>
            <h3 class="font-bold leading-snug mb-1.5">${esc(c.title)}</h3>
            <p class="text-xs text-muted line-clamp-2 mb-3">${esc(c.description)}</p>
            <div class="course-meta mb-3">
                <span><i data-lucide="clock"></i> ${c.hours}h</span>
                <span><i data-lucide="list-video"></i> ${c.lessons.length} aulas</span>
                <span><i data-lucide="${excl ? 'map-pin' : 'monitor'}"></i> ${esc(c.modality)}</span>
                ${excl ? `<span><i data-lucide="users"></i> ${c.seatsTaken}/${c.seats} vagas</span>` : ''}
            </div>
            ${excl ? `<div class="text-[11px] text-muted mb-3 flex items-center gap-1.5"><i data-lucide="info" style="width:13px;height:13px"></i> Prova presencial${c.requiresPtam ? ' + envio do PTAM em PDF' : ''}</div>` : ''}
            <div class="mt-auto pt-3 border-t border-line flex items-center justify-between gap-2">
                <span class="text-[11px] text-muted font-mono">${esc(c.edition)}</span>
                ${action}
            </div>
        </div>
    </article>`;
}
