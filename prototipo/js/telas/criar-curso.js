/*
 * Criação de curso (D2 s15 a s18).
 */
'use strict';

/*
 * Três abas, como no slide: Estrutura · Inscrição e Participação · Certificado.
 * O curso criado entra no catálogo da sessão (em memória).
 */
const COURSE_DRAFT_EMPTY = () => ({
    tab: 'estrutura', title: '', type: 'padrao', category: 'Mercado', hours: 10,
    lessons: [{ title: '', quiz: true }],
    scope: 'Nacional', regional: 'SP', deadlineDays: 30, seats: 30,
    enrollFrom: '', enrollTo: '', classFrom: '', classTo: '',
    certText: Regras.TEXTO_CERTIFICADO_PADRAO,
});

function draftField(key, value) { STATE.courseDraft[key] = value; if (key === 'certText') updateCertPreview(); }
function draftLesson(i, key, value) { STATE.courseDraft.lessons[i][key] = value; }
function draftAddLesson() { STATE.courseDraft.lessons.push({ title: '', quiz: true }); renderView(); }
function draftRemoveLesson(i) { if (STATE.courseDraft.lessons.length > 1) { STATE.courseDraft.lessons.splice(i, 1); renderView(); } }
function draftTab(tab) { STATE.courseDraft.tab = tab; renderView(); }
function draftType(type) { STATE.courseDraft.type = type; STATE.courseDraft.scope = type === 'exclusivo' ? 'Regional' : 'Nacional'; renderView(); }
function draftInsertToken(token) {
    const ta = $('#cd-cert');
    if (!ta) return;
    const start = ta.selectionStart ?? ta.value.length;
    ta.value = ta.value.slice(0, start) + token + ta.value.slice(ta.selectionEnd ?? start);
    draftField('certText', ta.value);
    ta.focus(); ta.selectionStart = ta.selectionEnd = start + token.length;
}
function updateCertPreview() {
    const el = $('#cd-cert-preview');
    if (el) el.textContent = Regras.preencherCoringas(STATE.courseDraft.certText, { nome_curso: STATE.courseDraft.title || 'Nome do curso', dt_inicio_curso: '01/03/2027', dt_fim_curso: '31/03/2027' });
}

