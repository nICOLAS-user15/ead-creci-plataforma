/*
 * Importação de notas da prova presencial por planilha (Administrador Master).
 */
'use strict';

function viewNotas() {
    const prev = STATE.importPreview;
    return `
    ${pageHeader({
        icon: 'file-spreadsheet',
        crumb: 'Gestão / Notas presenciais',
        title: 'Importar notas das provas',
        subtitle: 'Lance em lote as notas das provas presenciais a partir de uma planilha .xlsx.',
        actions: `<button class="btn btn-secondary" onclick="downloadTemplate()"><i data-lucide="download"></i> Baixar modelo</button>`,
    })}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="panel">
            <div class="panel-head"><span class="panel-head-icon"><i data-lucide="upload"></i></span><div><div class="panel-title">Enviar planilha</div><div class="panel-sub">Colunas: CRECI, Nome, Turma, Nota</div></div></div>
            <div class="panel-body">
                <label class="dropzone">
                    <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="sr-only" onchange="handleXlsx(this)">
                    <i data-lucide="file-spreadsheet"></i>
                    <span class="block text-sm font-semibold">Selecionar arquivo .xlsx</span>
                    <span class="block text-xs text-muted mt-1">A leitura é simulada no protótipo</span>
                </label>
                <button class="btn btn-ghost btn-sm btn-block mt-3" onclick="simulateXlsx()"><i data-lucide="flask-conical"></i> Usar planilha de exemplo</button>
            </div>
        </div>

        <div class="panel lg:col-span-2">
            <div class="panel-head"><span class="panel-head-icon"><i data-lucide="table"></i></span><div><div class="panel-title">Pré-visualização</div><div class="panel-sub">${prev ? `${esc(prev.file)} · ${prev.rows.length} linhas` : 'Nenhum arquivo carregado'}</div></div></div>
            ${prev ? `
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Corretor</th><th>Turma</th><th>Nota</th><th>Resultado</th></tr></thead>
                    <tbody>
                        ${prev.rows.map(r => `
                        <tr>
                            <td><div class="font-semibold">${esc(r.name)}</div><div class="text-[11px] text-muted font-mono">${esc(r.creci)}</div></td>
                            <td class="text-sm">${esc(r.turma)}</td>
                            <td class="font-mono font-bold">${r.score.toFixed(1)}</td>
                            <td><span class="badge ${Regras.aprovadoExclusivo(r.score) ? 'badge-success' : 'badge-danger'}">${Regras.aprovadoExclusivo(r.score) ? 'Aprovado' : 'Reprovado'}</span></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div class="flex justify-end gap-2 p-4 border-t border-line">
                <button class="btn btn-ghost" onclick="STATE.importPreview = null; refresh()">Descartar</button>
                <button class="btn btn-primary" onclick="confirmImport()"><i data-lucide="check"></i> Confirmar importação</button>
            </div>` : emptyState('table', 'Envie uma planilha', 'As notas aparecem aqui para conferência antes de serem gravadas.')}
        </div>
    </div>

    <div class="section-title">Importações anteriores</div>
    <div class="panel">
        ${STATE.importHistory.length ? `
        <div class="table-wrap"><table class="table">
            <thead><tr><th>Arquivo</th><th>Data</th><th>Linhas</th><th>Aprovados</th></tr></thead>
            <tbody>${STATE.importHistory.map(h => `<tr><td>${esc(h.file)}</td><td class="font-mono text-xs">${esc(h.date)}</td><td>${h.rows}</td><td>${h.approved}</td></tr>`).join('')}</tbody>
        </table></div>` : emptyState('history', 'Nenhuma importação nesta sessão', 'O histórico aparece aqui.')}
    </div>`;
}

function downloadTemplate() {
    const csv = 'CRECI;Nome;Turma;Nota\nCRECI-SP 123456-F;Fulano de Tal;Turma SP 2026.2;8,5\n';
    try {
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'modelo-notas-presenciais.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        showToast('Modelo baixado (CSV de exemplo).', 'success');
    } catch (e) {
        showToast('Não foi possível gerar o modelo neste navegador.', 'error');
    }
}

function handleXlsx(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) return showToast('Envie uma planilha no formato .xlsx.', 'error');
    buildImportPreview(file.name);
}

function simulateXlsx() { buildImportPreview('notas_presenciais_exemplo.xlsx'); }

function buildImportPreview(fileName) {
    const rows = [];
    // Provas agendadas pelo corretor de demonstração entram na planilha
    Object.entries(PROGRESS.exams).forEach(([courseId, exam]) => {
        if (exam.score != null) return;
        const c = courseById(courseId);
        rows.push({ courseId, student: true, name: STUDENT_NAME(), creci: `CRECI-${c.regional} ${USERS.corretor.creci}`, turma: c.edition, score: 8.5 });
    });
    rows.push(
        { name: 'João da Silva', creci: 'CRECI-SP 123987-F', turma: 'Turma SP 2026.2', score: 7.5 },
        { name: 'Maria Fernandes', creci: 'CRECI-SP 789012-F', turma: 'Turma SP 2026.2', score: 5.0 },
        { name: 'Ana Beatriz Costa', creci: 'CRECI-RJ 112233-F', turma: 'Turma RJ 2026.2', score: 9.0 },
        { name: 'Roberto Mendes', creci: 'CRECI-MG 556677-F', turma: 'Turma MG 2026.2', score: 6.5 },
    );
    STATE.importPreview = { file: fileName, rows };
    const hasStudent = rows.some(r => r.student);
    showToast(hasStudent ? `Planilha lida: ${rows.length} linhas, incluindo a prova de ${STUDENT_NAME()}.` : `Planilha lida: ${rows.length} linhas.`, 'info');
    refresh();
}

function confirmImport() {
    const prev = STATE.importPreview;
    if (!prev) return;
    prev.rows.filter(r => r.student).forEach(r => {
        const exam = PROGRESS.exams[r.courseId];
        if (!exam) return;
        exam.score = r.score;
        const course = courseById(r.courseId);
        const enr = PROGRESS.enrollments[r.courseId];
        const presencial = course.lessons.find(l => l.type === 'presencial');
        if (enr && presencial && Regras.aprovadoExclusivo(r.score)) enr.lessons[presencial.id] = { done: true, score: r.score, doneDay: PROGRESS.simDay };
        pushNotif('corretor', { icon: 'clipboard-check', title: 'Nota da prova lançada', msg: `${course.title}: ${r.score.toFixed(1)}.` });
        checkCompletion(r.courseId);
    });
    STATE.importHistory.unshift({ file: prev.file, date: todayStr(), rows: prev.rows.length, approved: prev.rows.filter(r => Regras.aprovadoExclusivo(r.score)).length });
    STATE.importPreview = null;
    showToast(`${prev.rows.length} notas importadas.`, 'success');
    refresh();
}
