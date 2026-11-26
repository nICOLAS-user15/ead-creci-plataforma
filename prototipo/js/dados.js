/*
 * Dados fictícios: Regionais, perfis, usuários, cursos, questões, progresso, certificados, fila PTAM e notificações.
 * Tudo fica em memória e volta ao estado inicial quando a página é recarregada.
 */
'use strict';

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
        home: 'catalogo',
    },
    admin_regional: {
        label: 'Administrador Regional', short: 'administrador regional', icon: 'shield',
        desc: 'Alunos, turmas e pareceres apenas da sua Regional',
        perms: ['ptam_queue', 'catalog', 'validate', 'reports'],
        home: 'admin',
    },
    admin_master: {
        label: 'Administrador Master', short: 'administrador master', icon: 'shield-check',
        desc: 'Gestão global, todas as Regionais e importação de notas',
        perms: ['ptam_queue', 'import_grades', 'catalog', 'validate', 'all_regions', 'reports', 'create_course'],
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
        c1: { enrolledDay: 7, lessons: { l1: { done: true, score: null, doneDay: 8 } } },
    },
    completed: { c3: { date: '15/05/2026' } },
    history: [],     // resultados encerrados (reprovações). RN-14: o histórico sobrevive à eliminação da inscrição
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
