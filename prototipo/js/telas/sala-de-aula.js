/*
 * Sala de aula: lista de aulas, vídeo, exercícios, prova presencial e envio do PTAM.
 */
'use strict';

function openClassroom(courseId, review = false) {
    const course = courseById(courseId);
    if (!course) return showToast('Curso não encontrado.', 'error');
    if (!review && !isEnrolled(courseId)) {
        if (isCompleted(courseId)) review = true;
        else return showToast('Inscreva-se no curso para acessar as aulas.', 'warning');
    }
    STATE.classroom = { courseId, review, lessonIdx: null, watched: false, answers: {}, result: null, slot: null };
    renderClassroom();
}

function renderClassroom() {
    const cr = STATE.classroom;
    if (!cr) return;
    const course = courseById(cr.courseId);
    if (!course) return closeModal();
    if (cr.lessonIdx === null) renderClassroomList(course);
    else renderLesson(course, cr.lessonIdx);
}

function renderClassroomList(course) {
    const cr = STATE.classroom;
    const excl = course.type === 'exclusivo';
    const prog = courseProgress(course);

    const lessonsHTML = course.lessons.map((lesson, idx) => {
        const st = cr.review ? { key: 'review' } : lessonState(course, idx);
        const clickable = cr.review || ['available', 'done', 'scheduled', 'failed'].includes(st.key);
        const cls = { done: 'is-done', locked: 'is-locked', scheduled: 'is-scheduled' }[st.key] || '';
        const numIcon = st.key === 'done' ? '<i data-lucide="check"></i>' : st.key === 'locked' ? '<i data-lucide="lock"></i>' : lesson.type === 'presencial' ? '<i data-lucide="map-pin"></i>' : String(idx + 1);
        const meta = [
            lesson.type === 'presencial' ? 'Presencial' : 'Vídeo',
            lesson.duration,
            lesson.quiz ? 'Exercício (conta para a nota final)' : '',
            st.score != null && lesson.type !== 'presencial' ? `Nota ${st.score}%` : '',
            st.score != null && lesson.type === 'presencial' ? `Nota ${st.score.toFixed(1)}` : '',
        ].filter(Boolean).join(' · ');
        const right = st.key === 'locked' ? `<span class="text-[11px] text-muted text-right">${esc(st.reason)}</span>`
            : st.key === 'scheduled' ? `<span class="badge badge-gold">${esc(st.reason.replace('Prova agendada: ', ''))}</span>`
            : st.key === 'failed' ? `<span class="badge badge-danger">Reprovado</span>`
            : st.key === 'done' ? `<span class="badge badge-success">Concluída</span>`
            : st.key === 'available' ? `<i data-lucide="chevron-right" class="text-muted" style="width:16px;height:16px"></i>` : '';
        const tag = clickable ? 'button' : 'div';
        return `
        <${tag} class="lesson ${cls}" ${clickable ? `onclick="openLesson(${idx})"` : 'aria-disabled="true"'}>
            <span class="lesson-num">${numIcon}</span>
            <span class="flex-1 min-w-0">
                <span class="block text-sm font-semibold">${esc(lesson.title)}</span>
                <span class="block text-[11px] text-muted mt-0.5">${meta}</span>
            </span>
            ${right}
        </${tag}>`;
    }).join('');

    const body = `
        <div class="flex flex-wrap items-center gap-2 mb-2">
            <span class="badge ${excl ? 'badge-gold' : 'badge-primary'}">${excl ? 'Exclusivo' : 'Padrão'}</span>
            <span class="text-xs text-muted">${esc(course.edition)} · ${course.hours}h · ${esc(course.modality)}</span>
        </div>
        <p class="text-sm text-muted mb-4">${esc(course.description)}</p>

        ${cr.review ? `
        <div class="alert alert-success mb-4"><i data-lucide="eye"></i><div><b>Modo consulta.</b> ${isCompleted(course.id) ? `Curso concluído em ${esc(PROGRESS.completed[course.id].date)}. O conteúdo continua aberto, mas não é possível se inscrever de novo.` : 'Visualização do conteúdo, sem registrar progresso.'}</div></div>` : `
        <div class="flex flex-wrap items-center gap-3 mb-4">
            <div class="progress flex-1 ${excl ? 'gold' : ''}" style="min-width:160px"><span style="width:${prog.pct}%"></span></div>
            <span class="font-mono text-xs font-bold">${prog.done}/${prog.total} aulas</span>
        </div>
        <div class="alert alert-info mb-4"><i data-lucide="calendar-days"></i><div class="flex-1">A Aula 1 abre no dia seguinte à inscrição. As demais abrem 24 horas depois de você fazer o exercício da anterior. Hoje (simulado): <b class="font-mono">${todayStr()}</b>.</div><button class="btn btn-secondary btn-sm" onclick="advanceDay()"><i data-lucide="calendar-plus"></i> +1 dia</button></div>`}

        <div class="label-mono mb-2">Aulas</div>
        <div class="space-y-2">${lessonsHTML}</div>
        ${course.requiresPtam && !cr.review ? ptamSection(course) : ''}`;

    openModal({
        title: course.title,
        icon: course.icon,
        size: 'lg',
        body,
        footer: `<button class="btn btn-secondary" onclick="closeModal()">Fechar</button>`,
    });
}

