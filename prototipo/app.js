/* ==========================================================
   app.js — EAD CRECI (protótipo v5)
   Simulador de backend + regras de negócio. Tudo em memória:
   os dados persistem entre logins até recarregar a página,
   para dar para testar o fluxo corretor → admin → corretor.
   ========================================================== */
'use strict';

/* ───────────────────────── HELPERS ───────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function icons() {
    try { if (window.lucide) window.lucide.createIcons(); } catch (err) { console.warn('[icons]', err); }
}

function storageGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function storageSet(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* modo privado */ } }

const REDUCED_MOTION = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
const DAY_MS = 86400000;
const BASE_DATE = new Date(new Date().toDateString()); // hoje 00:00
const SIM_DAY_START = 10;

function dateOfDay(day) { return new Date(BASE_DATE.getTime() + (day - SIM_DAY_START) * DAY_MS); }
function fmtDate(d) { return d.toLocaleDateString('pt-BR'); }
function fmtDay(day) { return fmtDate(dateOfDay(day)); }
function todayStr() { return fmtDay(PROGRESS.simDay); }

function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
}

function initials(name) {
    return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

/* ───────────────────────── DADOS (MOCK) ───────────────────────── */
const REGIONAIS = [
    ['RJ', 1, 'Rio de Janeiro'], ['SP', 2, 'São Paulo'], ['RS', 3, 'Rio Grande do Sul'], ['MG', 4, 'Minas Gerais'],
    ['GO', 5, 'Goiás'], ['PR', 6, 'Paraná'], ['PE', 7, 'Pernambuco'], ['DF', 8, 'Distrito Federal'],
    ['BA', 9, 'Bahia'], ['SC', 11, 'Santa Catarina'], ['PA', 12, 'Pará'], ['ES', 13, 'Espírito Santo'],
    ['MS', 14, 'Mato Grosso do Sul'], ['CE', 15, 'Ceará'], ['SE', 16, 'Sergipe'], ['RN', 17, 'Rio Grande do Norte'],
    ['AM', 18, 'Amazonas'], ['MT', 19, 'Mato Grosso'], ['MA', 20, 'Maranhão'], ['PB', 21, 'Paraíba'],
    ['AL', 22, 'Alagoas'], ['PI', 23, 'Piauí'], ['RO', 24, 'Rondônia'], ['TO', 25, 'Tocantins'],
    ['AC', 26, 'Acre'], ['RR', 27, 'Roraima'], ['AP', 28, 'Amapá'],
].map(([sigla, n, estado]) => ({ sigla, n, regiao: `${n}ª Região`, estado }));
const regionalInfo = sigla => REGIONAIS.find(r => r.sigla === sigla) || { sigla, regiao: '', estado: '' };

const PROFILES = {
    corretor: {
        label: 'Corretor de Imóveis', short: 'corretor', icon: 'user-round',
        desc: 'Cursos, aulas diárias, envio de PTAM e certificados',
        perms: ['learn', 'catalog', 'validate'],
        home: 'meus-cursos',
    },
    admin_regional: {
        label: 'Administrador Regional', short: 'administrador regional', icon: 'shield',
        desc: 'Alunos, turmas e pareceres apenas da sua Regional',
        perms: ['ptam_queue', 'catalog', 'validate'],
        home: 'admin',
    },
    admin_master: {
        label: 'Administrador Master', short: 'administrador master', icon: 'shield-check',
        desc: 'Gestão global, todas as Regionais e importação de notas',
        perms: ['ptam_queue', 'import_grades', 'catalog', 'validate', 'all_regions'],
        home: 'admin',
    },
};

// Dados de cadastro por perfil (editáveis pelo modal de perfil; persistem na sessão)
const USERS = {
    corretor:       { name: 'Monteiro Lobato', creci: '123456-F', emailLocal: 'monteiro.lobato', phone: '(11) 98765-4321', birth: '1985-04-18', photo: null },
    admin_regional: { name: 'Helena Prado',    creci: 'Matrícula 0392', emailLocal: 'helena.prado', phone: '(11) 3456-7890', birth: '1979-09-02', photo: null },
    admin_master:   { name: 'Ricardo Alves',   creci: 'Matrícula 0007', emailLocal: 'ricardo.alves', phone: '(61) 99876-1234', birth: '1974-01-27', photo: null },
};
const STUDENT_NAME = () => USERS.corretor.name;

const CATEGORIAS = ['Finanças', 'Jurídico', 'Marketing', 'Vendas', 'Gestão', 'Avaliação', 'Mercado'];

function L(id, title, duration, quiz = true, type = 'video') { return { id, title, duration, quiz, type }; }

const COURSES = [
    { id: 'c1', title: 'Matemática Financeira e HP12C', type: 'padrao', scope: 'Nacional', category: 'Finanças', icon: 'calculator', hours: 20, modality: 'Online', edition: 'Edição 357',
      description: 'Domine a HP12C e os conceitos de matemática financeira aplicados ao mercado imobiliário.',
      lessons: [L('l1', 'Introdução à Matemática Financeira', '25min', false), L('l2', 'Juros Simples e Compostos', '30min'), L('l3', 'Operando a HP12C', '35min'), L('l4', 'Tabela SAC vs. PRICE', '40min')] },
    { id: 'c2', title: 'Direito Imobiliário Aplicado', type: 'padrao', scope: 'Nacional', category: 'Jurídico', icon: 'scale', hours: 40, modality: 'Online', edition: 'Edição 112',
      description: 'Contratos, locações e jurisprudência atualizada para dar segurança jurídica às transações.',
      lessons: [L('l1', 'Contratos de Compra e Venda', '45min'), L('l2', 'Lei do Inquilinato', '40min'), L('l3', 'Registro de Imóveis', '35min'), L('l4', 'Responsabilidade Civil do Corretor', '30min')] },
    { id: 'c3', title: 'Fotografia de Imóveis com Smartphone', type: 'padrao', scope: 'Nacional', category: 'Marketing', icon: 'camera', hours: 15, modality: 'Online', edition: 'Edição 45',
      description: 'Iluminação, enquadramento e edição básica para valorizar seus anúncios.',
      lessons: [L('l1', 'Fundamentos de Composição', '20min', false), L('l2', 'Iluminação Natural', '25min'), L('l3', 'Edição com Apps Gratuitos', '30min')] },
    { id: 'c4', title: 'Marketing Digital Imobiliário', type: 'padrao', scope: 'Nacional', category: 'Marketing', icon: 'megaphone', hours: 30, modality: 'Online', edition: 'Edição 89',
      description: 'Anúncios, presença em redes sociais e captação de leads orgânicos.',
      lessons: [L('l1', 'Funil de Vendas Digital', '35min'), L('l2', 'Instagram para Corretores', '30min'), L('l3', 'Anúncios Pagos', '40min'), L('l4', 'Métricas e Conversão', '25min')] },
    { id: 'c5', title: 'Documentação de Loteamentos', type: 'padrao', scope: 'Nacional', category: 'Jurídico', icon: 'map', hours: 20, modality: 'Online', edition: 'Edição 23',
      description: 'Aspectos legais, ambientais e urbanísticos na aprovação de novos loteamentos.',
      lessons: [L('l1', 'Parcelamento do Solo Urbano', '40min'), L('l2', 'Licenciamento Ambiental', '35min'), L('l3', 'Documentação para Cartório', '30min')] },
    { id: 'c8', title: 'Ética Profissional e a Lei 6.530/78', type: 'padrao', scope: 'Nacional', category: 'Jurídico', icon: 'badge-check', hours: 10, modality: 'Online', edition: 'Edição 201',
      description: 'Código de Ética, deveres do corretor e as principais infrações disciplinares.',
      lessons: [L('l1', 'A profissão regulamentada', '20min', false), L('l2', 'Código de Ética Profissional', '30min'), L('l3', 'Processo disciplinar', '25min')] },
    { id: 'c9', title: 'Financiamento Imobiliário e Crédito', type: 'padrao', scope: 'Nacional', category: 'Finanças', icon: 'landmark', hours: 25, modality: 'Online', edition: 'Edição 64',
      description: 'SFH, SFI, uso do FGTS, análise de crédito e simulações com o cliente.',
      lessons: [L('l1', 'Sistemas de financiamento', '35min'), L('l2', 'FGTS na compra do imóvel', '25min'), L('l3', 'Análise de crédito', '30min'), L('l4', 'Simulações na prática', '40min')] },
    { id: 'c10', title: 'Técnicas de Negociação e Atendimento', type: 'padrao', scope: 'Nacional', category: 'Vendas', icon: 'handshake', hours: 20, modality: 'Online', edition: 'Edição 133',
      description: 'Da primeira visita ao fechamento: escuta ativa, objeções e proposta.',
      lessons: [L('l1', 'Atendimento consultivo', '30min'), L('l2', 'Contornando objeções', '35min'), L('l3', 'Fechamento e proposta', '30min')] },
    { id: 'c11', title: 'Administração de Locações', type: 'padrao', scope: 'Nacional', category: 'Gestão', icon: 'key-round', hours: 30, modality: 'Online', edition: 'Edição 77',
      description: 'Captação, vistoria, garantias locatícias, reajustes e inadimplência.',
      lessons: [L('l1', 'Captação e vistoria', '30min'), L('l2', 'Garantias locatícias', '35min'), L('l3', 'Reajustes e renovação', '25min'), L('l4', 'Inadimplência e despejo', '40min')] },
    { id: 'c12', title: 'LGPD para o Mercado Imobiliário', type: 'padrao', scope: 'Nacional', category: 'Jurídico', icon: 'shield-check', hours: 12, modality: 'Online', edition: 'Edição 18',
      description: 'Como tratar dados de clientes, proprietários e leads dentro da lei.',
      lessons: [L('l1', 'Princípios da LGPD', '25min'), L('l2', 'Dados no dia a dia da imobiliária', '30min')] },
    { id: 'c13', title: 'Panorama do Mercado Paulista 2026', type: 'padrao', scope: 'SP', category: 'Mercado', icon: 'trending-up', hours: 8, modality: 'Online', edition: 'Edição 3',
      description: 'Indicadores de preço, lançamentos e tendências por região do estado de São Paulo.',
      lessons: [L('l1', 'Indicadores do mercado', '30min', false), L('l2', 'Capital x interior', '30min')] },
    { id: 'c14', title: 'Corretagem de Imóveis Rurais', type: 'padrao', scope: 'MG', category: 'Mercado', icon: 'wheat', hours: 16, modality: 'Online', edition: 'Edição 9',
      description: 'CAR, georreferenciamento, ITR e particularidades da venda de imóveis rurais.',
      lessons: [L('l1', 'Documentação rural', '35min'), L('l2', 'CAR e georreferenciamento', '35min'), L('l3', 'Avaliação de áreas rurais', '40min')] },

    // ── Exclusivos: turmas fechadas por Regional, com prova presencial ──
    { id: 'x1', title: 'Avaliação Imobiliária e PTAM', type: 'exclusivo', regional: 'SP', category: 'Avaliação', icon: 'file-check-2', hours: 60, modality: 'EAD + Presencial', edition: 'Turma SP 2026.2', seats: 40, seatsTaken: 31,
      requiresExam: true, requiresPtam: true,
      description: 'Elaboração do Parecer Técnico de Avaliação Mercadológica, com envio do PTAM em PDF e prova presencial.',
      lessons: [L('l1', 'Normas ABNT para Avaliação', '50min'), L('l2', 'Métodos de Avaliação', '45min'), L('l3', 'Elaboração do Parecer', '55min'), L('l4', 'Prova presencial', '3h', false, 'presencial')] },
    { id: 'x2', title: 'Vendas de Alto Padrão', type: 'exclusivo', regional: 'SP', category: 'Vendas', icon: 'gem', hours: 40, modality: 'EAD + Presencial', edition: 'Turma SP 2026.2', seats: 30, seatsTaken: 30,
      requiresExam: true, requiresPtam: false,
      description: 'Comportamento do cliente de luxo, network e negociação no mercado de alto padrão.',
      lessons: [L('l1', 'Perfil do Cliente de Luxo', '40min'), L('l2', 'Negociação Avançada', '45min'), L('l3', 'Prova presencial', '2h', false, 'presencial')] },
    { id: 'x3', title: 'Avaliação Imobiliária e PTAM', type: 'exclusivo', regional: 'RJ', category: 'Avaliação', icon: 'file-check-2', hours: 60, modality: 'EAD + Presencial', edition: 'Turma RJ 2026.2', seats: 35, seatsTaken: 12,
      requiresExam: true, requiresPtam: true,
      description: 'Elaboração do Parecer Técnico de Avaliação Mercadológica, com envio do PTAM em PDF e prova presencial.',
      lessons: [L('l1', 'Normas ABNT para Avaliação', '50min'), L('l2', 'Métodos de Avaliação', '45min'), L('l3', 'Elaboração do Parecer', '55min'), L('l4', 'Prova presencial', '3h', false, 'presencial')] },
    { id: 'x4', title: 'Avaliação Imobiliária e PTAM', type: 'exclusivo', regional: 'MG', category: 'Avaliação', icon: 'file-check-2', hours: 60, modality: 'EAD + Presencial', edition: 'Turma MG 2026.2', seats: 35, seatsTaken: 20,
      requiresExam: true, requiresPtam: true,
      description: 'Elaboração do Parecer Técnico de Avaliação Mercadológica, com envio do PTAM em PDF e prova presencial.',
      lessons: [L('l1', 'Normas ABNT para Avaliação', '50min'), L('l2', 'Métodos de Avaliação', '45min'), L('l3', 'Elaboração do Parecer', '55min'), L('l4', 'Prova presencial', '3h', false, 'presencial')] },
    { id: 'x5', title: 'Perícia Judicial Imobiliária', type: 'exclusivo', regional: 'PR', category: 'Avaliação', icon: 'gavel', hours: 32, modality: 'EAD + Presencial', edition: 'Turma PR 2026.1', seats: 25, seatsTaken: 8,
      requiresExam: true, requiresPtam: false,
      description: 'Atuação do corretor como perito: laudos, quesitos e audiências.',
      lessons: [L('l1', 'O corretor como perito', '40min'), L('l2', 'Laudo pericial', '45min'), L('l3', 'Prova presencial', '2h', false, 'presencial')] },
];
const courseById = id => COURSES.find(c => c.id === id);

// Banco de perguntas dos exercícios diários (3 sorteadas por aula)
const QUESTION_BANK = [
    { q: 'Qual lei regulamenta a profissão de corretor de imóveis?', options: ['Lei 8.245/91', 'Lei 6.530/78', 'Lei 10.406/02'], answer: 1 },
    { q: 'Para que serve o PTAM?', options: ['Estimar o valor de mercado de um imóvel', 'Registrar a escritura', 'Calcular o ITBI devido'], answer: 0 },
    { q: 'No sistema SAC, as parcelas de amortização são:', options: ['Crescentes', 'Decrescentes', 'Constantes'], answer: 2 },
    { q: 'A Lei do Inquilinato é a:', options: ['Lei 8.245/91', 'Lei 6.766/79', 'Lei 13.709/18'], answer: 0 },
    { q: 'A LGPD trata principalmente de:', options: ['Licenciamento ambiental', 'Proteção de dados pessoais', 'Registro de imóveis'], answer: 1 },
    { q: 'Qual é o papel do CRECI?', options: ['Conceder financiamentos', 'Emitir matrículas de imóveis', 'Fiscalizar o exercício da profissão'], answer: 2 },
];

// Progresso do corretor de demonstração
const PROGRESS = {
    simDay: SIM_DAY_START,
    enrollments: {
        // Inscrito há 3 dias: aulas 1–3 liberadas, aula 4 libera amanhã
        c1: { enrolledDay: 7, lessons: { l1: { done: true, score: null } } },
    },
    completed: { c3: { date: '15/05/2026' } },
    pending: {},     // solicitações de vaga em turmas exclusivas
    exams: {},       // courseId → { date, place, score }
    noticeShown: {}, // avisos já exibidos
};

const CERTS = [
    { id: 'cert-c3', courseId: 'c3', courseTitle: 'Fotografia de Imóveis com Smartphone', date: '15/05/2026', code: '1544-E33F', hours: 15, regional: 'SP', owner: 'corretor' },
    { id: 'cert-h1', courseId: null, courseTitle: 'Lucro Imobiliário e Legislação', date: '17/10/2025', code: '4678-B17C', hours: 30, regional: 'SP', owner: 'corretor' },
    { id: 'cert-h2', courseId: null, courseTitle: 'Captação de Imóveis Urbanos', date: '02/08/2025', code: '3291-A09D', hours: 20, regional: 'SP', owner: 'corretor' },
];
// Certificados de outros corretores (só para a validação pública)
const OTHER_CERTS = [
    { code: '8812-C04A', name: 'Ana Beatriz Costa', courseTitle: 'Avaliação Imobiliária e PTAM', date: '20/09/2026', hours: 60, regional: 'RJ' },
    { code: '5530-D71B', name: 'João da Silva', courseTitle: 'Direito Imobiliário Aplicado', date: '11/07/2026', hours: 40, regional: 'SP' },
];

const PTAM_QUEUE = [
    { id: 'p1', courseId: 'x1', corretor: 'João da Silva',     creci: 'CRECI-SP 123987-F', regional: 'SP', document: 'PTAM_Apto_Moema.pdf',        submittedAt: '28/10/2026', status: 'analyzing', note: '' },
    { id: 'p2', courseId: 'x1', corretor: 'Maria Fernandes',   creci: 'CRECI-SP 789012-F', regional: 'SP', document: 'PTAM_Casa_Alphaville.pdf',   submittedAt: '30/10/2026', status: 'analyzing', note: '' },
    { id: 'p3', courseId: 'x1', corretor: 'Carlos Eduardo',    creci: 'CRECI-SP 345678-F', regional: 'SP', document: 'PTAM_Terreno_Guarulhos.pdf', submittedAt: '01/11/2026', status: 'resubmit',  note: 'Faltam as fotos dos comparativos 3 e 4.' },
    { id: 'p4', courseId: 'x3', corretor: 'Ana Beatriz Costa', creci: 'CRECI-RJ 112233-F', regional: 'RJ', document: 'PTAM_Cobertura_Leblon.pdf',  submittedAt: '25/10/2026', status: 'completed', note: '' },
    { id: 'p5', courseId: 'x4', corretor: 'Roberto Mendes',    creci: 'CRECI-MG 556677-F', regional: 'MG', document: 'PTAM_Sala_Comercial_BH.pdf', submittedAt: '02/11/2026', status: 'analyzing', note: '' },
    { id: 'p6', courseId: 'x1', corretor: 'Fernanda Lima',     creci: 'CRECI-SP 998877-F', regional: 'SP', document: 'PTAM_Galpao_Osasco.pdf',     submittedAt: '03/11/2026', status: 'rejected',  note: 'Método comparativo aplicado sem amostra mínima.' },
];

const PTAM_STATUS = {
    analyzing: { label: 'Em análise',   badge: 'badge-warning', icon: 'hourglass' },
    completed: { label: 'Concluído',    badge: 'badge-success', icon: 'circle-check' },
    resubmit:  { label: 'Reapresentar', badge: 'badge-primary', icon: 'rotate-ccw' },
    rejected:  { label: 'Rejeitado',    badge: 'badge-danger',  icon: 'circle-x' },
};

const NOTIFS = {
    corretor: [
        { id: 'n1', icon: 'calendar-clock', title: 'Nova aula liberada', msg: 'Matemática Financeira e HP12C: a Aula 3 já está disponível.', time: 'Hoje, 07:00', read: false },
        { id: 'n2', icon: 'award', title: 'Certificado disponível', msg: 'Fotografia de Imóveis com Smartphone, 15h.', time: '15/05/2026', read: true },
    ],
    admin_regional: [
        { id: 'n3', icon: 'inbox', title: 'Novos PTAM na fila', msg: '2 pareceres aguardando análise.', time: 'Hoje, 08:12', read: false },
    ],
    admin_master: [
        { id: 'n4', icon: 'file-spreadsheet', title: 'Notas pendentes', msg: 'Provas presenciais da Turma SP 2026.2 aguardam importação.', time: 'Ontem, 17:40', read: false },
    ],
};

/* ───────────────────────── ESTADO DA UI ───────────────────────── */
const STATE = {
    loggedIn: false,
    regional: null,
    profile: null,
    emailLocal: '',
    view: null,
    loginStep: 1,
    magicExpiresAt: 0,
    magicTimer: null,
    resendTimer: null,
    resendAvailableAt: 0,
    catalog: { q: '', tipo: 'todos', categoria: 'todas', situacao: 'todas' },
    admin: { q: '', status: 'todos', regional: 'todas' },
    classroom: null,
    profileDraft: null,
    importPreview: null,
    importHistory: [],
    fontScale: 100,
};

const can = perm => !!STATE.profile && PROFILES[STATE.profile].perms.includes(perm);
const currentUser = () => (STATE.profile ? USERS[STATE.profile] : null);
const userEmail = (profile = STATE.profile) => `${(profile === STATE.profile && STATE.emailLocal) || USERS[profile].emailLocal}@creci.org.br`;

/* ───────────────────────── TEMA E FONTE ───────────────────────── */
function applyTheme(theme, persist = true) {
    const dark = theme === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    $$('.theme-toggle').forEach(btn => {
        btn.setAttribute('aria-pressed', String(dark));
        btn.title = dark ? 'Mudar para tema claro' : 'Mudar para tema escuro';
    });
    if (persist) storageSet('ead-theme', theme);
    if (typeof Scene !== 'undefined') Scene.onTheme();
}

function toggleTheme() {
    applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
}

const FONT_STEPS = [90, 100, 110, 120];
function applyFontScale(scale, persist = true) {
    STATE.fontScale = FONT_STEPS.includes(scale) ? scale : 100;
    document.documentElement.style.fontSize = `${16 * STATE.fontScale / 100}px`;
    const label = $('#font-scale-label');
    if (label) label.textContent = `${STATE.fontScale}%`;
    if (persist) storageSet('ead-font', String(STATE.fontScale));
}

function cycleFontScale() {
    const idx = FONT_STEPS.indexOf(STATE.fontScale);
    applyFontScale(FONT_STEPS[(idx + 1) % FONT_STEPS.length]);
    showToast(`Tamanho do texto: ${STATE.fontScale}%`, 'info');
}

// Padrão isométrico (cubos) do fundo, inspirado no CRECI Integra
function buildIsoPattern(stroke) {
    const cubes = [[30, 34.64], [0, 86.6], [60, 86.6], [0, -17.32], [60, -17.32]];
    const path = cubes.map(([cx, cy]) =>
        `M${cx} ${cy - 34.64}L${cx + 30} ${cy - 17.32}L${cx + 30} ${cy + 17.32}L${cx} ${cy + 34.64}L${cx - 30} ${cy + 17.32}L${cx - 30} ${cy - 17.32}Z` +
        `M${cx} ${cy}L${cx} ${cy + 34.64}M${cx} ${cy}L${cx - 30} ${cy - 17.32}M${cx} ${cy}L${cx + 30} ${cy - 17.32}`
    ).join('');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='103.92' viewBox='0 0 60 103.92'><path d='${path}' fill='none' stroke='${stroke}' stroke-width='0.7'/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* ───────────────────────── FUNDO ANIMADO DO LOGIN ─────────────────────────
   Cena minimalista em traço fino, a mesma nos dois temas (só mudam as cores):
   • skyline de prédios e casas que "sobe" ao abrir a página, com janelas que
     acendem e apagam devagar (estudo à noite);
   • ícones de estudo e imóveis (capelo, livro, lápis, casa, chave, prédio,
     certificado, pino de mapa) subindo lentamente;
   • lua com estrelas piscando (escuro) ou sol com raios girando e nuvens (claro);
   • de tempos em tempos, um aviãozinho de papel cruza a tela deixando rastro
     pontilhado, e no escuro passa uma estrela cadente.
   Com "reduzir movimento" ativo, desenha um quadro estático. */
const SCENE_ICONS = {
    house: 'M3 11 L12 4 L21 11 M5 9.5 V20 H19 V9.5 M10 20 V14 H14 V20',
    cap: 'M2 9 L12 4.5 L22 9 L12 13.5 Z M6 11 V16 C8 17.5 10 18 12 18 C14 18 16 17.5 18 16 V11 M22 9 V14.5',
    book: 'M12 6.5 C10 5 6.5 4.5 3 5 V19 C6.5 18.5 10 19 12 20.5 C14 19 17.5 18.5 21 19 V5 C17.5 4.5 14 5 12 6.5 Z M12 6.5 V20.5',
    pencil: 'M4 20 L5 15.5 L16 4.5 L19.5 8 L8.5 19 Z M14 6.5 L17.5 10',
    key: 'M10.5 15.5 A3.5 3.5 0 1 1 3.5 15.5 A3.5 3.5 0 1 1 10.5 15.5 Z M9.5 13 L20 2.5 M16 6.5 L19 9.5 M18 4.5 L20.5 7',
    building: 'M5 21 V4.5 L13 3 V21 M13 9 H19 V21 M3 21 H21 M8 7.5 H10 M8 11 H10 M8 14.5 H10 M15.5 12.5 H16.5 M15.5 16 H16.5',
    award: 'M17 8.5 A5 5 0 1 1 7 8.5 A5 5 0 1 1 17 8.5 Z M9.2 12.6 L7.8 21 L12 18.7 L16.2 21 L14.8 12.6',
    pin: 'M12 21 C12 21 5 14.5 5 9.5 A7 7 0 0 1 19 9.5 C19 14.5 12 21 12 21 Z M14.5 9.5 A2.5 2.5 0 1 1 9.5 9.5 A2.5 2.5 0 1 1 14.5 9.5 Z',
};
const PLANE_PATH = 'M2 11 L22 3 L15 21 L11 13 Z M11 13 L22 3';

const SCENE_PALETTE = {
    dark: {
        icon: a => `rgba(165,198,245,${a})`, gold: a => `rgba(212,180,106,${a + 0.04})`,
        bFill: 'rgba(5,16,40,0.55)', bStroke: 'rgba(140,175,230,0.20)',
        winLit: a => `rgba(242,207,115,${a})`, winOff: a => `rgba(165,198,245,${a})`,
        ground: 'rgba(212,180,106,0.25)', trail: 'rgba(212,180,106,0.35)', plane: 'rgba(230,237,247,0.45)',
    },
    light: {
        icon: a => `rgba(29,78,160,${a * 1.15})`, gold: a => `rgba(154,116,32,${a + 0.06})`,
        bFill: 'rgba(255,255,255,0.7)', bStroke: 'rgba(29,78,160,0.22)',
        winLit: a => `rgba(217,150,30,${a * 0.85})`, winOff: a => `rgba(29,78,160,${a * 1.4})`,
        ground: 'rgba(154,116,32,0.32)', trail: 'rgba(29,78,160,0.3)', plane: 'rgba(29,78,160,0.5)',
    },
};

const Scene = {
    canvas: null, ctx: null, raf: 0, last: 0, t: 0, intro: 0, w: 0, h: 0, dark: true,
    paths: {}, plane: null, buildings: [], windows: [], floaters: [], stars: [], clouds: [],
    flight: null, nextFlight: 4, meteor: null, nextMeteor: 6,

    init() {
        this.canvas = $('#login-scene');
        if (!this.canvas || !this.canvas.getContext) return;
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx || typeof Path2D !== 'function') { this.ctx = null; return; }
        Object.entries(SCENE_ICONS).forEach(([k, d]) => { this.paths[k] = new Path2D(d); });
        this.plane = new Path2D(PLANE_PATH);
        this.dark = document.documentElement.classList.contains('dark');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    onTheme() {
        this.dark = document.documentElement.classList.contains('dark');
        if (this.ctx && !this.raf) this.draw(0);
    },

    resize() {
        if (!this.ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.layout();
        this.draw(0);
    },

    skylineMax() { return Math.min(190, this.h * 0.24); },

    layout() {
        let seed = 20261111;
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const maxH = this.skylineMax();

        this.buildings = [];
        let x = -8;
        while (x < this.w + 8) {
            const house = rnd() < 0.2;
            const bw = house ? 38 + rnd() * 18 : 30 + rnd() * 52;
            const bh = house ? 34 + rnd() * 12 : 55 + rnd() * (maxH - 55);
            this.buildings.push({ x, bw, bh, house, antenna: !house && rnd() < 0.25 });
            x += bw + 5 + rnd() * 12;
        }

        this.windows = [];
        this.buildings.forEach((b, bi) => {
            if (b.house) return;
            const cols = Math.max(1, Math.floor((b.bw - 10) / 11));
            const rows = Math.max(1, Math.floor((b.bh - 14) / 15));
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
                this.windows.push({ bi, dx: 7 + c * 11, dy: 9 + r * 15, lit: rnd() < 0.2, phase: rnd() * Math.PI * 2, speed: 0.15 + rnd() * 0.5 });
            }
        });

        const skyH = this.h - maxH;
        this.stars = Array.from({ length: Math.round(Math.min(70, this.w / 22)) }, () => ({
            x: rnd() * this.w, y: rnd() * skyH * 0.75, r: 0.6 + rnd() * 0.9, phase: rnd() * Math.PI * 2, speed: 0.6 + rnd() * 1.6,
        }));
        this.clouds = Array.from({ length: this.w > 900 ? 4 : 2 }, (_, i) => ({
            x: rnd() * this.w, y: 60 + rnd() * skyH * 0.45, s: 0.7 + rnd() * 0.6, speed: 5 + rnd() * 7 + i,
        }));

        const n = Math.round(Math.min(20, Math.max(8, (this.w * this.h) / 85000)));
        this.floaters = Array.from({ length: n }, () => this.spawn(true));
    },

    spawn(initial) {
        const keys = Object.keys(SCENE_ICONS);
        const skylineTop = this.h - this.skylineMax();
        return {
            icon: keys[Math.floor(Math.random() * keys.length)],
            x: Math.random() * this.w,
            y: initial ? Math.random() * skylineTop : this.h + 30,
            size: 18 + Math.random() * 20,
            speed: 5 + Math.random() * 9,
            rot: (Math.random() - 0.5) * 0.6,
            vr: (Math.random() - 0.5) * 0.08,
            alpha: 0.07 + Math.random() * 0.09,
            gold: Math.random() < 0.22,
            sway: Math.random() * Math.PI * 2,
        };
    },

    drawCelestial(p) {
        const { ctx, w, h, t } = this;
        const r = w < 640 ? 20 : 30;
        const cx = w * (w < 640 ? 0.86 : 0.9), cy = h * 0.16 + Math.sin(t * 0.3) * 4;
        const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 3.2);
        glow.addColorStop(0, this.dark ? 'rgba(200,215,245,0.14)' : 'rgba(244,190,70,0.22)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, r * 3.2, 0, Math.PI * 2); ctx.fill();

        if (this.dark) {
            // Lua crescente
            ctx.save();
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
            ctx.fillStyle = 'rgba(226,234,248,0.16)'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath(); ctx.arc(cx + r * 0.45, cy - r * 0.25, r * 0.88, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            ctx.strokeStyle = 'rgba(226,234,248,0.22)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 0.05, Math.PI * 1.45); ctx.stroke();
        } else {
            // Sol com raios girando
            ctx.fillStyle = 'rgba(244,190,70,0.20)'; ctx.strokeStyle = 'rgba(217,150,30,0.5)'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.lineCap = 'round';
            for (let i = 0; i < 12; i++) {
                const a = t * 0.12 + (i * Math.PI) / 6;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * (r + 7), cy + Math.sin(a) * (r + 7));
                ctx.lineTo(cx + Math.cos(a) * (r + 15), cy + Math.sin(a) * (r + 15));
                ctx.stroke();
            }
        }
    },

    drawCloud(c) {
        const { ctx } = this;
        const s = c.s;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(s, s);
        ctx.beginPath();
        ctx.moveTo(-40, 12);
        ctx.arc(-22, 4, 14, Math.PI * 0.75, Math.PI * 1.6);
        ctx.arc(0, -4, 20, Math.PI * 1.15, Math.PI * 1.95);
        ctx.arc(26, 4, 14, Math.PI * 1.4, Math.PI * 0.25);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.strokeStyle = 'rgba(29,78,160,0.16)';
        ctx.lineWidth = 1 / s;
        ctx.fill(); ctx.stroke();
        ctx.restore();
    },

    updateEvents(dt) {
        const { w, h } = this;
        // Aviãozinho de papel
        if (!this.flight) {
            this.nextFlight -= dt;
            if (this.nextFlight <= 0) {
                const y0 = h * (0.45 + Math.random() * 0.2);
                this.flight = { p: 0, dur: 7 + Math.random() * 3, x0: -40, y0, x1: w + 40, y1: y0 - h * (0.2 + Math.random() * 0.15), arc: 40 + Math.random() * 50 };
            }
        } else {
            this.flight.p += dt / this.flight.dur;
            if (this.flight.p >= 1) { this.flight = null; this.nextFlight = 8 + Math.random() * 6; }
        }
        // Estrela cadente (só no escuro)
        if (this.dark) {
            if (!this.meteor) {
                this.nextMeteor -= dt;
                if (this.nextMeteor <= 0) this.meteor = { p: 0, x: w * (0.2 + Math.random() * 0.6), y: h * (0.05 + Math.random() * 0.2), len: 120 + Math.random() * 80 };
            } else {
                this.meteor.p += dt / 1.1;
                if (this.meteor.p >= 1) { this.meteor = null; this.nextMeteor = 7 + Math.random() * 8; }
            }
        }
    },

    flightPoint(f, p) {
        return { x: f.x0 + (f.x1 - f.x0) * p, y: f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * f.arc };
    },

    draw(dt) {
        const { ctx, w, h } = this;
        if (!ctx || !w) return;
        const pal = this.dark ? SCENE_PALETTE.dark : SCENE_PALETTE.light;
        if (dt) this.updateEvents(dt);
        ctx.clearRect(0, 0, w, h);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Céu: estrelas (escuro) ou nuvens (claro), e lua/sol
        if (this.dark) {
            this.stars.forEach(s => {
                const a = 0.12 + 0.38 * (0.5 + 0.5 * Math.sin(this.t * s.speed + s.phase));
                ctx.fillStyle = `rgba(226,234,248,${a})`;
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
            });
        } else {
            this.clouds.forEach(c => {
                if (dt) { c.x += c.speed * dt; if (c.x > w + 80) c.x = -80; }
                this.drawCloud(c);
            });
        }
        this.drawCelestial();

        if (this.meteor && this.dark) {
            const m = this.meteor;
            const hx = m.x + m.p * m.len * 1.6, hy = m.y + m.p * m.len * 0.6;
            const g = ctx.createLinearGradient(hx - m.len * 0.8, hy - m.len * 0.3, hx, hy);
            g.addColorStop(0, 'rgba(226,234,248,0)');
            g.addColorStop(1, `rgba(226,234,248,${0.6 * (1 - m.p)})`);
            ctx.strokeStyle = g; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(hx - m.len * 0.8, hy - m.len * 0.3); ctx.lineTo(hx, hy); ctx.stroke();
        }

        // Ícones de estudo e imóveis
        this.floaters.forEach((f, i) => {
            if (dt) { f.y -= f.speed * dt; f.rot += f.vr * dt; }
            if (f.y < -50) { this.floaters[i] = this.spawn(false); return; }
            const x = f.x + Math.sin(this.t * 0.35 + f.sway) * 14;
            const s = f.size / 24;
            ctx.save();
            ctx.translate(x, f.y);
            ctx.rotate(f.rot);
            ctx.scale(s, s);
            ctx.translate(-12, -12);
            ctx.lineWidth = 1.4 / s;
            ctx.strokeStyle = f.gold ? pal.gold(f.alpha) : pal.icon(f.alpha);
            ctx.stroke(this.paths[f.icon]);
            ctx.restore();
        });

        // Aviãozinho de papel com rastro pontilhado
        if (this.flight) {
            const f = this.flight;
            ctx.save();
            ctx.setLineDash([3, 6]);
            ctx.strokeStyle = pal.trail; ctx.lineWidth = 1.2;
            ctx.beginPath();
            const start = Math.max(0, f.p - 0.35);
            for (let q = start; q <= f.p; q += 0.01) { const pt = this.flightPoint(f, q); if (q === start) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); }
            ctx.stroke();
            ctx.restore();
            const pt = this.flightPoint(f, f.p), nx = this.flightPoint(f, Math.min(1, f.p + 0.01));
            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.rotate(Math.atan2(nx.y - pt.y, nx.x - pt.x) + 0.38);
            ctx.scale(1.3, 1.3);
            ctx.translate(-12, -12);
            ctx.lineWidth = 1.2; ctx.strokeStyle = pal.plane;
            ctx.stroke(this.plane);
            ctx.restore();
        }

        // Skyline sobe ao abrir (intro), depois fica parado
        ctx.lineWidth = 1;
        const grow = this.buildings.map((b, i) => {
            const k = Math.min(1, Math.max(0, (this.intro - i * 0.035) / 0.9));
            return 1 - Math.pow(1 - k, 3);
        });
        this.buildings.forEach((b, i) => {
            const bh = b.bh * grow[i];
            if (bh < 1) return;
            const top = h - bh;
            ctx.fillStyle = pal.bFill;
            ctx.strokeStyle = pal.bStroke;
            ctx.beginPath();
            if (b.house) {
                const roof = bh * 0.45;
                ctx.moveTo(b.x, h); ctx.lineTo(b.x, top + roof); ctx.lineTo(b.x + b.bw / 2, top); ctx.lineTo(b.x + b.bw, top + roof); ctx.lineTo(b.x + b.bw, h);
                ctx.fill(); ctx.stroke();
                if (grow[i] === 1) ctx.strokeRect(b.x + b.bw / 2 - 4.5, h - 13, 9, 13);
            } else {
                ctx.rect(b.x + 0.5, top + 0.5, b.bw, bh);
                ctx.fill(); ctx.stroke();
                if (b.antenna && grow[i] === 1) { ctx.beginPath(); ctx.moveTo(b.x + b.bw / 2, top); ctx.lineTo(b.x + b.bw / 2, top - 14); ctx.stroke(); }
            }
        });

        this.windows.forEach(win => {
            if (grow[win.bi] < 1) return;
            const b = this.buildings[win.bi];
            const a = win.lit ? 0.10 + 0.32 * (0.5 + 0.5 * Math.sin(this.t * win.speed + win.phase)) : 0.035;
            ctx.fillStyle = win.lit ? pal.winLit(a) : pal.winOff(a);
            ctx.fillRect(b.x + win.dx, h - b.bh + win.dy, 5, 7);
        });

        ctx.strokeStyle = pal.ground;
        ctx.beginPath(); ctx.moveTo(0, h - 0.5); ctx.lineTo(w, h - 0.5); ctx.stroke();
    },

    loop(ts) {
        const dt = this.last ? Math.min(0.05, (ts - this.last) / 1000) : 0;
        this.last = ts;
        this.t += dt;
        this.intro += dt;
        this.draw(dt);
        this.raf = requestAnimationFrame(tt => this.loop(tt));
    },

    start() {
        if (!this.ctx) return;
        this.stop();
        this.dark = document.documentElement.classList.contains('dark');
        this.intro = REDUCED_MOTION ? 99 : 0;
        this.resize();
        if (REDUCED_MOTION) return;
        this.last = 0;
        this.raf = requestAnimationFrame(tt => this.loop(tt));
    },

    stop() {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = 0;
    },
};

/* ───────────────────────── LOGIN ───────────────────────── */
function renderLoginOptions() {
    renderRegionalCards(REGIONAIS);
    const count = $('#regional-count');
    if (count) count.textContent = REGIONAIS.length;

    $('#profile-options').innerHTML = Object.entries(PROFILES).map(([key, p]) => `
        <button class="profile-option" onclick="selectProfile('${key}')">
            <span class="ico"><i data-lucide="${p.icon}"></i></span>
            <span><b>${p.label}</b><small>${p.desc}</small></span>
        </button>`).join('');
    icons();
}

function renderRegionalCards(list) {
    const grid = $('#regional-grid');
    if (!grid) return;
    grid.innerHTML = list.length ? list.map((r, i) => `
        <button class="regional-card" style="--i:${i}" onclick="selectRegional('${r.sigla}')" aria-label="Acessar CRECI-${r.sigla}, ${r.regiao}, ${r.estado}">
            <span class="ead-badge" aria-hidden="true"><span><b>EAD</b><small>CRECI</small></span></span>
            <b>CRECI-${r.sigla}</b><small>${r.regiao}</small><em>${r.estado}</em>
            <span class="regional-cta">Acessar <i data-lucide="arrow-right"></i></span>
        </button>`).join('')
        : '<p class="regional-empty">Nenhuma Regional encontrada. Tente a sigla (ex.: SP) ou o nome do estado.</p>';
    icons();
}

// Busca por sigla, estado ou número da região (ignora acentos)
function filterRegionals(query) {
    const q = normalize(String(query || '').trim()).replace(/^creci-?/, '');
    if (!q) return renderRegionalCards(REGIONAIS);
    const exact = REGIONAIS.filter(r => normalize(r.sigla) === q); // sigla exata tem prioridade (ex.: 'sp' não traz Espírito Santo)
    if (exact.length) return renderRegionalCards(exact);
    renderRegionalCards(REGIONAIS.filter(r =>
        normalize(r.sigla) === q || normalize(r.estado).includes(q) || normalize(r.sigla).startsWith(q) || String(r.n) === q.replace(/[^0-9]/g, '')));
}

function showLoginStep(step) {
    STATE.loginStep = step;
    for (let i = 1; i <= 4; i++) {
        const el = $(`#login-step-${i}`);
        if (!el) continue;
        el.hidden = i !== step;
        if (i === step) { el.classList.remove('animate-in'); void el.offsetWidth; el.classList.add('animate-in'); }
    }
    $$('#login-stepper > div').forEach(d => {
        const s = Number(d.dataset.step);
        d.classList.toggle('done', s < step);
        d.classList.toggle('current', s === step);
    });
    if (step !== 4) stopMagicTimers();
    if (step === 3) setTimeout(() => $('#login-email')?.focus(), 60);
}

function selectRegional(sigla) {
    STATE.regional = sigla;
    const r = regionalInfo(sigla);
    const label = `CRECI-${r.sigla} · ${r.regiao} · ${r.estado}`;
    $('#chip-regional-2').textContent = label;
    $('#chip-regional-3').textContent = label;
    showLoginStep(2);
}

function selectProfile(profile) {
    if (!PROFILES[profile]) return;
    STATE.profile = profile;
    $('#step3-profile').textContent = PROFILES[profile].short;
    const input = $('#login-email');
    input.value = USERS[profile].emailLocal;
    setEmailError('');
    showLoginStep(3);
}

function setEmailError(msg) {
    const err = $('#login-email-error');
    const input = $('#login-email');
    err.textContent = msg;
    err.hidden = !msg;
    input.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

function submitEmail(event) {
    if (event) event.preventDefault();
    let value = ($('#login-email').value || '').trim().toLowerCase();

    if (value.includes('@')) {
        const [local, domain] = value.split('@');
        if (domain !== 'creci.org.br') return setEmailError('Use o seu e-mail institucional @creci.org.br.');
        value = local;
    }
    if (!value) return setEmailError('Informe o seu e-mail institucional.');
    if (!/^[a-z0-9]+([._][a-z0-9]+)*$/.test(value)) return setEmailError('Caracteres especiais não são aceitos (ex.: / ( % &).');

    setEmailError('');
    STATE.emailLocal = value;
    $('#sent-email').textContent = `${value}@creci.org.br`;
    startMagicTimers();
    showLoginStep(4);
    showToast('Link de acesso enviado (simulação).', 'success');
}

function startMagicTimers() {
    stopMagicTimers();
    STATE.magicExpiresAt = Date.now() + 20 * 60 * 1000;
    STATE.resendAvailableAt = Date.now() + 30 * 1000;
    const tick = () => {
        const left = Math.max(0, STATE.magicExpiresAt - Date.now());
        const mm = String(Math.floor(left / 60000)).padStart(2, '0');
        const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
        const cd = $('#magic-countdown');
        if (cd) { cd.textContent = left ? `${mm}:${ss}` : 'Expirado'; cd.classList.toggle('expired', !left); }
        const openBtn = $('#btn-open-magic');
        if (openBtn) openBtn.disabled = !left;

        const resend = $('#btn-resend');
        const wait = Math.ceil((STATE.resendAvailableAt - Date.now()) / 1000);
        if (resend) {
            resend.disabled = wait > 0;
            resend.textContent = wait > 0 ? `Reenviar em ${wait}s` : 'Reenviar link';
        }
        if (!left) stopMagicTimers();
    };
    tick();
    STATE.magicTimer = setInterval(tick, 1000);
}

function stopMagicTimers() {
    if (STATE.magicTimer) clearInterval(STATE.magicTimer);
    STATE.magicTimer = null;
}

function resendLink() {
    if (Date.now() < STATE.resendAvailableAt) return;
    startMagicTimers();
    showToast('Novo link enviado. O anterior deixou de valer.', 'info');
}

function openMagicLink() {
    if (!STATE.regional || !STATE.profile) { showLoginStep(1); return; }
    if (Date.now() > STATE.magicExpiresAt) { showToast('O link expirou. Solicite um novo.', 'error'); return; }
    stopMagicTimers();
    enterApp();
}

function enterApp() {
    STATE.loggedIn = true;
    const login = $('#app-login');
    login.classList.add('leaving');
    setTimeout(() => {
        login.hidden = true;
        login.classList.remove('leaving');
        Scene.stop();
        $('#app-main').hidden = false;
        $('#bottom-nav').hidden = false;
        STATE.view = null;
        renderChrome();
        switchView(PROFILES[STATE.profile].home);
        const first = currentUser().name.split(' ')[0];
        showToast(`Bem-vindo(a), ${first}!`, 'success');
    }, REDUCED_MOTION ? 0 : 380);
}

function logout() {
    closeDropdowns();
    closeModal();
    toggleSidebar(false);
    STATE.loggedIn = false;
    STATE.profile = null;
    STATE.regional = null;
    STATE.emailLocal = '';
    STATE.view = null;
    STATE.importPreview = null;
    $('#app-main').hidden = true;
    $('#bottom-nav').hidden = true;
    $('#app-login').hidden = false;
    const search = $('#regional-search');
    if (search) { search.value = ''; renderRegionalCards(REGIONAIS); }
    showLoginStep(1);
    Scene.start();
}

/* ───────────────────────── CHROME (sidebar, topbar) ───────────────────────── */
function avatarHTML(user, size = 'sm') {
    if (!user) return '';
    if (user.photo) return `<span class="avatar avatar-${size}"><img src="${esc(user.photo)}" alt="Foto de ${esc(user.name)}"></span>`;
    return `<span class="avatar avatar-${size}" aria-hidden="true">${esc(initials(user.name))}</span>`;
}

function renderChrome() {
    const user = currentUser();
    if (!user) return;
    const r = regionalInfo(STATE.regional);

    // Permissões: mostra/oculta seções e itens
    $$('[data-perm]').forEach(el => { el.hidden = !can(el.dataset.perm); });

    $('#sidebar-regional').textContent = `CRECI-${r.sigla} · ${r.estado}`;
    $('#topbar-title').textContent = can('all_regions') ? 'COFECI · Todas as Regionais' : `CRECI-${r.sigla} · ${r.regiao}`;
    $('#topbar-sub').textContent = PROFILES[STATE.profile].label;
    $('#topbar-avatar').innerHTML = avatarHTML(user, 'sm');
    $('#dd-user-avatar').innerHTML = avatarHTML(user, 'md');
    $('#dd-user-name').textContent = user.name;
    $('#dd-user-email').textContent = userEmail();

    updatePtamCount();
    renderNotifs();
    icons();
}

function updatePtamCount() {
    const el = $('#nav-count-ptam');
    if (!el) return;
    const n = visiblePtam().filter(p => p.status === 'analyzing').length;
    el.textContent = n;
    el.hidden = !n;
}

function toggleNavSection(btn) {
    const section = btn.closest('.nav-section');
    const collapsed = section.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', String(!collapsed));
}

function toggleSidebar(force) {
    const mobile = window.innerWidth < 1024; // celular e tablet usam gaveta
    if (force === false) { document.body.classList.remove('sidebar-open'); return; }
    if (mobile) document.body.classList.toggle('sidebar-open');
    else document.body.classList.toggle('sidebar-collapsed');
}

/* Dropdowns */
function toggleDropdown(id, event) {
    if (event) event.stopPropagation();
    const dd = $(`#${id}`);
    if (!dd) return;
    const willOpen = !dd.classList.contains('open');
    closeDropdowns();
    if (willOpen) dd.classList.add('open');
}

function closeDropdowns() { $$('.dropdown.open').forEach(d => d.classList.remove('open')); }

/* Notificações */
function pushNotif(profile, notif) {
    NOTIFS[profile] = NOTIFS[profile] || [];
    NOTIFS[profile].unshift({ id: `n${Date.now()}${Math.random().toString(16).slice(2, 6)}`, time: 'Agora', read: false, ...notif });
    if (profile === STATE.profile) renderNotifs();
}

function renderNotifs() {
    const list = NOTIFS[STATE.profile] || [];
    const unread = list.filter(n => !n.read).length;
    const badge = $('#notif-badge');
    badge.textContent = unread > 9 ? '9+' : unread;
    badge.hidden = !unread;
    $('#notif-btn').classList.toggle('has-unread', !!unread);
    $('#notif-list').innerHTML = list.length ? list.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}">
            <span class="dot"></span>
            <div class="min-w-0">
                <div class="font-semibold">${esc(n.title)}</div>
                <div class="text-muted" style="font-size:.76rem">${esc(n.msg)}</div>
                <div class="label-mono" style="margin-top:.3rem;font-size:.58rem">${esc(n.time)}</div>
            </div>
        </div>`).join('') : `<div class="empty"><i data-lucide="bell-off"></i><p>Nenhuma notificação.</p></div>`;
    icons();
}

function markAllNotifsRead() {
    (NOTIFS[STATE.profile] || []).forEach(n => { n.read = true; });
    renderNotifs();
}

/* ───────────────────────── NAVEGAÇÃO ───────────────────────── */
const VIEW_PERMS = { 'meus-cursos': 'learn', catalogo: 'catalog', certificados: 'validate', admin: 'ptam_queue', notas: 'import_grades' };

function switchView(view) {
    if (!STATE.loggedIn) return;
    if (!VIEW_PERMS[view] || !can(VIEW_PERMS[view])) view = PROFILES[STATE.profile].home;
    STATE.view = view;

    $$('.nav-link[data-view], .bottom-nav-item[data-view]').forEach(el => {
        const active = el.dataset.view === view;
        el.classList.toggle('active', active);
        if (active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
    });
    toggleSidebar(false);
    renderView();
    const main = $('#main');
    if (main) main.scrollTop = 0;
}

function renderView() {
    const root = $('#view-root');
    if (!root || !STATE.loggedIn) return;
    const renderers = {
        'meus-cursos': viewMeusCursos,
        catalogo: viewCatalogo,
        certificados: viewCertificados,
        admin: viewAdmin,
        notas: viewNotas,
    };
    try {
        root.innerHTML = `<div class="animate-in">${(renderers[STATE.view] || viewMeusCursos)()}</div>`;
    } catch (err) {
        console.error(err);
        root.innerHTML = `<div class="alert alert-danger"><i data-lucide="triangle-alert"></i><div>Não foi possível carregar esta tela. Detalhe técnico: ${esc(err.message)}</div></div>`;
    }
    if (STATE.view === 'catalogo') updateCatalogGrid();
    if (STATE.view === 'admin') updateAdminTable();
    icons();
}

// Re-renderiza a tela atual sem a animação de entrada (após ações)
function refresh() {
    if (!STATE.loggedIn) return;
    const main = $('#main');
    const top = main ? main.scrollTop : 0;
    renderView();
    const wrapper = $('#view-root > .animate-in');
    if (wrapper) wrapper.classList.remove('animate-in');
    if (main) main.scrollTop = top;
    updatePtamCount();
}

/* ───────────────────────── COMPONENTES ───────────────────────── */
function pageHeader({ icon, crumb, title, subtitle, actions = '' }) {
    return `
    <div class="page-header">
        <div class="page-header-icon"><i data-lucide="${icon}"></i></div>
        <div class="page-header-body">
            <div class="label-mono">${crumb}</div>
            <h1>${title}</h1>
            <p>${subtitle}</p>
        </div>
        ${actions ? `<div class="page-header-actions">${actions}</div>` : ''}
    </div>`;
}

function kpi({ label, value, icon, tone = '', hint = '' }) {
    return `
    <div class="panel kpi">
        <div class="kpi-top"><span class="label-mono">${label}</span><span class="kpi-icon ${tone ? `tone-${tone}` : ''}"><i data-lucide="${icon}"></i></span></div>
        <div class="kpi-value">${value}</div>
        ${hint ? `<div class="kpi-hint">${hint}</div>` : ''}
    </div>`;
}

function emptyState(icon, title, text, action = '') {
    return `<div class="empty"><i data-lucide="${icon}"></i><h4>${title}</h4><p>${text}</p>${action}</div>`;
}

function simDayControl() {
    return `
    <div class="flex items-center gap-2 panel" style="padding:.35rem .4rem .35rem .75rem">
        <span class="label-mono" title="Data usada pela simulação de liberação diária">Hoje (simulado)</span>
        <span class="font-mono text-sm font-bold">${todayStr()}</span>
        <button class="btn btn-secondary btn-sm" onclick="advanceDay()" title="Simula a passagem de um dia"><i data-lucide="calendar-plus"></i> +1 dia</button>
    </div>`;
}

/* ───────────────────────── REGRAS: CURSOS ───────────────────────── */
function isCompleted(courseId) { return !!PROGRESS.completed[courseId]; }
function isEnrolled(courseId) { return !!PROGRESS.enrollments[courseId]; }
function isPending(courseId) { return !!PROGRESS.pending[courseId]; }

function courseStatus(courseId) {
    if (isCompleted(courseId)) return 'completed';
    if (isEnrolled(courseId)) return 'enrolled';
    if (isPending(courseId)) return 'pending';
    return 'available';
}

// Cursos que o perfil enxerga no catálogo
function visibleCourses() {
    if (can('all_regions')) return COURSES;
    return COURSES.filter(c =>
        c.type === 'exclusivo' ? c.regional === STATE.regional : (c.scope === 'Nacional' || c.scope === STATE.regional));
}

function lessonRelease(courseId, idx) {
    const enr = PROGRESS.enrollments[courseId];
    return enr ? enr.enrolledDay + 1 + idx : Infinity; // Aula 1 no dia seguinte à inscrição
}

function lessonState(course, idx) {
    const lesson = course.lessons[idx];
    if (isCompleted(course.id)) return { key: 'done' };
    const enr = PROGRESS.enrollments[course.id];
    if (!enr) return { key: 'locked', reason: 'Inscrição necessária' };
    const lp = enr.lessons[lesson.id] || {};
    if (lp.done) return { key: 'done', score: lp.score };

    const release = lessonRelease(course.id, idx);
    if (PROGRESS.simDay < release) {
        const diff = release - PROGRESS.simDay;
        return { key: 'locked', reason: diff === 1 ? `Libera amanhã (${fmtDay(release)})` : `Libera em ${fmtDay(release)}` };
    }
    if (idx > 0) {
        const prev = course.lessons[idx - 1];
        if (!(enr.lessons[prev.id] || {}).done) return { key: 'locked', reason: 'Conclua a aula anterior' };
    }
    if (lesson.type === 'presencial') {
        const exam = PROGRESS.exams[course.id];
        if (exam && exam.score != null) return exam.score >= 6 ? { key: 'done', score: exam.score } : { key: 'failed', reason: `Nota ${exam.score.toFixed(1)}: abaixo de 6,0` };
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

function enrollCourse(courseId) {
    const course = courseById(courseId);
    if (!course) return;
    if (isCompleted(courseId)) return showToast('Você já concluiu este curso. Não é possível se inscrever de novo, mas o conteúdo continua disponível para consulta.', 'warning');
    if (isEnrolled(courseId)) return openClassroom(courseId);
    if (course.type === 'exclusivo') return requestSeat(courseId);

    PROGRESS.enrollments[courseId] = { enrolledDay: PROGRESS.simDay, lessons: {} };
    showToast(`Inscrição confirmada em "${course.title}". A Aula 1 será liberada amanhã (${fmtDay(PROGRESS.simDay + 1)}).`, 'success');
    pushNotif('corretor', { icon: 'book-open-check', title: 'Inscrição confirmada', msg: `${course.title}: a Aula 1 abre em ${fmtDay(PROGRESS.simDay + 1)}.` });
    refresh();
}

function requestSeat(courseId) {
    const course = courseById(courseId);
    if (!course) return;
    if (course.regional !== STATE.regional) return showToast(`Turma exclusiva da CRECI-${course.regional}. Ela não está disponível para a sua Regional.`, 'error');
    if (course.seatsTaken >= course.seats) return showToast('A turma está lotada. Aguarde a abertura de uma nova turma.', 'warning');
    if (isPending(courseId) || isEnrolled(courseId)) return;

    PROGRESS.pending[courseId] = { requestedAt: todayStr() };
    showToast(`Solicitação de vaga enviada para "${course.title}".`, 'info');
    refresh();

    // Simula a aprovação pela Regional
    setTimeout(() => {
        if (!PROGRESS.pending[courseId]) return;
        delete PROGRESS.pending[courseId];
        course.seatsTaken += 1;
        PROGRESS.enrollments[courseId] = { enrolledDay: PROGRESS.simDay, lessons: {} };
        pushNotif('corretor', { icon: 'circle-check', title: 'Vaga aprovada', msg: `${course.title} (${course.edition}).` });
        if (STATE.loggedIn && STATE.profile === 'corretor') {
            showToast(`Vaga aprovada pela CRECI-${course.regional}: ${course.title}.`, 'success');
            refresh();
        }
    }, 2200);
}

function advanceDay() {
    PROGRESS.simDay += 1;
    const released = [];
    Object.keys(PROGRESS.enrollments).forEach(id => {
        const course = courseById(id);
        course.lessons.forEach((l, idx) => { if (lessonRelease(id, idx) === PROGRESS.simDay) released.push(`${course.title}: ${l.title}`); });
    });
    if (released.length) {
        showToast(`Novo dia (${todayStr()}). Aula liberada: ${released[0]}${released.length > 1 ? ` e mais ${released.length - 1}` : ''}.`, 'success');
        released.forEach(r => pushNotif('corretor', { icon: 'calendar-clock', title: 'Nova aula liberada', msg: r }));
    } else {
        showToast(`Novo dia simulado: ${todayStr()}.`, 'info');
    }
    refresh();
    if (STATE.classroom) renderClassroom();
}

function completeCourse(courseId) {
    const course = courseById(courseId);
    if (!course || isCompleted(courseId)) return;
    delete PROGRESS.enrollments[courseId];
    PROGRESS.completed[courseId] = { date: todayStr() };
    const code = `${String(1000 + (hashStr(courseId + Date.now()) % 9000))}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    CERTS.unshift({ id: `cert-${courseId}-${Date.now()}`, courseId, courseTitle: course.title, date: todayStr(), code, hours: course.hours, regional: course.regional || STATE.regional || 'SP', owner: 'corretor' });
    pushNotif('corretor', { icon: 'award', title: 'Certificado disponível', msg: `${course.title}, ${course.hours}h. Código ${code}.` });

    if (STATE.profile === 'corretor') showToast(`Parabéns! Você concluiu "${course.title}". O certificado já está em Meus Certificados.`, 'success');
    else showToast(`${STUDENT_NAME()} concluiu "${course.title}" e já pode emitir o certificado.`, 'success');
}

// Verifica se o curso cumpriu todas as condições de conclusão
function checkCompletion(courseId) {
    const course = courseById(courseId);
    const enr = PROGRESS.enrollments[courseId];
    if (!course || !enr || isCompleted(courseId)) return;

    const onlineDone = course.lessons.every(l => l.type === 'presencial' || (enr.lessons[l.id] || {}).done);
    if (!onlineDone) return;

    if (course.requiresExam) {
        const exam = PROGRESS.exams[courseId];
        if (!exam || exam.score == null || exam.score < 6) {
            if (!PROGRESS.noticeShown[`exam-${courseId}`] && STATE.profile === 'corretor') {
                PROGRESS.noticeShown[`exam-${courseId}`] = true;
                showToast('Aulas online concluídas! Agora falta a prova presencial.', 'info');
            }
            return;
        }
    }
    if (course.requiresPtam) {
        const ptam = studentPtam(courseId);
        if (!ptam || ptam.status !== 'completed') return;
    }
    completeCourse(courseId);
}

/* ───────────────────────── VIEW: MEUS CURSOS ───────────────────────── */
function viewMeusCursos() {
    const user = currentUser();
    const enrolled = Object.keys(PROGRESS.enrollments).map(courseById).filter(Boolean);
    const pending = Object.keys(PROGRESS.pending).map(courseById).filter(Boolean);
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
        subtitle: `Olá, ${esc(firstName)}. Acompanhe os cursos em andamento e os que você já concluiu.`,
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

    <div class="section-title">Em andamento</div>
    <div class="panel">
        ${enrolled.length || pending.length ? `
            ${enrolled.map(enrolledRow).join('')}
            ${pending.map(c => `
            <div class="course-row">
                <div class="course-row-icon thumb-exclusivo"><i data-lucide="${c.icon}"></i></div>
                <div class="flex-1 min-w-[200px]">
                    <div class="flex flex-wrap gap-2 mb-1"><span class="badge badge-gold">Exclusivo</span><span class="badge badge-warning"><i data-lucide="hourglass"></i> Aguardando aprovação</span></div>
                    <div class="font-bold">${esc(c.title)}</div>
                    <div class="text-xs text-muted mt-1">${esc(c.edition)} · pedido feito em ${esc(PROGRESS.pending[c.id].requestedAt)}</div>
                </div>
            </div>`).join('')}
        ` : emptyState('book-open', 'Nenhum curso em andamento', 'Escolha um curso no catálogo para começar.', `<button class="btn btn-primary" onclick="switchView('catalogo')"><i data-lucide="library"></i> Ver todos os cursos</button>`)}
    </div>

    <div class="section-title">Concluídos</div>
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

/* ───────────────────────── VIEW: TODOS OS CURSOS ───────────────────────── */
function viewCatalogo() {
    const f = STATE.catalog;
    const isAdmin = !can('learn');
    const hasExclusive = visibleCourses().some(c => c.type === 'exclusivo');
    return `
    ${pageHeader({
        icon: 'library',
        crumb: isAdmin ? 'Gestão / Catálogo' : 'Aprendizagem / Todos os Cursos',
        title: isAdmin ? 'Catálogo de cursos' : 'Todos os Cursos',
        subtitle: isAdmin
            ? (can('all_regions') ? 'Todos os cursos publicados, de todas as Regionais.' : `Cursos disponíveis para os corretores da CRECI-${esc(STATE.regional)}.`)
            : 'Cursos padrão abrem para inscrição na hora. Os exclusivos são turmas fechadas da sua Regional.',
    })}

    <div class="panel mb-5">
        <div class="filter-bar">
            <div style="flex:2 1 240px">
                <label class="field-label" for="cat-q">Buscar</label>
                <div class="input-icon"><i data-lucide="search"></i><input id="cat-q" class="input" type="search" placeholder="Nome do curso ou assunto" value="${esc(f.q)}" oninput="setCatalogFilter('q', this.value)"></div>
            </div>
            <div>
                <label class="field-label" for="cat-tipo">Modalidade</label>
                <select id="cat-tipo" class="select" onchange="setCatalogFilter('tipo', this.value)">
                    ${[['todos', 'Todas'], ['padrao', 'Padrão'], ['exclusivo', 'Exclusivo (turma regional)']].map(([v, l]) => `<option value="${v}" ${f.tipo === v ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="field-label" for="cat-cat">Categoria</label>
                <select id="cat-cat" class="select" onchange="setCatalogFilter('categoria', this.value)">
                    <option value="todas">Todas</option>
                    ${CATEGORIAS.map(c => `<option ${f.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            ${!isAdmin ? `
            <div>
                <label class="field-label" for="cat-sit">Situação</label>
                <select id="cat-sit" class="select" onchange="setCatalogFilter('situacao', this.value)">
                    ${[['todas', 'Todas'], ['available', 'Disponível'], ['enrolled', 'Em andamento'], ['completed', 'Concluído']].map(([v, l]) => `<option value="${v}" ${f.situacao === v ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </div>` : ''}
        </div>
    </div>

    <div class="flex items-center justify-between mb-3">
        <span class="label-mono" id="catalog-count"></span>
        <button class="btn btn-ghost btn-sm" onclick="clearCatalogFilters()"><i data-lucide="filter-x"></i> Limpar filtros</button>
    </div>
    ${!hasExclusive && !isAdmin ? `<div class="alert alert-info mb-4"><i data-lucide="info"></i><div>Não há turmas exclusivas abertas na CRECI-${esc(STATE.regional)} no momento.</div></div>` : ''}
    <div id="catalog-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"></div>`;
}

function setCatalogFilter(key, value) {
    STATE.catalog[key] = value;
    updateCatalogGrid();
}

function clearCatalogFilters() {
    STATE.catalog = { q: '', tipo: 'todos', categoria: 'todas', situacao: 'todas' };
    refresh();
}

function normalize(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

function updateCatalogGrid() {
    const grid = $('#catalog-grid');
    if (!grid) return;
    const f = STATE.catalog;
    const q = normalize(f.q.trim());
    const list = visibleCourses().filter(c =>
        (f.tipo === 'todos' || c.type === f.tipo) &&
        (f.categoria === 'todas' || c.category === f.categoria) &&
        (f.situacao === 'todas' || !can('learn') || courseStatus(c.id) === f.situacao || (f.situacao === 'enrolled' && courseStatus(c.id) === 'pending')) &&
        (!q || normalize(`${c.title} ${c.description} ${c.category}`).includes(q)));

    const count = $('#catalog-count');
    if (count) count.textContent = `${list.length} curso${list.length === 1 ? '' : 's'} encontrado${list.length === 1 ? '' : 's'}`;

    grid.innerHTML = list.length
        ? list.map(courseCard).join('')
        : `<div class="panel sm:col-span-2 xl:col-span-3">${emptyState('search-x', 'Nenhum curso encontrado', 'Tente outro termo ou limpe os filtros.')}</div>`;
    icons();
}

function courseCard(c) {
    const excl = c.type === 'exclusivo';
    const status = courseStatus(c.id);
    const full = excl && c.seatsTaken >= c.seats;
    let action;
    if (!can('learn')) {
        action = `<button class="btn btn-secondary btn-sm" onclick="openClassroom('${c.id}', true)"><i data-lucide="eye"></i> Ver conteúdo</button>`;
    } else if (status === 'completed') {
        action = `<button class="btn btn-ghost btn-sm" onclick="openClassroom('${c.id}', true)"><i data-lucide="eye"></i> Consultar</button>`;
    } else if (status === 'enrolled') {
        action = `<button class="btn btn-primary btn-sm" onclick="openClassroom('${c.id}')"><i data-lucide="play-circle"></i> Continuar</button>`;
    } else if (status === 'pending') {
        action = `<button class="btn btn-secondary btn-sm" disabled><i data-lucide="hourglass"></i> Aguardando</button>`;
    } else if (excl) {
        action = full
            ? `<button class="btn btn-secondary btn-sm" disabled>Turma lotada</button>`
            : `<button class="btn btn-gold btn-sm" onclick="requestSeat('${c.id}')"><i data-lucide="ticket"></i> Solicitar vaga</button>`;
    } else {
        action = `<button class="btn btn-primary btn-sm" onclick="enrollCourse('${c.id}')"><i data-lucide="plus"></i> Inscrever-se</button>`;
    }

    const statusBadge = { completed: '<span class="badge badge-success"><i data-lucide="check"></i> Concluído</span>', enrolled: '<span class="badge badge-primary">Em andamento</span>', pending: '<span class="badge badge-warning">Vaga solicitada</span>' }[status] || '';
    const scopeLabel = excl ? `Turma CRECI-${c.regional}` : (c.scope === 'Nacional' ? 'Nacional' : `Regional · CRECI-${c.scope}`);

    return `
    <article class="panel course-card">
        <div class="course-thumb ${excl ? 'thumb-exclusivo' : 'thumb-padrao'}">
            <span class="badge ${excl ? 'badge-gold' : 'badge-primary'}">${excl ? 'Exclusivo' : 'Padrão'}</span>
            <i data-lucide="${c.icon}"></i>
        </div>
        <div class="p-4 flex flex-col flex-1">
            <div class="flex items-center justify-between gap-2 mb-1">
                <span class="label-mono" style="color:rgb(var(${excl ? '--c-gold' : '--c-primary'}))">${esc(c.category)} · ${esc(scopeLabel)}</span>
                ${can('learn') ? statusBadge : ''}
            </div>
            <h3 class="font-bold leading-snug mb-1.5">${esc(c.title)}</h3>
            <p class="text-xs text-muted line-clamp-2 mb-3">${esc(c.description)}</p>
            <div class="course-meta mb-3">
                <span><i data-lucide="clock"></i> ${c.hours}h</span>
                <span><i data-lucide="list-video"></i> ${c.lessons.length} aulas</span>
                <span><i data-lucide="${excl ? 'map-pin' : 'monitor'}"></i> ${esc(c.modality)}</span>
                ${excl ? `<span><i data-lucide="users"></i> ${c.seatsTaken}/${c.seats} vagas</span>` : ''}
            </div>
            ${excl ? `<div class="text-[11px] text-muted mb-3 flex items-center gap-1.5"><i data-lucide="info" style="width:13px;height:13px"></i> Prova presencial${c.requiresPtam ? ' + envio do PTAM em PDF' : ''}</div>` : ''}
            <div class="mt-auto pt-3 border-t border-line flex items-center justify-between gap-2">
                <span class="text-[11px] text-muted font-mono">${esc(c.edition)}</span>
                ${action}
            </div>
        </div>
    </article>`;
}

/* ───────────────────────── SALA DE AULA ───────────────────────── */
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
            lesson.quiz ? 'Exercício (mín. 60%)' : '',
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
        <div class="alert alert-info mb-4"><i data-lucide="calendar-days"></i><div class="flex-1">As aulas abrem uma por dia, a partir do dia seguinte à inscrição. Hoje (simulado): <b class="font-mono">${todayStr()}</b>.</div><button class="btn btn-secondary btn-sm" onclick="advanceDay()"><i data-lucide="calendar-plus"></i> +1 dia</button></div>`}

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
            <div class="alert ${res.passed ? 'alert-success' : 'alert-danger'}">
                <i data-lucide="${res.passed ? 'circle-check' : 'circle-x'}"></i>
                <div class="flex-1">${res.passed ? `Você acertou <b>${res.score}%</b>. Aula concluída!` : `Você acertou <b>${res.score}%</b>. O mínimo é 60%. Revise o conteúdo e tente de novo.`}</div>
            </div>
            <div class="flex gap-2">
                ${res.passed ? `<button type="button" class="btn btn-primary" onclick="backToLessons()"><i data-lucide="list"></i> Voltar às aulas</button>` : `<button type="button" class="btn btn-primary" onclick="retryQuiz()"><i data-lucide="rotate-ccw"></i> Tentar novamente</button>`}
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

    const correct = questions.filter((q, qi) => cr.answers[qi] === q.answer).length;
    const score = Math.round(correct / questions.length * 100);
    const passed = score >= 60;
    cr.result = { score, passed };

    const enr = PROGRESS.enrollments[course.id];
    if (enr) {
        enr.lessons[lesson.id] = { ...(enr.lessons[lesson.id] || {}), score, done: passed || !!(enr.lessons[lesson.id] || {}).done };
    }
    showToast(passed ? `Exercício aprovado: ${score}%.` : `Você fez ${score}%. O mínimo é 60%.`, passed ? 'success' : 'error');
    if (passed) checkCompletion(course.id);

    if (isCompleted(course.id)) { closeModal(); refresh(); return; }
    renderClassroom();
    refresh();
}

function retryQuiz() {
    const cr = STATE.classroom;
    if (!cr) return;
    cr.answers = {};
    cr.result = null;
    renderClassroom();
}

function completeLesson() {
    const cr = STATE.classroom;
    if (!cr) return;
    const course = courseById(cr.courseId);
    const lesson = course.lessons[cr.lessonIdx];
    const enr = PROGRESS.enrollments[course.id];
    if (!enr) return;
    enr.lessons[lesson.id] = { ...(enr.lessons[lesson.id] || {}), done: true, score: null };
    showToast(`Aula "${lesson.title}" concluída.`, 'success');
    checkCompletion(course.id);
    if (isCompleted(course.id)) { closeModal(); refresh(); return; }
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
        <div class="alert alert-info mb-4"><i data-lucide="map-pin"></i><div>A prova presencial é feita na sede da Regional. A nota é lançada pela administração (importação de planilha) e precisa ser <b>6,0 ou mais</b>.</div></div>`;

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

/* ───────────────────────── VIEW: CERTIFICADOS ───────────────────────── */
function viewCertificados() {
    const mine = can('learn') ? CERTS.filter(c => c.owner === 'corretor') : [];
    const isStudent = can('learn');
    return `
    ${pageHeader({
        icon: 'award',
        crumb: isStudent ? 'Aprendizagem / Certificados' : 'Gestão / Certificados',
        title: isStudent ? 'Meus Certificados' : 'Validar certificado',
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
                <div><div class="panel-title">Validar autenticidade</div><div class="panel-sub">Digite o código impresso no certificado</div></div>
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
                    <div class="brand-mark"><i data-lucide="graduation-cap"></i></div>
                    <div style="text-align:left"><div style="font-weight:800">EAD CRECI</div><div style="font:600 .55rem 'JetBrains Mono',monospace;letter-spacing:.16em;color:#64748b">SISTEMA COFECI · CRECI</div></div>
                </div>
                <div style="font:600 .66rem 'JetBrains Mono',monospace;letter-spacing:.2em;color:#9a7b2c">CERTIFICADO DE CONCLUSÃO</div>
                <div style="width:70px;height:2px;background:#b8953b;margin:.7rem auto 1.1rem"></div>
                <p style="color:#475569;margin:0">Certificamos que</p>
                <p style="font-family:'Source Serif 4',Georgia,serif;font-size:1.6rem;font-weight:600;margin:.3rem 0 .6rem">${esc(USERS.corretor.name)}</p>
                <p style="color:#475569;margin:0">concluiu com aproveitamento o curso</p>
                <p style="font-size:1.1rem;font-weight:700;color:#1d4ed8;margin:.35rem 0 .8rem">${esc(cert.courseTitle)}</p>
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

/* ───────────────────────── VIEW: ADMIN (PTAM) ───────────────────────── */
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

/* ───────────────────────── VIEW: NOTAS PRESENCIAIS (master) ───────────────────────── */
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
                            <td><span class="badge ${r.score >= 6 ? 'badge-success' : 'badge-danger'}">${r.score >= 6 ? 'Aprovado' : 'Reprovado'}</span></td>
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
        if (enr && presencial && r.score >= 6) enr.lessons[presencial.id] = { done: true, score: r.score };
        pushNotif('corretor', { icon: 'clipboard-check', title: 'Nota da prova lançada', msg: `${course.title}: ${r.score.toFixed(1)}.` });
        checkCompletion(r.courseId);
    });
    STATE.importHistory.unshift({ file: prev.file, date: todayStr(), rows: prev.rows.length, approved: prev.rows.filter(r => r.score >= 6).length });
    STATE.importPreview = null;
    showToast(`${prev.rows.length} notas importadas.`, 'success');
    refresh();
}

/* ───────────────────────── PERFIL ───────────────────────── */
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

/* ───────────────────────── MODAL ───────────────────────── */
let lastFocus = null;

function openModal({ title, icon = 'info', body = '', footer = '', size = '' }) {
    const overlay = $('#modal');
    const box = $('#modal-box');
    const wasOpen = overlay.classList.contains('active');
    const bodyEl = $('#modal-body');
    const keepScroll = wasOpen ? bodyEl.scrollTop : 0;

    $('#modal-title').textContent = title;
    $('#modal-icon').innerHTML = `<i data-lucide="${icon}"></i>`;
    bodyEl.innerHTML = body;
    $('#modal-footer').innerHTML = footer;
    box.className = `modal ${size ? `size-${size}` : ''}`;

    if (!wasOpen) {
        lastFocus = document.activeElement;
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        bodyEl.scrollTop = 0;
        setTimeout(() => box.querySelector('.modal-header .icon-btn')?.focus(), 30);
    } else {
        bodyEl.scrollTop = keepScroll;
    }
    icons();
}

function closeModal() {
    const overlay = $('#modal');
    if (!overlay || !overlay.classList.contains('active')) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    STATE.classroom = null;
    STATE.profileDraft = null;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

/* ───────────────────────── TOASTS ───────────────────────── */
function showToast(message, type = 'info') {
    const stack = $('#toast-stack');
    if (!stack) return;
    const iconName = { success: 'circle-check', error: 'circle-x', warning: 'triangle-alert', info: 'info' }[type] || 'info';
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = `<i data-lucide="${iconName}"></i><span></span>`;
    toast.querySelector('span').textContent = message;
    stack.appendChild(toast);
    icons();
    while (stack.children.length > 4) stack.firstElementChild.remove();
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, type === 'error' ? 5200 : 4200);
}

/* ───────────────────────── EVENTOS GLOBAIS ───────────────────────── */
document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dropdown]')) closeDropdowns();
    if (e.target.id === 'modal') closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if ($('.dropdown.open')) closeDropdowns();
        else if ($('#modal').classList.contains('active')) closeModal();
        else toggleSidebar(false);
    }
});

window.addEventListener('error', (e) => {
    console.error('[EAD CRECI]', e.error || e.message);
});

/* ───────────────────────── INICIALIZAÇÃO ───────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Padrões isométricos (claro/escuro) como variáveis CSS
    const root = document.documentElement.style;
    root.setProperty('--iso-light', buildIsoPattern('rgba(29,78,160,0.07)'));
    root.setProperty('--iso-dark', buildIsoPattern('rgba(148,180,230,0.07)'));

    applyTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light', false);
    applyFontScale(Number(storageGet('ead-font')) || 100, false);

    renderLoginOptions();
    showLoginStep(1);
    Scene.init();
    Scene.start();
    icons();

    // Segue o tema do sistema enquanto o usuário não escolher um manualmente
    if (window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = ev => { if (!storageGet('ead-theme')) applyTheme(ev.matches ? 'dark' : 'light', false); };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
    }

    if (!window.lucide) console.warn('Lucide não carregou: os ícones não serão exibidos (verifique a conexão).');
});
