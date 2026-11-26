/*
 * Inscrição, progresso, liberação de aulas, aprovação e reprovação.
 * As decisões ficam em regras.js; aqui fica a ligação com o estado e a tela.
 */
'use strict';

function isCompleted(courseId) { return !!PROGRESS.completed[courseId]; }
function isEnrolled(courseId) { return !!PROGRESS.enrollments[courseId]; }
function wasFailed(courseId) { return PROGRESS.history.some(h => h.courseId === courseId && h.result === 'reprovado'); }

function courseStatus(courseId) {
    if (isCompleted(courseId)) return 'completed';
    if (isEnrolled(courseId)) return 'enrolled';
    return 'available';
}

// Cursos que o perfil enxerga no catálogo
function visibleCourses() {
    if (can('all_regions')) return COURSES;
    return COURSES.filter(c =>
        c.type === 'exclusivo' ? c.regional === STATE.regional : (c.scope === 'Nacional' || c.scope === STATE.regional));
}

// RN-07: prazo de participação do curso Padrão (dias a partir da inscrição). Padrão do protótipo: 30.
function courseDeadlineDays(course) { return course.deadlineDays ?? 30; }
function courseDeadlineDay(course, enr) { return Regras.diaLimiteCurso(enr.enrolledDay, courseDeadlineDays(course)); }

// Acertos e total de questões de TODOS os exercícios do curso (RN-09). Só o Padrão usa isso no resultado.
function courseTotals(course, enr) {
    let acertos = 0, totalQuestoes = 0;
    course.lessons.forEach(l => {
        if (l.type === 'presencial' || !l.quiz) return;
        totalQuestoes += Regras.QUESTOES_POR_EXERCICIO;
        acertos += ((enr.lessons[l.id] || {}).correct) || 0;
    });
    return { acertos, totalQuestoes };
}

// RN-04: dia da liberação de cada aula, calculado em regras.js
function lessonRelease(courseId, idx) {
    const enr = PROGRESS.enrollments[courseId];
    if (!enr) return Infinity;
    const course = courseById(courseId);
    const aulas = course.lessons.map(l => {
        const lp = enr.lessons[l.id] || {};
        return { concluidaDia: lp.done ? (lp.doneDay ?? enr.enrolledDay) : null };
    });
    return Regras.diaLiberacaoAula(idx, enr.enrolledDay, aulas);
}

function lessonState(course, idx) {
    const lesson = course.lessons[idx];
    if (isCompleted(course.id)) return { key: 'done' };
    const enr = PROGRESS.enrollments[course.id];
    if (!enr) return { key: 'locked', reason: 'Inscrição necessária' };
    const lp = enr.lessons[lesson.id] || {};
    if (lp.done) return { key: 'done', score: lp.score };

    const release = lessonRelease(course.id, idx);
    if (release === Infinity) return { key: 'locked', reason: 'Conclua a aula anterior' };
    if (PROGRESS.simDay < release) {
        const diff = release - PROGRESS.simDay;
        return { key: 'locked', reason: diff === 1 ? `Libera amanhã (${fmtDay(release)})` : `Libera em ${fmtDay(release)}` };
    }
    if (lesson.type === 'presencial') {
        const exam = PROGRESS.exams[course.id];
        if (exam && exam.score != null) return Regras.aprovadoExclusivo(exam.score) ? { key: 'done', score: exam.score } : { key: 'failed', reason: `Nota ${exam.score.toFixed(1)}: abaixo de 6,0` };
        if (exam) return { key: 'scheduled', reason: `Prova agendada: ${exam.date}` };
        return { key: 'available', reason: 'Agende a prova presencial' };
    }
    return { key: 'available', score: lp.score };
}

function courseProgress(course) {
    const total = course.lessons.length;
    if (isCompleted(course.id)) return { done: total, total, pct: 100 };
    const enr = PROGRESS.enrollments[course.id];
    const done = enr ? course.lessons.filter(l => (enr.lessons[l.id] || {}).done).length : 0;
    return { done, total, pct: Math.round(done / total * 100) };
}

function nextLessonInfo(course) {
    for (let i = 0; i < course.lessons.length; i++) {
        const st = lessonState(course, i);
        if (st.key !== 'done') return { idx: i, lesson: course.lessons[i], state: st };
    }
    return null;
}