function openLesson(idx) {
    const cr = STATE.classroom;
    if (!cr) return;
    const course = courseById(cr.courseId);
    if (!cr.review) {
        const st = lessonState(course, idx);
        if (st.key === 'locked') return showToast(st.reason, 'warning');
    }
    const lp = (PROGRESS.enrollments[cr.courseId]?.lessons || {})[course.lessons[idx].id] || {};
    Object.assign(cr, { lessonIdx: idx, watched: !!lp.done || !!lp.watched, answers: {}, result: null, slot: null });
    renderClassroom();
    $('#modal-body').scrollTop = 0;
}

function backToLessons() {
    if (!STATE.classroom) return;
    STATE.classroom.lessonIdx = null;
    renderClassroom();
    $('#modal-body').scrollTop = 0;
}

function quizFor(courseId, idx) {
    const start = hashStr(`${courseId}-${idx}`) % QUESTION_BANK.length;
    return [0, 2, 4].map(k => QUESTION_BANK[(start + k) % QUESTION_BANK.length]);
}

function renderLesson(course, idx) {
    const cr = STATE.classroom;
    const lesson = course.lessons[idx];
    const st = cr.review ? { key: 'review' } : lessonState(course, idx);
    let content = '';

    if (lesson.type === 'presencial') {
        content = examSection(course, st);
    } else {
        content = `
        <div class="video-mock mb-4">
            <div class="video-play"><i data-lucide="play"></i></div>
            <div class="video-bar"><span>${cr.watched || st.key === 'done' ? lesson.duration : '00:00'}</span><div class="progress"><span style="width:${cr.watched || st.key === 'done' ? 100 : 0}%;background:#fff"></span></div><span>${lesson.duration}</span></div>
        </div>`;

        if (cr.review) {
            content += `<div class="alert alert-success"><i data-lucide="eye"></i><div>Conteúdo aberto para consulta.</div></div>`;
        } else if (cr.result && lesson.quiz) {
            content += quizSection(course, idx); // mostra o gabarito logo após o envio
        } else if (st.key === 'done') {
            content += `<div class="alert alert-success"><i data-lucide="circle-check"></i><div>Aula concluída${st.score != null ? ` com nota <b>${st.score}%</b>` : ''}.</div></div>`;
        } else if (!cr.watched) {
            content += `<button class="btn btn-primary" onclick="markWatched()"><i data-lucide="circle-play"></i> Marcar vídeo como assistido</button>
                        <p class="text-xs text-muted mt-2">No protótipo, o vídeo é simulado.</p>`;
        } else if (!lesson.quiz) {
            content += `<button class="btn btn-success" onclick="completeLesson()"><i data-lucide="check"></i> Concluir aula</button>`;
        } else {
            content += quizSection(course, idx);
        }
    }

    openModal({
        title: course.title,
        icon: course.icon,
        size: 'lg',
        body: `
            <button class="btn btn-ghost btn-sm mb-3" onclick="backToLessons()"><i data-lucide="arrow-left"></i> Voltar às aulas</button>
            <div class="label-mono">Aula ${idx + 1} de ${course.lessons.length} · ${lesson.type === 'presencial' ? 'Presencial' : 'Vídeo'} · ${lesson.duration}</div>
            <h3 class="text-lg font-bold mt-1 mb-4">${esc(lesson.title)}</h3>
            ${content}`,
        footer: `<button class="btn btn-secondary" onclick="closeModal()">Fechar</button>`,
    });
}

