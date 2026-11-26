/*
 * Relatórios (D2 s24 a s31).
 */
'use strict';

/*
 * Master vê todas as Regionais; o Admin Regional só vê a sua (RN-15).
 * Filtros do slide 27: Curso (1 ou mais), Período, Resultado e Regional (1 ou mais).
 * Os dados abaixo são fictícios; as linhas do corretor de demonstração vêm do estado vivo.
 */
const REPORT_RESULT = {
    aprovado:  { label: 'Aprovado',     badge: 'badge-success' },
    reprovado: { label: 'Reprovado',    badge: 'badge-danger' },
    andamento: { label: 'Em andamento', badge: 'badge-primary' },
    habilitado:{ label: 'Habilitado para prova', badge: 'badge-gold' },
};

const REPORT_SEED = [
    { courseId: 'c2',  name: 'Beatriz Nogueira', regional: 'SP', from: '2026-08-03', to: '2026-09-02', result: 'aprovado' },
    { courseId: 'c2',  name: 'Carlos Menezes',   regional: 'RJ', from: '2026-08-10', to: '2026-09-09', result: 'reprovado' },
    { courseId: 'c9',  name: 'Daniela Torres',   regional: 'MG', from: '2026-09-01', to: '',           result: 'andamento' },
    { courseId: 'c9',  name: 'Eduardo Salles',   regional: 'SP', from: '2026-08-20', to: '2026-09-18', result: 'aprovado' },
    { courseId: 'c10', name: 'Fabiana Rocha',    regional: 'PR', from: '2026-09-15', to: '2026-10-12', result: 'aprovado' },
    { courseId: 'c10', name: 'Gustavo Pires',    regional: 'SP', from: '2026-10-01', to: '',           result: 'andamento' },
    { courseId: 'x1',  name: 'Helena Barbosa',   regional: 'SP', from: '2026-07-06', to: '2026-09-20', result: 'aprovado' },
    { courseId: 'x1',  name: 'Igor Fontana',     regional: 'SP', from: '2026-07-06', to: '2026-09-20', result: 'reprovado' },
    { courseId: 'x1',  name: 'Júlia Andrade',    regional: 'SP', from: '2026-07-08', to: '',           result: 'habilitado' },
    { courseId: 'x3',  name: 'Karina Lopes',     regional: 'RJ', from: '2026-07-13', to: '',           result: 'andamento' },
    { courseId: 'x4',  name: 'Leandro Veiga',    regional: 'MG', from: '2026-07-20', to: '',           result: 'habilitado' },
    { courseId: 'x5',  name: 'Mariana Teixeira', regional: 'PR', from: '2026-08-03', to: '2026-10-05', result: 'aprovado' },
];

function brToIso(br) { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; }
function isoToBr(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : '—'; }

// Junta os dados fictícios com o que o corretor de demonstração fez de verdade na sessão
function reportRows() {
    const live = [];
    const me = STUDENT_NAME();
    const regionalOf = id => courseById(id)?.regional || 'SP';
    Object.entries(PROGRESS.enrollments).forEach(([id, enr]) => {
        const c = courseById(id); if (!c) return;
        const exclusivoPronto = c.type === 'exclusivo' && c.lessons.every(l => l.type === 'presencial' || (enr.lessons[l.id] || {}).done);
        live.push({ courseId: id, name: me, regional: regionalOf(id), from: brToIso(fmtDay(enr.enrolledDay)), to: '', result: exclusivoPronto ? 'habilitado' : 'andamento' });
    });
    Object.entries(PROGRESS.completed).forEach(([id, done]) => {
        if (!courseById(id)) return;
        live.push({ courseId: id, name: me, regional: regionalOf(id), from: brToIso(done.from || done.date), to: brToIso(done.date), result: 'aprovado' });
    });
    PROGRESS.history.forEach(h => live.push({ courseId: h.courseId, name: me, regional: regionalOf(h.courseId), from: brToIso(h.from), to: brToIso(h.to), result: h.result }));
    const rows = [...live, ...REPORT_SEED];
    return can('all_regions') ? rows : rows.filter(r => r.regional === STATE.regional);
}

function reportFiltered() {
    const f = STATE.report;
    const q = normalize(f.q.trim());
    return reportRows().filter(r =>
        (!f.courses.length || f.courses.includes(r.courseId)) &&
        (!f.results.length || f.results.includes(r.result)) &&
        (!can('all_regions') || !f.regionals.length || f.regionals.includes(r.regional)) &&
        (!f.from || r.from >= f.from) && (!f.to || r.from <= f.to) &&
        (!q || normalize(r.name).includes(q)));
}

function checkGroup(name, items, selected) {
    return `<div class="check-group" role="group" aria-label="${esc(name)}">${items.map(([value, label]) => `
        <label class="check-chip"><input type="checkbox" value="${esc(value)}" ${selected.includes(value) ? 'checked' : ''} onchange="toggleReportFilter('${name}', '${esc(value)}', this.checked)"> <span>${esc(label)}</span></label>`).join('')}</div>`;
}