/* Inscrição (RF-11, RF-12): o aluno lê os Termos de Participação e aceita. */
function enrollCourse(courseId) {
    const course = courseById(courseId);
    if (!course) return;
    if (isEnrolled(courseId)) return openClassroom(courseId);
    const check = Regras.podeInscrever({
        tipo: course.type, aprovado: isCompleted(courseId),
        inscritoAgora: isEnrolled(courseId), reprovadoNestaTurma: wasFailed(courseId),
    });
    if (!check.ok) {
        const msg = {
            'ja-aprovado': 'Você já foi aprovado neste curso. Não é possível se inscrever de novo, mas o conteúdo continua disponível para consulta.',
            'reprovado-nesta-turma': 'Você foi reprovado nesta turma e perdeu o acesso. Aguarde uma nova turma.',
        }[check.motivo] || 'Inscrição indisponível.';
        return showToast(msg, 'warning');
    }
    if (course.type === 'exclusivo') {
        if (course.regional !== STATE.regional) return showToast(`Turma exclusiva da CRECI-${course.regional}. Ela não está disponível para a sua Regional.`, 'error');
        if (course.seatsTaken >= course.seats) return showToast('A turma está lotada. Aguarde a abertura de uma nova turma.', 'warning');
    }
    openTermsModal(courseId);
}

function openTermsModal(courseId) {
    const course = courseById(courseId);
    const excl = course.type === 'exclusivo';
    const n = course.lessons.filter(l => l.type !== 'presencial').length;
    const desc = excl
        ? `O curso é composto por ${n} aulas on-line e uma prova final presencial. Cada aula contém um exercício que deve ser realizado para ter acesso à aula seguinte.`
        : `O curso é composto por ${n} aulas. Cada aula contém um exercício que deve ser realizado para ter acesso à aula seguinte. A aula seguinte será disponibilizada após 24 horas da realização do exercício da aula anterior. O curso tem prazo de participação de <b>${courseDeadlineDays(course)} dias</b> contados a partir da data de inscrição.`;
    const terms = excl
        ? [`A PROVA FINAL será realizada na sede da CRECI-${esc(course.regional)}, em data e local a serem definidos pela Regional.`,
           'Se reprovado, o aluno perde o acesso ao conteúdo do curso nesta turma.',
           'Se aprovado, o certificado é disponibilizado após o lançamento da nota e o aluno continua com acesso ao conteúdo.']
        : ['Quando o prazo do curso encerrar, o sistema analisará o aproveitamento do aluno e determinará sua aprovação ou reprovação (mínimo de 60%).',
           'Se reprovado, o aluno perde o acesso ao conteúdo do curso e poderá realizar nova inscrição.',
           'Se aprovado, o certificado é disponibilizado e o aluno continua tendo acesso ao conteúdo do curso.'];
    openModal({
        title: course.title,
        icon: course.icon,
        size: 'lg',
        body: `
        <div class="label-mono mb-1">Descrição do curso</div>
        <p class="text-sm mb-4">${desc}</p>
        <div class="label-mono mb-1">Termos de participação</div>
        <p class="text-sm text-muted mb-2">Sua inscrição neste curso declara seu aceite aos seguintes termos.</p>
        <ul class="text-sm space-y-1 mb-4" style="padding-left:1.1rem;list-style:disc">${terms.map(t => `<li>${t}</li>`).join('')}</ul>
        <label class="flex items-start gap-2 text-sm font-semibold cursor-pointer">
            <input type="checkbox" id="terms-check" style="margin-top:.2rem" onchange="$('#terms-confirm').disabled = !this.checked">
            <span>Aceito os termos e quero me inscrever neste curso</span>
        </label>`,
        footer: `<button class="btn btn-ghost mr-auto" onclick="closeModal()">Voltar</button>
                 <button class="btn btn-primary" id="terms-confirm" disabled onclick="confirmEnroll('${course.id}')"><i data-lucide="check"></i> Inscrever-se</button>`,
    });
}

function confirmEnroll(courseId) {
    const course = courseById(courseId);
    if (!course || !$('#terms-check')?.checked) return;
    if (course.type === 'exclusivo') course.seatsTaken += 1;
    PROGRESS.enrollments[courseId] = { enrolledDay: PROGRESS.simDay, lessons: {} };
    closeModal();
    const tail = course.type === 'padrao' ? ` Prazo de participação: até ${fmtDay(courseDeadlineDay(course, PROGRESS.enrollments[courseId]))}.` : '';
    showToast(`Inscrição confirmada em "${course.title}". A Aula 1 será liberada amanhã (${fmtDay(PROGRESS.simDay + 1)}).${tail}`, 'success');
    pushNotif('corretor', { icon: 'book-open-check', title: 'Inscrição confirmada', msg: `${course.title}: a Aula 1 abre em ${fmtDay(PROGRESS.simDay + 1)}.` });
    refresh();
}

function advanceDay() {
    PROGRESS.simDay += 1;
    const released = [];
    Object.keys(PROGRESS.enrollments).forEach(id => {
        const course = courseById(id);
        course.lessons.forEach((l, idx) => { if (lessonRelease(id, idx) === PROGRESS.simDay) released.push(`${course.title}: ${l.title}`); });
    });
    // RN-07: ao vencer o prazo, o sistema avalia o aproveitamento
    Object.keys(PROGRESS.enrollments).forEach(checkCompletion);

    if (released.length) {
        showToast(`Novo dia (${todayStr()}). Aula liberada: ${released[0]}${released.length > 1 ? ` e mais ${released.length - 1}` : ''}.`, 'success');
        released.forEach(r => pushNotif('corretor', { icon: 'calendar-clock', title: 'Nova aula liberada', msg: r }));
    } else {
        showToast(`Novo dia simulado: ${todayStr()}.`, 'info');
    }
    refresh();
    if (STATE.classroom && !isEnrolled(STATE.classroom.courseId) && !STATE.classroom.review) closeModal();
    else if (STATE.classroom) renderClassroom();
}