function quizSection(course, idx) {
    const cr = STATE.classroom;
    const questions = quizFor(course.id, idx);
    const res = cr.result;
    return `
    <div class="section-title" style="margin-top:.5rem">Exercício do dia</div>
    <form id="quiz-form" class="space-y-3" onsubmit="submitQuiz(event)">
        ${questions.map((q, qi) => `
        <fieldset class="quiz-q">
            <legend class="text-sm font-semibold mb-2">${qi + 1}. ${esc(q.q)}</legend>
            ${q.options.map((opt, oi) => {
                let cls = '';
                if (res) { if (oi === q.answer) cls = 'correct'; else if (cr.answers[qi] === oi) cls = 'wrong'; }
                return `<label class="quiz-opt ${cls}"><input type="radio" name="q${qi}" value="${oi}" ${cr.answers[qi] === oi ? 'checked' : ''} ${res ? 'disabled' : ''} onchange="setAnswer(${qi}, ${oi})"> ${esc(opt)}</label>`;
            }).join('')}
        </fieldset>`).join('')}
        ${res ? `
            <div class="alert alert-info">
                <i data-lucide="clipboard-check"></i>
                <div class="flex-1">Você acertou <b>${res.correct} de ${res.total}</b> (${res.score}%). Esse resultado entra na nota final do curso (mínimo de 60% no total). A próxima aula abre 24 horas depois.</div>
            </div>
            <div class="flex gap-2">
                <button type="button" class="btn btn-primary" onclick="backToLessons()"><i data-lucide="list"></i> Voltar às aulas</button>
            </div>` : `
            <button type="submit" class="btn btn-primary"><i data-lucide="send"></i> Enviar respostas</button>`}
    </form>`;
}

function markWatched() {
    const cr = STATE.classroom;
    if (!cr) return;
    cr.watched = true;
    const course = courseById(cr.courseId);
    const enr = PROGRESS.enrollments[cr.courseId];
    if (enr) {
        const id = course.lessons[cr.lessonIdx].id;
        enr.lessons[id] = { ...(enr.lessons[id] || {}), watched: true };
    }
    renderClassroom();
}

function setAnswer(qi, oi) {
    if (STATE.classroom) STATE.classroom.answers[qi] = oi;
}

function submitQuiz(event) {
    if (event) event.preventDefault();
    const cr = STATE.classroom;
    if (!cr) return;
    const course = courseById(cr.courseId);
    const lesson = course.lessons[cr.lessonIdx];
    const questions = quizFor(course.id, cr.lessonIdx);
    if (questions.some((_, qi) => cr.answers[qi] === undefined)) return showToast('Responda todas as perguntas antes de enviar.', 'warning');

    const lp0 = (PROGRESS.enrollments[course.id]?.lessons || {})[lesson.id] || {};
    if (lp0.done) return showToast('Este exercício já foi enviado e não pode ser refeito.', 'info');
    const correct = questions.filter((q, qi) => cr.answers[qi] === q.answer).length;
    const score = Regras.percentual(correct, questions.length);
    cr.result = { score, correct, total: questions.length };

    const enr = PROGRESS.enrollments[course.id];
    if (enr) {
        enr.lessons[lesson.id] = { ...(enr.lessons[lesson.id] || {}), score, correct, total: questions.length, done: true, doneDay: PROGRESS.simDay };
    }
    showToast(`Exercício enviado: ${correct} de ${questions.length} (${score}%).`, 'info');
    checkCompletion(course.id);

    // Aprovado ou reprovado encerra a inscrição: fecha a sala de aula
    if (!isEnrolled(course.id)) { closeModal(); refresh(); return; }
    renderClassroom();
    refresh();
}