function viewRelatorios() {
    const f = STATE.report;
    const master = can('all_regions');
    const courseOptions = (master ? COURSES : visibleCourses()).map(c => [c.id, `${c.title}${c.type === 'exclusivo' ? ` · ${c.edition}` : ''}`]);
    const regionalOptions = [...new Set(reportRows().map(r => r.regional))].sort().map(r => [r, `CRECI-${r}`]);
    return `
    ${pageHeader({
        icon: 'bar-chart-3',
        crumb: 'Gestão / Relatórios',
        title: 'Relatórios',
        subtitle: master ? 'Participação de todos os alunos, em todas as Regionais.' : `Participação dos alunos da CRECI-${esc(STATE.regional)}. Você vê apenas a sua Regional.`,
        actions: `<button class="btn btn-secondary" onclick="exportReportCsv()"><i data-lucide="download"></i> Exportar CSV</button>`,
    })}

    <div id="report-kpis" class="grid grid-cols-2 lg:grid-cols-4 gap-3"></div>

    <div class="panel mt-5">
        <div class="filter-bar border-b border-line" style="align-items:flex-start">
            <div style="flex:2 1 260px">
                <label class="field-label" for="rep-q">Busca por aluno</label>
                <div class="input-icon"><i data-lucide="search"></i><input id="rep-q" class="input" type="search" placeholder="Nome do aluno" value="${esc(f.q)}" oninput="setReportText('q', this.value)"></div>
            </div>
            <div>
                <label class="field-label" for="rep-from">Inscrição de</label>
                <input id="rep-from" class="input" type="date" value="${esc(f.from)}" onchange="setReportText('from', this.value)">
            </div>
            <div>
                <label class="field-label" for="rep-to">até</label>
                <input id="rep-to" class="input" type="date" value="${esc(f.to)}" onchange="setReportText('to', this.value)">
            </div>
        </div>
        <details class="report-filters" open>
            <summary>Filtros por curso, resultado${master ? ' e Regional' : ''} <span class="text-muted text-xs">(vazio = todos)</span></summary>
            <div class="px-4 pb-4 space-y-3">
                <div><div class="label-mono mb-1">Resultado</div>${checkGroup('results', Object.entries(REPORT_RESULT).map(([k, v]) => [k, v.label]), f.results)}</div>
                ${master ? `<div><div class="label-mono mb-1">Regional</div>${checkGroup('regionals', regionalOptions, f.regionals)}</div>` : ''}
                <div><div class="label-mono mb-1">Curso</div>${checkGroup('courses', courseOptions, f.courses)}</div>
                <button class="btn btn-ghost btn-sm" onclick="clearReportFilters()"><i data-lucide="x"></i> Limpar filtros</button>
            </div>
        </details>
        <div class="table-wrap">
            <table class="table">
                <thead><tr><th>Curso</th><th>Inscrito</th><th class="hidden sm:table-cell">Regional</th><th class="hidden md:table-cell">Data inscrição</th><th class="hidden md:table-cell">Data término</th><th>Resultado</th></tr></thead>
                <tbody id="report-tbody"></tbody>
            </table>
        </div>
    </div>`;
}

function setReportText(key, value) { STATE.report[key] = value; updateReportTable(); }
function toggleReportFilter(group, value, on) {
    const list = STATE.report[group];
    const i = list.indexOf(value);
    if (on && i < 0) list.push(value);
    if (!on && i >= 0) list.splice(i, 1);
    updateReportTable();
}
function clearReportFilters() { STATE.report = { q: '', from: '', to: '', courses: [], results: [], regionals: [] }; renderView(); }

function updateReportTable() {
    const tbody = $('#report-tbody');
    if (!tbody) return;
    const rows = reportFiltered();
    const count = k => rows.filter(r => r.result === k).length;
    $('#report-kpis').innerHTML = [
        kpi({ label: 'Inscrições', value: rows.length, icon: 'users', tone: 'primary', hint: 'Com os filtros atuais' }),
        kpi({ label: 'Aprovados', value: count('aprovado'), icon: 'circle-check', tone: 'success' }),
        kpi({ label: 'Reprovados', value: count('reprovado'), icon: 'circle-x', tone: 'danger' }),
        kpi({ label: 'Em curso', value: count('andamento') + count('habilitado'), icon: 'hourglass', tone: 'warning', hint: 'Em andamento ou habilitados para a prova' }),
    ].join('');
    tbody.innerHTML = rows.length ? rows.map(r => {
        const c = courseById(r.courseId);
        const st = REPORT_RESULT[r.result];
        return `
        <tr>
            <td><div class="font-semibold">${esc(c ? c.title : '—')}</div><div class="text-[11px] text-muted">${esc(c ? c.edition : '')}</div></td>
            <td class="font-semibold">${esc(r.name)}</td>
            <td class="hidden sm:table-cell font-mono text-xs">CRECI-${esc(r.regional)}</td>
            <td class="hidden md:table-cell font-mono text-xs">${isoToBr(r.from)}</td>
            <td class="hidden md:table-cell font-mono text-xs">${isoToBr(r.to)}</td>
            <td><span class="badge ${st.badge}">${st.label}</span></td>
        </tr>`;
    }).join('') : `<tr><td colspan="6">${emptyState('search-x', 'Nenhum resultado', 'Ajuste os filtros para ver mais inscrições.')}</td></tr>`;
    icons();
}

function csvCell(v) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }
function exportReportCsv() {
    const rows = reportFiltered();
    const lines = [['Curso', 'Edição', 'Inscrito', 'Regional', 'Data inscrição', 'Data término', 'Resultado'].map(csvCell).join(';')]
        .concat(rows.map(r => { const c = courseById(r.courseId); return [c?.title, c?.edition, r.name, `CRECI-${r.regional}`, isoToBr(r.from), isoToBr(r.to), REPORT_RESULT[r.result].label].map(csvCell).join(';'); }));
    try {
        const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'relatorio-ead-creci.csv';
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        showToast(`${rows.length} linhas exportadas.`, 'success');
    } catch (e) { showToast('Não foi possível exportar neste navegador.', 'error'); }
}
