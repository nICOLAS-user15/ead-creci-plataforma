(async () => {
    const out = [];
    const errors = [];
    window.addEventListener('error', e => errors.push(String(e.message)));
    const check = (name, cond, extra = '') => out.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + extra}`);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const loginAs = async (p, reg = 'SP') => {
        if (STATE.loggedIn) logout();
        selectRegional(reg); selectProfile(p);
        $('#login-email').value = USERS[p].emailLocal; submitEmail(); openMagicLink();
        await sleep(700);
    };
    // faz o exercício da aula idx do curso; certo = true acerta tudo, false erra tudo
    const doLesson = (courseId, idx, certo) => {
        openClassroom(courseId); openLesson(idx); markWatched();
        const cr = STATE.classroom;
        const qs = quizFor(courseId, idx);
        qs.forEach((q, qi) => { cr.answers[qi] = certo ? q.answer : (q.answer + 1) % q.options.length; });
        submitQuiz();
        closeModal();
    };
    const termsOpen = () => $('#modal').classList.contains('active') && !!$('#terms-check');
    const enroll = id => { enrollCourse(id); $('#terms-check').checked = true; confirmEnroll(id); };

    try {
        await loginAs('corretor');
        check('home do corretor é Todos os Cursos', STATE.view === 'catalogo', STATE.view);
        const navs = $$('.nav-section[data-perm="learn"] .nav-link').map(b => b.textContent.trim());
        check('abas na ordem do PPTX', navs.join('|') === 'Todos os Cursos|Apenas Meus Cursos|Meus Certificados', navs.join('|'));

        // RN-04
        check('aula 2 do c1 liberada (aula 1 feita no dia 8)', lessonState(courseById('c1'), 1).key === 'available');
        check('aula 3 travada até concluir a 2', lessonState(courseById('c1'), 2).reason === 'Conclua a aula anterior', lessonState(courseById('c1'), 2).reason);
        doLesson('c1', 1, true);
        let enr = PROGRESS.enrollments.c1;
        check('exercício guarda 3/3 e o dia', enr.lessons.l2.correct === 3 && enr.lessons.l2.doneDay === PROGRESS.simDay, JSON.stringify(enr.lessons.l2));
        check('aula 3 abre 24h depois', /Libera amanhã/.test(lessonState(courseById('c1'), 2).reason), lessonState(courseById('c1'), 2).reason);
        // sem retentativa
        openClassroom('c1'); openLesson(1);
        STATE.classroom.answers = { 0: 0, 1: 0, 2: 0 };
        const before = JSON.stringify(PROGRESS.enrollments.c1.lessons.l2);
        submitQuiz();
        check('exercício não pode ser refeito', JSON.stringify(PROGRESS.enrollments.c1.lessons.l2) === before);
        closeModal();

        // RN-11 / RN-13: reprova ao fim com <60%
        advanceDay(); doLesson('c1', 2, false);
        advanceDay(); doLesson('c1', 3, false);
        check('c1 reprovado (3/9 = 33%)', !isEnrolled('c1') && !isCompleted('c1') && PROGRESS.history[0]?.result === 'reprovado' && PROGRESS.history[0].pct === 33, JSON.stringify(PROGRESS.history[0]));
        check('reprovado Padrão pode se inscrever de novo', (enrollCourse('c1'), termsOpen()));
        closeModal();

        // aprovação
        enroll('c1');
        check('reinscrição criou matrícula', isEnrolled('c1'));
        for (let i = 0; i < 4; i++) { advanceDay(); const l = courseById('c1').lessons[i]; if (l.quiz) doLesson('c1', i, true); else { openClassroom('c1'); openLesson(i); markWatched(); completeLesson(); closeModal(); } }
        check('c1 aprovado com 100%', isCompleted('c1') && PROGRESS.completed.c1.pct === 100, JSON.stringify(PROGRESS.completed.c1));
        check('certificado gerado', CERTS.some(c => c.courseId === 'c1'));
        enrollCourse('c1');
        check('aprovado não se inscreve de novo', !termsOpen());
        openCertificate(CERTS.find(c => c.courseId === 'c1').id);
        check('certificado mostra texto com coringas', /por ter concluído o curso Matemática Financeira e HP12C, com início em/.test($('#modal-body').textContent), $('#modal-body').textContent.slice(0, 200));
        closeModal();

        // RN-07: prazo encerrado
        enroll('c2');
        for (let i = 0; i < 31; i++) advanceDay();
        check('c2 reprovado por prazo (31 dias)', !isEnrolled('c2') && PROGRESS.history.some(h => h.courseId === 'c2' && h.motivo === 'prazo-encerrado'), JSON.stringify(PROGRESS.history[0]));

        // Exclusivo: prova < 6 reprova
        enroll('x1');
        check('vaga contada', courseById('x1').seatsTaken === 32);
        PROGRESS.exams.x1 = { date: 'x', place: 'y', score: 5 };
        const l = courseById('x1').lessons;
        l.forEach(le => { if (le.type !== 'presencial') PROGRESS.enrollments.x1.lessons[le.id] = { done: true, score: 100, correct: 3, doneDay: PROGRESS.simDay }; });
        checkCompletion('x1');
        check('x1 reprovado com nota 5,0 e perdeu acesso', !isEnrolled('x1') && wasFailed('x1'));
        enrollCourse('x1');
        check('reprovado em Exclusivo não reinscreve na mesma turma', !termsOpen());

        // Admin master
        await loginAs('admin_master');
        check('home do admin é Gestão (PTAM)', STATE.view === 'admin', STATE.view);
        check('menu tem Relatórios e Criar curso', !!$('[data-view="relatorios"]:not([hidden])') && !!$('[data-view="criar-curso"]:not([hidden])'));
        switchView('relatorios');
        let rows = $$('#report-tbody tr').length;
        check('relatório lista inscrições (todas as Regionais)', rows >= 12, String(rows));
        check('relatório inclui reprovações da sessão', /Reprovado/.test($('#report-tbody').textContent));
        toggleReportFilter('results', 'reprovado', true);
        const onlyFail = $$('#report-tbody .badge').every(b => b.textContent.trim() === 'Reprovado');
        check('filtro Resultado=Reprovado', onlyFail && $$('#report-tbody tr').length >= 2);
        toggleReportFilter('regionals', 'RJ', true);
        check('filtro Regional=RJ', $$('#report-tbody tr').length === 1, String($$('#report-tbody tr').length));
        clearReportFilters();
        setReportText('q', 'beatriz');
        check('busca por aluno', $$('#report-tbody tr').length === 1);
        setReportText('q', '');

        // Criar curso
        switchView('criar-curso');
        const n0 = COURSES.length;
        saveCourse();
        check('curso sem nome é recusado', COURSES.length === n0 && STATE.courseDraft.tab === 'estrutura');
        Object.assign(STATE.courseDraft, { title: 'Inteligência Artificial', lessons: [{ title: 'Introdução', quiz: true }, { title: 'Prompts', quiz: true }], deadlineDays: 20, certText: 'Concluiu [nome_curso] em [dt_fim_curso]' });
        saveCourse();
        const novo = COURSES[COURSES.length - 1];
        check('curso criado entra no catálogo', COURSES.length === n0 + 1 && novo.title === 'Inteligência Artificial' && novo.deadlineDays === 20 && STATE.view === 'catalogo');
        switchView('criar-curso');
        Object.assign(STATE.courseDraft, { type: 'exclusivo', title: 'Turma X', lessons: [{ title: 'A', quiz: true }] });
        saveCourse();
        check('exclusivo sem datas é recusado na aba Inscrição', COURSES.length === n0 + 1 && STATE.courseDraft.tab === 'inscricao');

        // Admin regional
        await loginAs('admin_regional', 'MG');
        switchView('relatorios');
        const regs = $$('#report-tbody td:nth-child(3)').map(td => td.textContent.trim());
        check('Admin Regional vê só a própria Regional', regs.length >= 2 && regs.every(r => r === 'CRECI-MG'), regs.join(','));
        check('Admin Regional não vê filtro de Regional nem Criar curso', !$('[onclick*="regionals"]') && $('[data-view="criar-curso"]').hidden);
        switchView('criar-curso');
        check('Admin Regional não acessa Criar curso por URL/estado', STATE.view !== 'criar-curso', STATE.view);

        // foco preso no modal
        await loginAs('corretor');
        openProfile();
        const box = $('#modal-box');
        const fs = $$('button:not([disabled]), input:not([disabled]), select, textarea', box).filter(e => e.offsetParent);
        fs[fs.length - 1].focus();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
        check('Tab no último elemento volta ao primeiro (modal)', box.contains(document.activeElement) && document.activeElement === fs[0], document.activeElement.outerHTML.slice(0, 60));
    } catch (e) {
        out.push('ERRO NO CENÁRIO: ' + e.stack);
    }
    out.push(errors.length ? 'ERROS JS: ' + errors.join(' | ') : 'sem erros de JS');
    const pre = document.createElement('pre'); pre.id = 'smoke-out'; pre.textContent = out.join('\n');
    document.body.appendChild(pre);
})();
