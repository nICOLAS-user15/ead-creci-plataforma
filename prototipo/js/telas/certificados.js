/*
 * Certificados: lista do corretor, validação por código e visualização do certificado.
 */
'use strict';

function viewCertificados() {
    const mine = can('learn') ? CERTS.filter(c => c.owner === 'corretor') : [];
    const isStudent = can('learn');
    return `
    ${pageHeader({
        icon: 'award',
        crumb: isStudent ? 'Aprendizagem / Certificados' : 'Gestão / Certificados',
        title: isStudent ? 'Meus Certificados' : `Validar certificado ${TAG_PROPOSTA}`,
        subtitle: isStudent ? 'Emita e valide seus certificados nesta tela.' : 'Confira se um certificado emitido pela plataforma é verdadeiro.',
    })}
    <div class="grid grid-cols-1 ${isStudent ? 'lg:grid-cols-3' : ''} gap-4">
        ${isStudent ? `
        <div class="panel lg:col-span-2">
            <div class="panel-head">
                <span class="panel-head-icon"><i data-lucide="award"></i></span>
                <div><div class="panel-title">Certificados emitidos</div><div class="panel-sub">${mine.length} certificado${mine.length === 1 ? '' : 's'} · ${mine.reduce((s, c) => s + c.hours, 0)}h no total</div></div>
            </div>
            ${mine.length ? `
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Curso</th><th>Conclusão</th><th>Carga</th><th>Código</th><th class="text-right">Ações</th></tr></thead>
                    <tbody>
                        ${mine.map(c => `
                        <tr>
                            <td class="font-semibold">${esc(c.courseTitle)}</td>
                            <td class="font-mono text-xs">${esc(c.date)}</td>
                            <td>${c.hours}h</td>
                            <td><span class="font-mono text-xs">${esc(c.code)}</span></td>
                            <td class="text-right whitespace-nowrap">
                                <button class="icon-btn" title="Copiar código" aria-label="Copiar código ${esc(c.code)}" onclick="copyCode('${esc(c.code)}')"><i data-lucide="copy"></i></button>
                                <button class="btn btn-secondary btn-sm" onclick="openCertificate('${c.id}')"><i data-lucide="download"></i> Emitir PDF</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>` : emptyState('award', 'Nenhum certificado ainda', 'Conclua um curso para receber o certificado.')}
        </div>` : ''}

        <div class="panel ${isStudent ? '' : 'max-w-xl'}">
            <div class="panel-head">
                <span class="panel-head-icon"><i data-lucide="shield-check"></i></span>
                <div><div class="panel-title">Validar autenticidade ${TAG_PROPOSTA}</div><div class="panel-sub">Digite o código impresso no certificado</div></div>
            </div>
            <form class="panel-body" onsubmit="validateCertificate(event)">
                <label class="field-label" for="val-code">Código de validação</label>
                <input id="val-code" class="input font-mono uppercase" placeholder="0000-XXXX" maxlength="9" autocomplete="off">
                <p class="field-hint">Exemplos para testar: ${CERTS[0] ? `<button type="button" class="link-btn" style="color:rgb(var(--c-primary))" onclick="fillCode('${esc(CERTS[0].code)}')">${esc(CERTS[0].code)}</button>, ` : ''}<button type="button" class="link-btn" style="color:rgb(var(--c-primary))" onclick="fillCode('8812-C04A')">8812-C04A</button></p>
                <button type="submit" class="btn btn-primary btn-block mt-3"><i data-lucide="search-check"></i> Validar</button>
                <div id="val-result" class="mt-4" aria-live="polite"></div>
            </form>
        </div>
    </div>`;
}

function fillCode(code) {
    const input = $('#val-code');
    if (input) { input.value = code; validateCertificate(); }
}

function validateCertificate(event) {
    if (event) event.preventDefault();
    const input = $('#val-code');
    const out = $('#val-result');
    if (!input || !out) return;
    const code = input.value.trim().toUpperCase();
    if (!/^\d{4}-[A-Z0-9]{4}$/.test(code)) {
        out.innerHTML = `<div class="alert alert-warning"><i data-lucide="triangle-alert"></i><div>Formato inválido. Use 0000-XXXX.</div></div>`;
        return icons();
    }
    const own = CERTS.find(c => c.code === code);
    const found = own ? { name: USERS.corretor.name, courseTitle: own.courseTitle, date: own.date, hours: own.hours, regional: own.regional } : OTHER_CERTS.find(c => c.code === code);
    out.innerHTML = found ? `
        <div class="alert alert-success"><i data-lucide="badge-check"></i>
            <div><b>Certificado válido.</b><br>${esc(found.name)} concluiu <b>${esc(found.courseTitle)}</b> (${found.hours}h) em ${esc(found.date)}. CRECI-${esc(found.regional)}.</div>
        </div>` : `
        <div class="alert alert-danger"><i data-lucide="circle-x"></i><div><b>Código não encontrado.</b> Confira se digitou certo. Se persistir, o documento pode não ser autêntico.</div></div>`;
    icons();
}

function copyCode(code) {
    const done = () => showToast(`Código ${code} copiado.`, 'success');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(code).then(done, () => showToast(`Código: ${code}`, 'info'));
    else showToast(`Código: ${code}`, 'info');
}

function openCertificateByCourse(courseId) {
    const cert = CERTS.find(c => c.courseId === courseId);
    if (cert) openCertificate(cert.id); else showToast('Certificado não encontrado.', 'error');
}

function certTextFor(cert) {
    const course = courseById(cert.courseId);
    const done = PROGRESS.completed[cert.courseId];
    return Regras.preencherCoringas(course?.certText || Regras.TEXTO_CERTIFICADO_PADRAO,
        { nome_curso: cert.courseTitle, dt_inicio_curso: done?.from, dt_fim_curso: cert.date });
}

function openCertificate(certId) {
    const cert = CERTS.find(c => c.id === certId);
    if (!cert) return showToast('Certificado não encontrado.', 'error');
    const r = regionalInfo(cert.regional);
    openModal({
        title: 'Certificado de conclusão',
        icon: 'award',
        size: 'lg',
        body: `
        <div class="cert-sheet">
            <div class="cert-border">
                <div style="display:flex;justify-content:center;align-items:center;gap:.6rem;margin-bottom:1.1rem">
                    <div class="brand-mark"><img src="icone.svg" alt=""></div>
                    <div style="text-align:left"><div style="font-weight:800">EAD CRECI</div><div style="font:600 .55rem 'JetBrains Mono',monospace;letter-spacing:.16em;color:#64748b">SISTEMA COFECI · CRECI</div></div>
                </div>
                <div style="font:600 .66rem 'JetBrains Mono',monospace;letter-spacing:.2em;color:#9a7b2c">CERTIFICADO DE CONCLUSÃO</div>
                <div style="width:70px;height:2px;background:#b8953b;margin:.7rem auto 1.1rem"></div>
                <p style="color:#475569;margin:0">Certificamos que</p>
                <p style="font-family:'Source Serif 4',Georgia,serif;font-size:1.6rem;font-weight:600;margin:.3rem 0 .6rem">${esc(USERS.corretor.name)}</p>
                <p style="font-size:1rem;font-weight:600;color:#1d4ed8;margin:.35rem 0 .8rem">${esc(certTextFor(cert))}</p>
                <p style="font-size:.82rem;color:#64748b;margin:0 0 1.4rem">Carga horária de ${cert.hours} horas · concluído em ${esc(cert.date)}</p>
                <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;border-top:1px solid #e2e8f0;padding-top:1rem;text-align:left">
                    <div><div style="font:600 .55rem 'JetBrains Mono',monospace;letter-spacing:.14em;color:#94a3b8">CÓDIGO DE VALIDAÇÃO</div><div style="font:700 .9rem 'JetBrains Mono',monospace">${esc(cert.code)}</div></div>
                    <div style="text-align:right"><div style="font:600 .55rem 'JetBrains Mono',monospace;letter-spacing:.14em;color:#94a3b8">REGIONAL</div><div style="font-weight:700;font-size:.85rem">CRECI-${esc(r.sigla)} · ${esc(r.regiao)}</div></div>
                </div>
            </div>
        </div>`,
        footer: `
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
            <button class="btn btn-primary" onclick="window.print()"><i data-lucide="printer"></i> Imprimir / salvar PDF</button>`,
    });
}