function completeLesson() {
    const cr = STATE.classroom;
    if (!cr) return;
    const course = courseById(cr.courseId);
    const lesson = course.lessons[cr.lessonIdx];
    const enr = PROGRESS.enrollments[course.id];
    if (!enr) return;
    enr.lessons[lesson.id] = { ...(enr.lessons[lesson.id] || {}), done: true, score: null, doneDay: PROGRESS.simDay };
    showToast(`Aula "${lesson.title}" concluída.`, 'success');
    checkCompletion(course.id);
    if (!isEnrolled(course.id)) { closeModal(); refresh(); return; }
    cr.lessonIdx = null;
    renderClassroom();
    refresh();
}

/* Prova presencial */
function examSlots(course) {
    const place = `Sede CRECI-${course.regional}`;
    return [3, 5, 8].map(d => ({ date: `${fmtDay(PROGRESS.simDay + d)}, 09:00`, place }));
}

function examSection(course, st) {
    const cr = STATE.classroom;
    const exam = PROGRESS.exams[course.id];
    const header = `
        <div class="alert alert-info mb-4"><i data-lucide="map-pin"></i><div>A prova presencial é agendada pela Regional. A nota é lançada pela administração (importação de planilha) e precisa ser <b>6,0 ou mais</b>. Abaixo disso, você perde o acesso a esta turma.</div></div>`;

    if (cr.review) return header;
    if (exam && exam.score != null) {
        return header + (exam.score >= 6
            ? `<div class="alert alert-success"><i data-lucide="circle-check"></i><div>Prova realizada em ${esc(exam.date)}. Nota <b>${exam.score.toFixed(1)}</b>, aprovado.</div></div>`
            : `<div class="alert alert-danger"><i data-lucide="circle-x"></i><div>Nota <b>${exam.score.toFixed(1)}</b>, abaixo do mínimo. Procure a Regional para fazer a prova de novo.</div></div>`);
    }
    const slots = examSlots(course);
    const selected = cr.slot ?? (exam ? slots.findIndex(s => s.date === exam.date) : null);
    return header + `
        ${exam ? `<div class="alert alert-warning mb-3"><i data-lucide="calendar-check"></i><div>Agendada para <b>${esc(exam.date)}</b> na ${esc(exam.place)}. Você pode remarcar até a véspera.</div></div>` : ''}
        <div class="label-mono mb-2">${exam ? 'Remarcar para' : 'Escolha uma data'}</div>
        <div class="space-y-2 mb-4">
            ${slots.map((s, i) => `
            <label class="slot"><input type="radio" name="exam-slot" ${selected === i ? 'checked' : ''} onchange="STATE.classroom.slot = ${i}">
                <span class="flex-1"><b>${esc(s.date)}</b><span class="block text-xs text-muted">${esc(s.place)}</span></span>
                <i data-lucide="calendar" class="text-muted" style="width:16px;height:16px"></i>
            </label>`).join('')}
        </div>
        <button class="btn btn-primary" onclick="confirmExamSlot()"><i data-lucide="calendar-check"></i> ${exam ? 'Remarcar prova' : 'Confirmar agendamento'}</button>`;
}