function viewCriarCurso() {
    const d = STATE.courseDraft;
    const excl = d.type === 'exclusivo';
    const tabs = [['estrutura', 'Estrutura'], ['inscricao', 'Inscrição e Participação'], ['certificado', 'Certificado']];
    const regionalSelect = (id, value, onchange) => `<select id="${id}" class="select" onchange="${onchange}">${REGIONAIS.map(r => `<option value="${r.sigla}" ${value === r.sigla ? 'selected' : ''}>CRECI-${r.sigla} · ${r.estado}</option>`).join('')}</select>`;
    let panel = '';
    if (d.tab === 'estrutura') {
        panel = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2"><label class="field-label" for="cd-title">Nome do curso <em>*</em></label>
                <input id="cd-title" class="input" value="${esc(d.title)}" placeholder="Ex.: Inteligência Artificial para Corretores" oninput="draftField('title', this.value)"><p class="field-error" id="cd-title-error" hidden></p></div>
            <div><label class="field-label" for="cd-type">Tipo de curso</label>
                <select id="cd-type" class="select" onchange="draftType(this.value)"><option value="padrao" ${!excl ? 'selected' : ''}>Padrão: disponível indefinidamente</option><option value="exclusivo" ${excl ? 'selected' : ''}>Exclusivo: turmas com datas e prova presencial</option></select></div>
            <div><label class="field-label" for="cd-hours">Carga horária (h)</label>
                <input id="cd-hours" class="input" type="number" min="1" value="${esc(d.hours)}" oninput="draftField('hours', Number(this.value))"></div>
        </div>
        <div class="label-mono mt-4 mb-2">Aulas <em class="text-danger">*</em></div>
        <div class="space-y-2">
            ${d.lessons.map((l, i) => `
            <div class="flex items-center gap-2">
                <span class="lesson-num">${i + 1}</span>
                <input class="input flex-1" aria-label="Título da aula ${i + 1}" value="${esc(l.title)}" placeholder="Título da aula" oninput="draftLesson(${i}, 'title', this.value)">
                <label class="check-chip" title="Exercício de múltipla escolha ao final da aula"><input type="checkbox" ${l.quiz ? 'checked' : ''} onchange="draftLesson(${i}, 'quiz', this.checked)"> <span>Exercício</span></label>
                <button class="icon-btn" aria-label="Remover aula ${i + 1}" onclick="draftRemoveLesson(${i})" ${d.lessons.length === 1 ? 'disabled' : ''}><i data-lucide="trash-2"></i></button>
            </div>`).join('')}
        </div>
        <p class="field-error" id="cd-lessons-error" hidden></p>
        <button class="btn btn-secondary btn-sm mt-3" onclick="draftAddLesson()"><i data-lucide="plus"></i> Adicionar aula</button>
        ${excl ? `<div class="alert alert-info mt-4"><i data-lucide="map-pin"></i><div>Curso Exclusivo inclui uma <b>prova final presencial</b>, agendada pela Regional. Ela será criada como última etapa.</div></div>` : ''}`;
    } else if (d.tab === 'inscricao') {
        panel = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${excl ? `
            <div><label class="field-label" for="cd-regional">Regional da turma</label>${regionalSelect('cd-regional', d.regional, "draftField('regional', this.value)")}</div>
            <div><label class="field-label" for="cd-seats">Vagas da turma</label><input id="cd-seats" class="input" type="number" min="1" value="${esc(d.seats)}" oninput="draftField('seats', Number(this.value))"></div>
            <div><label class="field-label" for="cd-ef">Inscrições de <em>*</em></label><input id="cd-ef" class="input" type="date" value="${esc(d.enrollFrom)}" onchange="draftField('enrollFrom', this.value)"></div>
            <div><label class="field-label" for="cd-et">Inscrições até <em>*</em></label><input id="cd-et" class="input" type="date" value="${esc(d.enrollTo)}" onchange="draftField('enrollTo', this.value)"></div>
            <div><label class="field-label" for="cd-cf">Início da turma <em>*</em></label><input id="cd-cf" class="input" type="date" value="${esc(d.classFrom)}" onchange="draftField('classFrom', this.value)"></div>
            <div><label class="field-label" for="cd-ct">Fim da turma <em>*</em></label><input id="cd-ct" class="input" type="date" value="${esc(d.classTo)}" onchange="draftField('classTo', this.value)"></div>` : `
            <div><label class="field-label" for="cd-scope">Abrangência</label>
                <select id="cd-scope" class="select" onchange="draftField('scope', this.value === 'Regional' ? 'SP' : 'Nacional'); renderView()"><option value="Nacional" ${d.scope === 'Nacional' ? 'selected' : ''}>Todo o Brasil</option><option value="Regional" ${d.scope !== 'Nacional' ? 'selected' : ''}>Apenas uma Regional</option></select></div>
            ${d.scope !== 'Nacional' ? `<div><label class="field-label" for="cd-regional">Regional</label>${regionalSelect('cd-regional', d.scope, "draftField('scope', this.value)")}</div>` : '<div></div>'}
            <div><label class="field-label" for="cd-deadline">Prazo de participação (dias) <em>*</em></label><input id="cd-deadline" class="input" type="number" min="1" value="${esc(d.deadlineDays)}" oninput="draftField('deadlineDays', Number(this.value))"><p class="field-hint">Contado a partir da inscrição.</p><p class="field-error" id="cd-deadline-error" hidden></p></div>
            <div><label class="field-label">Período de inscrição</label><p class="text-sm pt-2">A qualquer tempo</p></div>`}
        </div>
        <div class="label-mono mt-5 mb-2">Regras fixas da plataforma</div>
        <ul class="text-sm text-muted space-y-1" style="padding-left:1.1rem;list-style:disc">
            <li>Aula 1 no dia seguinte à inscrição; demais 24 horas após o exercício da anterior.</li>
            <li>Prazo de 48 horas para cada atividade.</li>
            <li>Aprovação com pelo menos 60% no resultado final.</li>
            <li>${excl ? 'Resultado final = nota da prova presencial.' : 'Resultado final = acertos em todos os exercícios ÷ total de questões.'}</li>
        </ul>
        <p class="field-error" id="cd-dates-error" hidden></p>`;
    } else {
        panel = `
        <label class="field-label" for="cd-cert">Texto do certificado</label>
        <textarea id="cd-cert" class="textarea" rows="4" oninput="draftField('certText', this.value)">${esc(d.certText)}</textarea>
        <p class="field-hint">Use os coringas para deixar o texto dinâmico:</p>
        <div class="flex flex-wrap gap-2 my-2">${['[nome_curso]', '[dt_inicio_curso]', '[dt_fim_curso]'].map(t => `<button type="button" class="btn btn-secondary btn-sm font-mono" onclick="draftInsertToken('${t}')">${t}</button>`).join('')}</div>
        <ul class="text-xs text-muted" style="padding-left:1.1rem;list-style:disc"><li><b>[nome_curso]</b>: nome completo do curso</li><li><b>[dt_inicio_curso]</b>: data de início do curso</li><li><b>[dt_fim_curso]</b>: data de término do curso</li></ul>
        <div class="label-mono mt-4 mb-1">Pré-visualização</div>
        <p id="cd-cert-preview" class="panel panel-body text-sm" style="box-shadow:none"></p>`;
    }

    return `
    ${pageHeader({ icon: 'plus-circle', crumb: 'Gestão / Criar Curso', title: 'Criar Curso', subtitle: 'Cadastre a estrutura, as regras de participação e o texto do certificado.' })}
    <div class="panel">
        <div class="tabs" role="tablist" aria-label="Etapas da criação do curso">
            ${tabs.map(([k, label]) => `<button role="tab" class="tab ${d.tab === k ? 'active' : ''}" aria-selected="${d.tab === k}" onclick="draftTab('${k}')">${label}</button>`).join('')}
        </div>
        <div class="panel-body" role="tabpanel">${panel}</div>
        <div class="flex justify-end gap-2 p-4 border-t border-line">
            <button class="btn btn-ghost" onclick="STATE.courseDraft = COURSE_DRAFT_EMPTY(); renderView()">Limpar</button>
            <button class="btn btn-primary" onclick="saveCourse()"><i data-lucide="check"></i> Criar curso</button>
        </div>
    </div>`;
}