function newCertCode(courseId) {
    return `${String(1000 + (hashStr(courseId + Date.now()) % 9000))}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function completeCourse(courseId, pct = null) {
    const course = courseById(courseId);
    if (!course || isCompleted(courseId)) return;
    const enrDone = PROGRESS.enrollments[courseId];
    delete PROGRESS.enrollments[courseId];
    PROGRESS.completed[courseId] = { date: todayStr(), pct, from: enrDone ? fmtDay(enrDone.enrolledDay) : null };
    const code = newCertCode(courseId);
    CERTS.unshift({ id: `cert-${courseId}-${Date.now()}`, courseId, courseTitle: course.title, date: todayStr(), code, hours: course.hours, regional: course.regional || STATE.regional || 'SP', owner: 'corretor' });
    pushNotif('corretor', { icon: 'award', title: 'Certificado disponível', msg: `${course.title}, ${course.hours}h. Código ${code}.` });

    if (STATE.profile === 'corretor') showToast(`Parabéns! Você foi aprovado em "${course.title}"${pct != null ? ` com ${pct}%` : ''}. O certificado já está em Meus Certificados.`, 'success');
    else showToast(`${STUDENT_NAME()} foi aprovado em "${course.title}" e já pode emitir o certificado.`, 'success');
}

/* RN-13: reprovado perde o acesso, o resultado vai para o histórico e (Padrão) pode se inscrever de novo. */
function failCourse(courseId, motivo, pct) {
    const course = courseById(courseId);
    const enr = PROGRESS.enrollments[courseId];
    if (!course || !enr) return;
    PROGRESS.history.unshift({ courseId, from: fmtDay(enr.enrolledDay), to: todayStr(), result: 'reprovado', pct, motivo });
    delete PROGRESS.enrollments[courseId];
    delete PROGRESS.exams[courseId];
    const why = motivo === 'prazo-encerrado' ? 'o prazo do curso terminou' : motivo === 'prova-presencial' ? 'a nota da prova ficou abaixo de 6,0' : 'o aproveitamento ficou abaixo de 60%';
    const next = course.type === 'padrao' ? 'Você pode se inscrever de novo.' : 'O acesso a esta turma foi encerrado.';
    pushNotif('corretor', { icon: 'circle-x', title: 'Resultado do curso: reprovado', msg: `${course.title}: ${why}${pct != null ? ` (${pct}%)` : ''}. ${next}` });
    if (STATE.profile === 'corretor') showToast(`Reprovado em "${course.title}": ${why}. ${next}`, 'error');
}

// Decide a situação do curso pelas regras de regras.js (RN-09 a RN-13)
function checkCompletion(courseId) {
    const course = courseById(courseId);
    const enr = PROGRESS.enrollments[courseId];
    if (!course || !enr || isCompleted(courseId)) return;

    if (course.type === 'padrao') {
        const { acertos, totalQuestoes } = courseTotals(course, enr);
        const r = Regras.avaliarPadrao({
            acertos, totalQuestoes,
            aulasConcluidas: course.lessons.filter(l => (enr.lessons[l.id] || {}).done).length,
            totalAulas: course.lessons.length,
            diaAtual: PROGRESS.simDay, inscricaoDia: enr.enrolledDay, prazoDias: courseDeadlineDays(course),
        });
        if (r.status === 'aprovado') completeCourse(courseId, r.pct);
        else if (r.status === 'reprovado') failCourse(courseId, r.motivo, r.pct);
        return;
    }

    // Exclusivo: o resultado é a prova presencial
    const onlineDone = course.lessons.every(l => l.type === 'presencial' || (enr.lessons[l.id] || {}).done);
    if (!onlineDone) return;
    const exam = PROGRESS.exams[courseId];
    if (!exam || exam.score == null) {
        if (!PROGRESS.noticeShown[`exam-${courseId}`] && STATE.profile === 'corretor') {
            PROGRESS.noticeShown[`exam-${courseId}`] = true;
            showToast('Aulas online concluídas! Agora falta a prova presencial.', 'info');
        }
        return;
    }
    const r = Regras.avaliarExclusivo(exam.score);
    if (r.status === 'reprovado') return failCourse(courseId, r.motivo, r.pct);
    if (course.requiresPtam) {
        const ptam = studentPtam(courseId);
        if (!ptam || ptam.status !== 'completed') return;
    }
    completeCourse(courseId, r.pct);
}
