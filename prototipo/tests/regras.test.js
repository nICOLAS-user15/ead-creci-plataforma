// Executar: node --test prototipo/tests
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../regras.js');

test('RN-10: 60% exato aprova; 59,x% reprova (sem arredondar para cima)', () => {
    assert.equal(R.aprovadoPadrao(3, 5), true);    // 60,0%
    assert.equal(R.aprovadoPadrao(6, 10), true);
    assert.equal(R.aprovadoPadrao(29, 49), false); // 59,18% (arredondaria p/ 59)
    assert.equal(R.aprovadoPadrao(149, 249), false); // 59,84% arredondaria para 60 e não pode aprovar
    assert.equal(R.percentual(149, 249), 60);      // exibição arredonda...
    assert.equal(R.aprovadoPadrao(1, 2), false);   // 50%
});

test('RN-09 Exclusivo: nota 6,0 aprova; 5,9 reprova; nota ausente não aprova', () => {
    assert.equal(R.aprovadoExclusivo(6), true);
    assert.equal(R.aprovadoExclusivo(5.9), false);
    assert.equal(R.aprovadoExclusivo(5.33), false); // exemplo da tela de edição de nota (D2 s22)
    assert.equal(R.aprovadoExclusivo(null), false);
    assert.equal(R.aprovadoExclusivo('abc'), false);
});

test('RN-04: aula 1 libera no dia seguinte; demais 24 h após concluir a anterior', () => {
    const aulas = [{ concluidaDia: null }, { concluidaDia: null }, { concluidaDia: null }];
    assert.equal(R.diaLiberacaoAula(0, 7, aulas), 8);
    assert.equal(R.diaLiberacaoAula(1, 7, aulas), Infinity); // anterior não concluída
    aulas[0].concluidaDia = 8;
    assert.equal(R.diaLiberacaoAula(1, 7, aulas), 9);
    aulas[1].concluidaDia = 12;                               // concluiu atrasado
    assert.equal(R.diaLiberacaoAula(2, 7, aulas), 13);        // 24 h depois, não "um por dia" fixo
});

test('RN-04: concluir a aula 1 no mesmo dia em que ela abre não adianta a aula 2', () => {
    const aulas = [{ concluidaDia: 8 }, { concluidaDia: null }];
    assert.equal(R.diaLiberacaoAula(1, 7, aulas), 9);
});

test('RN-07/RN-13: prazo encerrado avalia o aproveitamento; questão não respondida conta como erro', () => {
    const base = { totalQuestoes: 12, totalAulas: 4, inscricaoDia: 10, prazoDias: 30 };
    // 1 aula feita, 3/3 certas: 3 de 12 = 25%
    let r = R.avaliarPadrao({ ...base, acertos: 3, aulasConcluidas: 1, diaAtual: 41 });
    assert.equal(r.status, 'reprovado');
    assert.equal(r.motivo, 'prazo-encerrado');
    // 3 aulas feitas e todas certas: 9 de 12 = 75% -> aprovado pelo aproveitamento (D2 s5)
    r = R.avaliarPadrao({ ...base, acertos: 9, aulasConcluidas: 3, diaAtual: 41 });
    assert.equal(r.status, 'aprovado');
});

test('RN-07: no último dia do prazo o aluno ainda participa', () => {
    const e = { totalQuestoes: 12, totalAulas: 4, inscricaoDia: 10, prazoDias: 30, acertos: 3, aulasConcluidas: 1 };
    assert.equal(R.avaliarPadrao({ ...e, diaAtual: 40 }).status, 'andamento');
    assert.equal(R.avaliarPadrao({ ...e, diaAtual: 41 }).status, 'reprovado');
});

test('RN-11: concluir a última aula decide na hora', () => {
    const e = { totalQuestoes: 12, totalAulas: 4, aulasConcluidas: 4, diaAtual: 15, inscricaoDia: 10, prazoDias: 30 };
    assert.equal(R.avaliarPadrao({ ...e, acertos: 8 }).status, 'aprovado');   // 66%
    assert.equal(R.avaliarPadrao({ ...e, acertos: 7 }).status, 'reprovado');  // 58%
    assert.equal(R.avaliarPadrao({ ...e, acertos: 7 }).motivo, 'ultima-aula');
});

test('RN-12/RN-13: aprovado não repete; reprovado Padrão repete; reprovado Exclusivo só em outra turma', () => {
    assert.equal(R.podeInscrever({ tipo: 'padrao', aprovado: true }).motivo, 'ja-aprovado');
    assert.equal(R.podeInscrever({ tipo: 'padrao', aprovado: false, reprovadoNestaTurma: true }).ok, true);
    assert.equal(R.podeInscrever({ tipo: 'exclusivo', aprovado: false, reprovadoNestaTurma: true }).ok, false);
    assert.equal(R.podeInscrever({ tipo: 'padrao', inscritoAgora: true }).motivo, 'ja-inscrito');
});

test('Exclusivo: sem nota fica em andamento; abaixo de 6 reprova', () => {
    assert.equal(R.avaliarExclusivo(null).status, 'andamento');
    assert.equal(R.avaliarExclusivo(8.5).status, 'aprovado');
    assert.equal(R.avaliarExclusivo(5).status, 'reprovado');
});

test('RF-23: coringas do certificado são substituídos; desconhecidos ficam visíveis', () => {
    const v = { nome_curso: 'Perito Judicial', dt_inicio_curso: '01/03/2027', dt_fim_curso: '31/03/2027' };
    assert.equal(R.preencherCoringas(R.TEXTO_CERTIFICADO_PADRAO, v),
        'por ter concluído o curso Perito Judicial, com início em 01/03/2027 e término em 31/03/2027.');
    assert.equal(R.preencherCoringas('curso [nome_curso_x]', v), 'curso [nome_curso_x]');
    assert.equal(R.preencherCoringas('fim [dt_fim_curso]', { nome_curso: 'x' }), 'fim —');
    assert.equal(R.preencherCoringas(null, v), '');
});

test('RF-22: validação do cadastro de curso', () => {
    const ok = { titulo: 'IA', tipo: 'padrao', aulas: ['Aula 1'], prazoDias: 30 };
    assert.deepEqual(R.validarCurso(ok), []);
    assert.equal(R.validarCurso({ ...ok, titulo: '  ' })[0].campo, 'titulo');
    assert.equal(R.validarCurso({ ...ok, aulas: [''] })[0].campo, 'aulas');
    assert.equal(R.validarCurso({ ...ok, aulas: ['A', ''] })[0].mensagem, 'Há aula sem título. Preencha ou remova.');
    assert.equal(R.validarCurso({ ...ok, prazoDias: 0 })[0].campo, 'prazoDias');

    const ex = { titulo: 'X', tipo: 'exclusivo', aulas: ['A'], vagas: 20,
        inscricaoDe: '2027-01-01', inscricaoAte: '2027-01-31', turmaDe: '2027-02-01', turmaAte: '2027-03-01' };
    assert.deepEqual(R.validarCurso(ex), []);
    assert.equal(R.validarCurso({ ...ex, turmaDe: '' })[0].campo, 'datas');
    assert.match(R.validarCurso({ ...ex, inscricaoAte: '2026-12-01' })[0].mensagem, /fim das inscrições/);
    assert.match(R.validarCurso({ ...ex, turmaDe: '2026-12-15' })[0].mensagem, /antes de abrir/);
    assert.equal(R.validarCurso({ ...ex, vagas: 0 })[0].campo, 'vagas');
    assert.equal(R.validarCurso({ ...ex, turmaDe: '' })[0].aba, 'inscricao');
});
