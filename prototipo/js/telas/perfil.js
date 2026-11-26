/*
 * Janela "Meu perfil".
 */
'use strict';

function openProfile() {
    closeDropdowns();
    toggleSidebar(false);
    const user = currentUser();
    if (!user) return;
    STATE.classroom = null;
    STATE.profileDraft = { photo: user.photo };
    const r = regionalInfo(STATE.regional);
    const today = new Date().toISOString().slice(0, 10);
    const local = userEmail().split('@')[0];

    openModal({
        title: 'Meu perfil',
        icon: 'user-round-cog',
        body: `
        <div class="flex flex-wrap items-center gap-4 mb-1">
            <div id="pf-avatar">${avatarHTML(user, 'xl')}</div>
            <div>
                <div class="flex flex-wrap gap-2">
                    <label class="btn btn-secondary btn-sm" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.querySelector('input').click()}">
                        <i data-lucide="upload"></i> Enviar foto
                        <input type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" tabindex="-1" onchange="handleProfilePhoto(this)">
                    </label>
                    <button type="button" class="btn btn-ghost btn-sm" id="pf-remove-photo" onclick="removeProfilePhoto()" ${user.photo ? '' : 'disabled'}><i data-lucide="trash-2"></i> Remover</button>
                </div>
                <p class="field-hint">JPG, PNG ou WEBP, até 2 MB.</p>
            </div>
        </div>

        <dl class="info-grid">
            <div class="info-item"><dt class="label-mono">Nome</dt><dd>${esc(user.name)}</dd></div>
            <div class="info-item"><dt class="label-mono">${STATE.profile === 'corretor' ? 'CRECI nº' : 'Matrícula'}</dt><dd class="font-mono">${esc(user.creci)}</dd></div>
        </dl>

        <form id="profile-form" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4" novalidate onsubmit="saveProfile(event)">
            <div class="sm:col-span-2">
                <label class="field-label" for="pf-email">E-mail institucional</label>
                <div class="input-group">
                    <input id="pf-email" class="input" value="${esc(local)}" readonly>
                    <span class="input-addon">@creci.org.br</span>
                </div>
            </div>
            <div>
                <label class="field-label" for="pf-phone">Telefone</label>
                <div class="input-icon"><i data-lucide="phone"></i><input id="pf-phone" class="input" type="tel" inputmode="numeric" autocomplete="tel" placeholder="(00) 00000-0000" value="${esc(user.phone)}" oninput="maskPhone(this)" aria-describedby="pf-phone-error"></div>
                <p class="field-error" id="pf-phone-error" hidden></p>
            </div>
            <div>
                <label class="field-label" for="pf-birth">Data de nascimento</label>
                <div class="input-icon"><i data-lucide="cake"></i><input id="pf-birth" class="input" type="date" max="${today}" value="${esc(user.birth)}" aria-describedby="pf-birth-error"></div>
                <p class="field-error" id="pf-birth-error" hidden></p>
            </div>
            <div class="sm:col-span-2">
                <label class="field-label" for="pf-regional">Regional</label>
                <div class="input-icon"><i data-lucide="map-pin"></i><input id="pf-regional" class="input" value="CRECI-${esc(r.sigla)} · ${esc(r.regiao)} · ${esc(r.estado)}" readonly></div>
            </div>
            <p class="sm:col-span-2 text-xs text-muted">Nome, ${STATE.profile === 'corretor' ? 'CRECI' : 'matrícula'}, e-mail e Regional vêm do cadastro oficial. Para mudar esses dados, procure a sua Regional. Telefone, data de nascimento e foto você altera aqui.</p>
            <button type="submit" hidden></button>
        </form>`,
        footer: `
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveProfile()"><i data-lucide="save"></i> Salvar alterações</button>`,
    });
}

function maskPhone(input) {
    const d = input.value.replace(/\D/g, '').slice(0, 11);
    let out = d;
    if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 6) out = d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    input.value = out;
}

function handleProfilePhoto(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return showToast('Use uma imagem JPG, PNG ou WEBP.', 'error');
    if (file.size > 2 * 1024 * 1024) return showToast('A imagem passa de 2 MB.', 'error');
    const reader = new FileReader();
    reader.onload = () => {
        if (!STATE.profileDraft) return;
        STATE.profileDraft.photo = String(reader.result);
        updateProfileAvatarPreview();
        showToast('Foto carregada. Clique em Salvar alterações para confirmar.', 'info');
    };
    reader.onerror = () => showToast('Não foi possível ler a imagem.', 'error');
    reader.readAsDataURL(file);
}

function removeProfilePhoto() {
    if (!STATE.profileDraft) return;
    STATE.profileDraft.photo = null;
    updateProfileAvatarPreview();
}

function updateProfileAvatarPreview() {
    const user = currentUser();
    const box = $('#pf-avatar');
    if (box) box.innerHTML = avatarHTML({ ...user, photo: STATE.profileDraft.photo }, 'xl');
    const rm = $('#pf-remove-photo');
    if (rm) rm.disabled = !STATE.profileDraft.photo;
}

function setFieldError(id, msg) {
    const input = $(`#${id}`);
    const err = $(`#${id}-error`);
    if (input) { input.classList.toggle('is-invalid', !!msg); input.setAttribute('aria-invalid', msg ? 'true' : 'false'); }
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
}

function saveProfile(event) {
    if (event) event.preventDefault();
    const user = currentUser();
    if (!user || !STATE.profileDraft) return;
    const phone = $('#pf-phone').value.trim();
    const birth = $('#pf-birth').value;

    const digits = phone.replace(/\D/g, '');
    const phoneOk = setFieldError('pf-phone', digits.length === 10 || digits.length === 11 ? '' : 'Informe DDD + número (10 ou 11 dígitos).');

    let birthMsg = '';
    if (!birth) birthMsg = 'Informe a data de nascimento.';
    else {
        const d = new Date(`${birth}T00:00:00`);
        const now = new Date();
        let age = now.getFullYear() - d.getFullYear();
        if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
        if (isNaN(d.getTime()) || d > now) birthMsg = 'Data inválida.';
        else if (age < 18) birthMsg = 'É preciso ter 18 anos ou mais.';
        else if (age > 110) birthMsg = 'Confira o ano informado.';
    }
    const birthOk = setFieldError('pf-birth', birthMsg);
    if (!phoneOk || !birthOk) return showToast('Corrija os campos destacados.', 'error');

    user.phone = phone;
    user.birth = birth;
    user.photo = STATE.profileDraft.photo;
    closeModal();
    renderChrome();
    showToast('Perfil atualizado.', 'success');
}
