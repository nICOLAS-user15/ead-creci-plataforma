/*
 * Fila de pareceres PTAM (administradores).
 */
'use strict';

function visiblePtam() {
    if (!STATE.profile) return [];
    return can('all_regions') ? PTAM_QUEUE : PTAM_QUEUE.filter(p => p.regional === STATE.regional);
}

function viewAdmin() {
    const queue = visiblePtam();
    const count = s => queue.filter(p => p.status === s).length;
    const f = STATE.admin;
    const regions = [...new Set(PTAM_QUEUE.map(p => p.regional))].sort();
    return `
    ${pageHeader({
        icon: 'inbox',
        crumb: 'Gestão / Pareceres',
        title: 'Pareceres PTAM',
        subtitle: can('all_regions') ? 'Fila de análise de todas as Regionais.' : `Fila de análise da CRECI-${esc(STATE.regional)}. Você vê apenas pareceres da sua Regional.`,
    })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${kpi({ label: 'Em análise', value: count('analyzing'), icon: 'hourglass', tone: 'warning', hint: 'Aguardando avaliação' })}
        ${kpi({ label: 'Concluídos', value: count('completed'), icon: 'thumbs-up', tone: 'success' })}
        ${kpi({ label: 'Reapresentar', value: count('resubmit'), icon: 'rotate-ccw', tone: 'primary' })}
        ${kpi({ label: 'Rejeitados', value: count('rejected'), icon: 'thumbs-down', tone: 'danger' })}
    </div>

    <div class="panel mt-5">
        <div class="filter-bar border-b border-line">
            <div>
                <label class="field-label" for="adm-status">Status</label>
                <select id="adm-status" class="select" onchange="setAdminFilter('status', this.value)">
                    <option value="todos">Todos</option>
                    ${Object.entries(PTAM_STATUS).map(([k, v]) => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${v.label}</option>`).join('')}
                </select>
            </div>
            ${can('all_regions') ? `
            <div>
                <label class="field-label" for="adm-reg">Regional</label>
                <select id="adm-reg" class="select" onchange="setAdminFilter('regional', this.value)">
                    <option value="todas">Todas</option>
                    ${regions.map(r => `<option value="${r}" ${f.regional === r ? 'selected' : ''}>CRECI-${r}</option>`).join('')}
                </select>
            </div>` : ''}
            <div style="flex:2 1 240px">
                <label class="field-label" for="adm-q">Buscar</label>
                <div class="input-icon"><i data-lucide="search"></i><input id="adm-q" class="input" type="search" placeholder="Corretor, CRECI ou arquivo" value="${esc(f.q)}" oninput="setAdminFilter('q', this.value)"></div>
            </div>
        </div>
        <div class="table-wrap">
            <table class="table">
                <thead><tr><th>Status</th><th>Corretor</th><th class="hidden md:table-cell">Curso / Turma</th><th>Documento</th><th class="hidden sm:table-cell">Enviado em</th><th class="text-right">Ações</th></tr></thead>
                <tbody id="ptam-tbody"></tbody>
            </table>
        </div>
    </div>`;
}

function setAdminFilter(key, value) {
    STATE.admin[key] = value;
    updateAdminTable();
}

function updateAdminTable() {
    const tbody = $('#ptam-tbody');
    if (!tbody) return;
    const f = STATE.admin;
    const q = normalize(f.q.trim());
    const rows = visiblePtam().filter(p =>
        (f.status === 'todos' || p.status === f.status) &&
        (f.regional === 'todas' || !can('all_regions') || p.regional === f.regional) &&
        (!q || normalize(`${p.corretor} ${p.creci} ${p.document}`).includes(q)));

    tbody.innerHTML = rows.length ? rows.map(p => {
        const st = PTAM_STATUS[p.status];
        const course = courseById(p.courseId);
        return `
        <tr>
            <td><span class="badge ${st.badge}">${st.label}</span></td>
            <td><div class="font-semibold">${esc(p.corretor)}</div><div class="text-[11px] text-muted font-mono">${esc(p.creci)}</div></td>
            <td class="hidden md:table-cell"><div class="text-sm">${esc(course ? course.title : '—')}</div><div class="text-[11px] text-muted">${esc(course ? course.edition : '')}</div></td>
            <td><span class="inline-flex items-center gap-1.5 text-sm"><i data-lucide="file-text" class="text-danger" style="width:15px;height:15px"></i><span class="truncate" style="max-width:190px">${esc(p.document)}</span></span></td>
            <td class="hidden sm:table-cell font-mono text-xs">${esc(p.submittedAt)}</td>
            <td class="text-right"><button class="btn ${p.status === 'analyzing' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="openPtamReview('${p.id}')"><i data-lucide="${p.status === 'analyzing' ? 'clipboard-check' : 'eye'}"></i> ${p.status === 'analyzing' ? 'Avaliar' : 'Ver'}</button></td>
        </tr>`;
    }).join('') : `<tr><td colspan="6">${emptyState('inbox', 'Nada na fila', 'Nenhum parecer com esses filtros.')}</td></tr>`;
    icons();
}

function openPtamReview(id) {
    const p = PTAM_QUEUE.find(x => x.id === id);
    if (!p) return showToast('Parecer não encontrado.', 'error');
    if (!can('all_regions') && p.regional !== STATE.regional) return showToast('Este parecer pertence a outra Regional.', 'error');
    const course = courseById(p.courseId);
    const st = PTAM_STATUS[p.status];
    const final = p.status === 'completed' || p.status === 'rejected';
    openModal({
        title: 'Avaliar parecer PTAM',
        icon: 'clipboard-check',
        size: 'lg',
        body: `
        <dl class="info-grid mb-4">
            <div class="info-item"><dt class="label-mono">Corretor</dt><dd>${esc(p.corretor)}</dd></div>
            <div class="info-item"><dt class="label-mono">Inscrição</dt><dd class="font-mono text-sm">${esc(p.creci)}</dd></div>
            <div class="info-item"><dt class="label-mono">Curso</dt><dd>${esc(course ? `${course.title} · ${course.edition}` : '—')}</dd></div>
            <div class="info-item"><dt class="label-mono">Status atual</dt><dd><span class="badge ${st.badge}">${st.label}</span></dd></div>
        </dl>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div class="md:col-span-2">
                <div class="label-mono mb-2">Pré-visualização</div>
                <div class="doc-mock">
                    <div style="font:700 .6rem 'JetBrains Mono',monospace;letter-spacing:.12em;color:#64748b">PARECER TÉCNICO DE AVALIAÇÃO MERCADOLÓGICA</div>
                    <div style="font-weight:700;font-size:.8rem;margin:.4rem 0 .6rem">${esc(p.document)}</div>
                    ${[90, 70, 85, 60, 95, 40, 80, 65].map(w => `<div class="ln" style="width:${w}%"></div>`).join('')}
                </div>
                <p class="text-[11px] text-muted mt-2">Arquivo simulado para o protótipo.</p>
            </div>
            <div class="md:col-span-3">
                <label class="field-label" for="ptam-note">Comentário para o corretor</label>
                <textarea id="ptam-note" class="textarea" placeholder="Obrigatório para Reapresentar ou Rejeitar" ${final ? 'readonly' : ''}>${esc(p.note)}</textarea>
                <p class="field-error" id="ptam-note-error" hidden>Escreva o motivo para o corretor.</p>
                <div class="text-xs text-muted mt-3 space-y-1">
                    <p><b>Concluído:</b> aprovado; o corretor pode receber o certificado.</p>
                    <p><b>Reapresentar:</b> há ajustes técnicos; o corretor corrige e envia de novo.</p>
                    <p><b>Rejeitado:</b> não atende aos critérios principais.</p>
                </div>
            </div>
        </div>`,
        footer: final ? `
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
            <button class="btn btn-ghost" onclick="setPtamStatus('${p.id}', 'analyzing')"><i data-lucide="undo-2"></i> Reabrir análise</button>` : `
            <button class="btn btn-ghost mr-auto" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-danger" onclick="setPtamStatus('${p.id}', 'rejected')"><i data-lucide="circle-x"></i> Rejeitar</button>
            <button class="btn btn-warning" onclick="setPtamStatus('${p.id}', 'resubmit')"><i data-lucide="rotate-ccw"></i> Reapresentar</button>
            <button class="btn btn-success" onclick="setPtamStatus('${p.id}', 'completed')"><i data-lucide="circle-check"></i> Aprovar</button>`,
    });
}

function setPtamStatus(id, status) {
    const p = PTAM_QUEUE.find(x => x.id === id);
    if (!p || !PTAM_STATUS[status]) return;
    const noteEl = $('#ptam-note');
    const note = noteEl ? noteEl.value.trim() : p.note;
    if ((status === 'resubmit' || status === 'rejected') && !note) {
        $('#ptam-note-error').hidden = false;
        noteEl?.classList.add('is-invalid');
        noteEl?.focus();
        return;
    }
    p.status = status;
    p.note = status === 'analyzing' ? p.note : note;
    closeModal();
    showToast(`Parecer de ${p.corretor}: ${PTAM_STATUS[status].label}.`, status === 'rejected' ? 'warning' : 'success');

    if (p.corretor === STUDENT_NAME()) {
        pushNotif('corretor', { icon: PTAM_STATUS[status].icon, title: `PTAM: ${PTAM_STATUS[status].label}`, msg: note || p.document });
        if (status === 'completed') checkCompletion(p.courseId);
    }
    refresh();
}