function saveCourse() {
    const d = STATE.courseDraft;
    const errors = Regras.validarCurso({
        titulo: d.title, tipo: d.type, aulas: d.lessons.map(l => l.title), prazoDias: d.deadlineDays,
        inscricaoDe: d.enrollFrom, inscricaoAte: d.enrollTo, turmaDe: d.classFrom, turmaAte: d.classTo, vagas: d.seats,
    });
    if (errors.length) {
        // abre a aba que contém o primeiro erro
        draftTab(errors[0].aba);
        STATE.courseDraft.tab = errors[0].aba;
        showToast(errors[0].mensagem, 'error');
        return;
    }
    const excl = d.type === 'exclusivo';
    const lessons = d.lessons.map((l, i) => L(`l${i + 1}`, l.title.trim(), '30min', l.quiz));
    if (excl) lessons.push(L(`l${lessons.length + 1}`, 'Prova presencial', '2h', false, 'presencial'));
    const edition = excl ? `Turma ${d.regional} ${d.classFrom.slice(0, 4)}` : `Edição ${1 + COURSES.length}`;
    const course = {
        id: `n${Date.now()}`, title: d.title.trim(), type: d.type, category: d.category, icon: excl ? 'graduation-cap' : 'book-open',
        hours: d.hours || 1, modality: excl ? 'EAD + Presencial' : 'Online', edition,
        description: 'Curso criado no protótipo.', lessons, certText: d.certText,
        ...(excl ? { regional: d.regional, seats: d.seats, seatsTaken: 0, requiresExam: true, requiresPtam: false, classFrom: d.classFrom, classTo: d.classTo }
                 : { scope: d.scope, deadlineDays: d.deadlineDays }),
    };
    COURSES.push(course);
    STATE.courseDraft = COURSE_DRAFT_EMPTY();
    showToast(`Curso "${course.title}" criado e já aparece em Todos os Cursos.`, 'success');
    switchView('catalogo');
}