function confirmExamSlot() {
    const cr = STATE.classroom;
    if (!cr) return;
    const course = courseById(cr.courseId);
    if (cr.slot === null || cr.slot === undefined || cr.slot < 0) {
        return showToast(PROGRESS.exams[course.id] ? 'Selecione uma nova data para remarcar.' : 'Escolha uma data para a prova.', 'warning');
    }
    const slot = examSlots(course)[cr.slot];
    PROGRESS.exams[course.id] = { date: slot.date, place: slot.place, score: null };
    showToast(`Prova presencial agendada para ${slot.date}.`, 'success');
    pushNotif('admin_master', { icon: 'calendar-check', title: 'Prova agendada', msg: `${STUDENT_NAME()}: ${course.title} em ${slot.date}.` });
    cr.slot = null;
    renderClassroom();
    refresh();
}

/* PTAM (corretor) */
function studentPtam(courseId) {
    return PTAM_QUEUE.find(p => p.courseId === courseId && p.corretor === STUDENT_NAME());
}

function ptamSection(course) {
    const p = studentPtam(course.id);
    const canUpload = !p || p.status === 'resubmit';
    const st = p ? PTAM_STATUS[p.status] : null;
    return `
    <div class="section-title">Envio do PTAM (PDF)</div>
    ${p ? `
    <div class="panel mb-3" style="box-shadow:none">
        <div class="panel-body flex flex-wrap items-center gap-3">
            <i data-lucide="file-text" class="text-danger" style="width:22px;height:22px"></i>
            <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm truncate">${esc(p.document)}</div>
                <div class="text-xs text-muted">Enviado em ${esc(p.submittedAt)}</div>
            </div>
            <span class="badge ${st.badge}"><i data-lucide="${st.icon}"></i> ${st.label}</span>
        </div>
        ${p.note ? `<div class="px-4 pb-4 text-xs"><span class="label-mono">Comentário do avaliador</span><p class="mt-1">${esc(p.note)}</p></div>` : ''}
    </div>` : ''}
    ${canUpload ? `
    <label class="dropzone">
        <input type="file" accept="application/pdf,.pdf" class="sr-only" onchange="handlePtamFile(this, '${course.id}')">
        <i data-lucide="upload-cloud"></i>
        <span class="block text-sm font-semibold">${p ? 'Enviar PTAM corrigido' : 'Selecionar arquivo PDF'}</span>
        <span class="block text-xs text-muted mt-1">Apenas .pdf, até 10 MB</span>
    </label>` : p.status === 'rejected'
        ? `<p class="text-xs text-muted">Parecer rejeitado. Não é possível reenviar nesta turma; procure a sua Regional.</p>`
        : `<p class="text-xs text-muted">${p.status === 'completed' ? 'Parecer aprovado.' : 'Aguarde a análise. Você será avisado quando o status mudar.'}</p>`}`;
}

function handlePtamFile(input, courseId) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPdf) return showToast('Envie o PTAM em formato PDF.', 'error');
    if (file.size > 10 * 1024 * 1024) return showToast('O arquivo passa de 10 MB.', 'error');

    const course = courseById(courseId);
    let p = studentPtam(courseId);
    if (p && p.status !== 'resubmit') return showToast('Já existe um PTAM em análise para este curso.', 'warning');

    if (p) {
        Object.assign(p, { document: file.name, submittedAt: todayStr(), status: 'analyzing', note: '' });
    } else {
        p = { id: `p${Date.now()}`, courseId, corretor: STUDENT_NAME(), creci: `CRECI-${course.regional} ${USERS.corretor.creci}`, regional: course.regional, document: file.name, submittedAt: todayStr(), status: 'analyzing', note: '' };
        PTAM_QUEUE.unshift(p);
    }
    ['admin_regional', 'admin_master'].forEach(prof => pushNotif(prof, { icon: 'inbox', title: 'Novo PTAM na fila', msg: `${STUDENT_NAME()} enviou ${file.name}.` }));
    showToast(`"${file.name}" enviado. Status: Em análise.`, 'success');
    renderClassroom();
    refresh();
}
