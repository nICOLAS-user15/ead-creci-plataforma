/*
 * Tela "Meus Cursos" do corretor.
 */
'use strict';

function viewMeusCursos() {
    const user = currentUser();
    const enrolled = Object.keys(PROGRESS.enrollments).map(courseById).filter(Boolean);
    const myCerts = CERTS.filter(c => c.owner === 'corretor');
    const hours = CERTS.filter(c => c.owner === 'corretor').reduce((s, c) => s + c.hours, 0);
    const availableToday = enrolled.reduce((n, c) => n + c.lessons.filter((l, i) => lessonState(c, i).key === 'available').length, 0);

    // Avisos "precisa de atenção"
    const alerts = [];
    enrolled.forEach(c => {
        const p = studentPtam(c.id);
        if (p && p.status === 'resubmit') alerts.push({ tone: 'warning', icon: 'rotate-ccw', html: `<b>${esc(c.title)}:</b> seu PTAM precisa ser reapresentado. ${p.note ? `Motivo: “${esc(p.note)}”` : ''}`, action: `openClassroom('${c.id}')`, label: 'Corrigir PTAM' });
        if (p && p.status === 'rejected') alerts.push({ tone: 'danger', icon: 'circle-x', html: `<b>${esc(c.title)}:</b> PTAM rejeitado. ${p.note ? `“${esc(p.note)}”` : ''} Procure a sua Regional.`, action: `openClassroom('${c.id}')`, label: 'Ver detalhes' });
        const exam = PROGRESS.exams[c.id];
        if (exam && exam.score == null) alerts.push({ tone: 'info', icon: 'calendar-check', html: `<b>${esc(c.title)}:</b> prova presencial em ${esc(exam.date)}, ${esc(exam.place)}.`, action: `openClassroom('${c.id}')`, label: 'Ver curso' });
    });

    const firstName = user.name.split(' ')[0];

    return `
    ${pageHeader({
        icon: 'book-open-check',
        crumb: 'Aprendizagem / Meus Cursos',
        title: 'Meus Cursos',
        subtitle: `Olá, ${esc(firstName)}. Acompanhe os cursos em andamento e os finalizados com aprovação.`,
        actions: simDayControl(),
    })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${kpi({ label: 'Em andamento', value: enrolled.length, icon: 'book-open', tone: 'primary' })}
        ${kpi({ label: 'Aulas disponíveis', value: availableToday, icon: 'play-circle', tone: 'warning', hint: 'Liberadas e ainda não feitas' })}
        ${kpi({ label: 'Concluídos', value: CERTS.filter(c => c.owner === 'corretor').length, icon: 'circle-check', tone: 'success' })}
        ${kpi({ label: 'Horas certificadas', value: `${hours}h`, icon: 'clock', tone: 'gold' })}
    </div>

    ${alerts.length ? `
    <div class="section-title">Precisa de atenção</div>
    <div class="space-y-2">
        ${alerts.map(a => `
        <div class="alert alert-${a.tone} flex-wrap">
            <i data-lucide="${a.icon}"></i>
            <div class="flex-1 min-w-[200px]">${a.html}</div>
            <button class="btn btn-secondary btn-sm" onclick="${a.action}">${a.label}</button>
        </div>`).join('')}
    </div>` : ''}

    <div class="section-title">Cursos em andamento</div>
    <div class="panel">
        ${enrolled.length ? `
            ${enrolled.map(enrolledRow).join('')}
        ` : emptyState('book-open', 'Nenhum curso em andamento', 'Escolha um curso no catálogo para começar.', `<button class="btn btn-primary" onclick="switchView('catalogo')"><i data-lucide="library"></i> Ver todos os cursos</button>`)}
    </div>

    <div class="section-title">Cursos finalizados com aprovação</div>
    <div class="panel">
        ${myCerts.length ? `
        <div class="table-wrap">
            <table class="table">
                <thead><tr><th>Curso</th><th>Concluído em</th><th>Carga</th><th class="text-right">Ações</th></tr></thead>
                <tbody>
                ${myCerts.map(cert => {
                    const c = courseById(cert.courseId);
                    return `
                    <tr>
                        <td><div class="font-semibold">${esc(cert.courseTitle)}</div><div class="text-xs text-muted">${c ? esc(c.edition) : 'Curso de edições anteriores'}</div></td>
                        <td class="font-mono text-xs">${esc(cert.date)}</td>
                        <td>${cert.hours}h</td>
                        <td class="text-right whitespace-nowrap">
                            ${c ? `<button class="btn btn-ghost btn-sm" onclick="openClassroom('${c.id}', true)"><i data-lucide="eye"></i> Consultar</button>` : ''}
                            <button class="btn btn-secondary btn-sm" onclick="openCertificate('${cert.id}')"><i data-lucide="award"></i> Certificado</button>
                        </td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
        </div>` : emptyState('trophy', 'Nenhum curso concluído ainda', 'Os cursos concluídos aparecem aqui.')}
    </div>`;
}

function enrolledRow(c) {
    const prog = courseProgress(c);
    const next = nextLessonInfo(c);
    const excl = c.type === 'exclusivo';
    let nextText = 'Todas as aulas concluídas';
    if (next) {
        const st = next.state;
        if (st.key === 'available') nextText = `Próxima: <b>${esc(next.lesson.title)}</b>${next.lesson.type === 'presencial' ? ' · agende a prova' : ' · disponível agora'}`;
        else if (st.key === 'scheduled') nextText = `${esc(st.reason)}`;
        else if (st.key === 'failed') nextText = `Prova presencial: ${esc(st.reason)}`;
        else nextText = `Próxima: <b>${esc(next.lesson.title)}</b> · ${esc(st.reason)}`;
    }
    const ptam = c.requiresPtam ? studentPtam(c.id) : null;
    return `
    <div class="course-row">
        <div class="course-row-icon ${excl ? 'thumb-exclusivo' : 'thumb-padrao'}"><i data-lucide="${c.icon}"></i></div>
        <div class="flex-1 min-w-[220px]">
            <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="badge ${excl ? 'badge-gold' : 'badge-primary'}">${excl ? 'Exclusivo' : 'Padrão'}</span>
                <span class="text-xs text-muted">${esc(c.edition)}</span>
                ${ptam ? `<span class="badge ${PTAM_STATUS[ptam.status].badge}">PTAM: ${PTAM_STATUS[ptam.status].label}</span>` : ''}
            </div>
            <div class="font-bold">${esc(c.title)}</div>
            <div class="text-xs text-muted mt-1">${nextText}</div>
            <div class="flex items-center gap-3 mt-3">
                <div class="progress flex-1 ${excl ? 'gold' : ''}"><span style="width:${prog.pct}%"></span></div>
                <span class="font-mono text-xs font-bold">${prog.done}/${prog.total}</span>
            </div>
        </div>
        <button class="btn btn-primary" onclick="openClassroom('${c.id}')"><i data-lucide="play-circle"></i> Continuar</button>
    </div>`;
}
