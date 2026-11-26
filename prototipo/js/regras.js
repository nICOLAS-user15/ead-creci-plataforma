/*
 * Regras de negócio da Plataforma EAD CRECI.
 *
 * Funções puras: não acessam a página nem o estado global. Recebem dados e devolvem decisões.
 * No sistema real, estas funções serão o núcleo do back-end. Aqui rodam no navegador e também
 * no Node (tests/regras.test.js), o que permite testar cada regra sem abrir a tela.
 *
 * Origem das regras: docs/requisitos.md (RN-xx).
 * Premissas ainda sem resposta do gestor: docs/lacunas-e-perguntas.md.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.Regras = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const APROVACAO_MINIMA_PCT = 60;     // RN-10: pelo menos 60% no Resultado Final
    const QUESTOES_POR_EXERCICIO = 3;    // premissa do protótipo (múltipla escolha)
    const PRAZO_ATIVIDADE_HORAS = 48;    // RN-06 (consequência do atraso: pergunta L-03)
    const ATRASO_LIBERACAO_DIAS = 1;     // RN-04: 24 h (L-01)

    /* Percentual com arredondamento só para exibição. */
    function percentual(acertos, total) {
        return total > 0 ? Math.round((acertos / total) * 100) : 100;
    }

    /* RN-10 sem erro de arredondamento: 59,6% NÃO pode virar 60%.
       Compara inteiros: acertos/total >= 60/100  <=>  acertos*100 >= 60*total */
    function aprovadoPadrao(acertos, total) {
        if (total <= 0) return true;
        return acertos * 100 >= APROVACAO_MINIMA_PCT * total;
    }

    /* RN-09 (Exclusivo): resultado = prova presencial. Nota 0 a 10 (L-05):
       6,0 equivale a 60%. Arredonda para 1 casa para não perder 5,99. */
    function aprovadoExclusivo(nota) {
        if (nota === null || nota === undefined || Number.isNaN(Number(nota))) return false;
        return Math.round(Number(nota) * 10) >= APROVACAO_MINIMA_PCT;
    }

    /* RN-04: dia em que a aula `idx` é liberada.
       - Aula 1: dia seguinte à inscrição.
       - Demais: só depois de concluir a atividade da anterior, mais 24 h.
       `aulas` = [{ concluidaDia: number|null }, ...]  (dia simulado em que concluiu)
       Retorna Infinity enquanto a anterior não foi concluída. */
    function diaLiberacaoAula(idx, inscricaoDia, aulas) {
        const primeira = inscricaoDia + ATRASO_LIBERACAO_DIAS;
        if (idx === 0) return primeira;
        const anterior = aulas[idx - 1];
        if (!anterior || anterior.concluidaDia === null || anterior.concluidaDia === undefined) return Infinity;
        return Math.max(primeira, anterior.concluidaDia + ATRASO_LIBERACAO_DIAS);
    }

    /* RN-07: último dia de participação em curso Padrão. */
    function diaLimiteCurso(inscricaoDia, prazoDias) {
        return inscricaoDia + prazoDias;
    }

    /* RN-09 a RN-13 para curso PADRÃO.
       Entrada: { acertos, totalQuestoes, aulasConcluidas, totalAulas,
                  diaAtual, inscricaoDia, prazoDias }
       `totalQuestoes` conta TODAS as questões do curso: o que não foi
       respondido conta como erro (RN-09: "total de questões de todos os exercícios").
       Saída: { status: 'andamento'|'aprovado'|'reprovado', pct, motivo } */
    function avaliarPadrao(e) {
        const pct = percentual(e.acertos, e.totalQuestoes);
        const concluiuTudo = e.aulasConcluidas >= e.totalAulas;
        const prazoEncerrado = e.diaAtual > diaLimiteCurso(e.inscricaoDia, e.prazoDias);

        if (concluiuTudo || prazoEncerrado) {
            const ok = aprovadoPadrao(e.acertos, e.totalQuestoes);
            return {
                status: ok ? 'aprovado' : 'reprovado',
                pct,
                motivo: concluiuTudo ? 'ultima-aula' : 'prazo-encerrado',
            };
        }
        return { status: 'andamento', pct, motivo: null };
    }

    /* RN-09 a RN-13 para curso EXCLUSIVO: decide pela nota da prova presencial. */
    function avaliarExclusivo(nota) {
        if (nota === null || nota === undefined) return { status: 'andamento', pct: null, motivo: null };
        return {
            status: aprovadoExclusivo(nota) ? 'aprovado' : 'reprovado',
            pct: Math.round(Number(nota) * 10),
            motivo: 'prova-presencial',
        };
    }

    /* RN-12 / RN-13: pode se inscrever? Aprovado não repete; reprovado repete (Padrão).
       Em Exclusivo, reprovado só em OUTRA turma (premissa; pergunta L-09). */
    function podeInscrever({ tipo, aprovado, inscritoAgora, reprovadoNestaTurma }) {
        if (inscritoAgora) return { ok: false, motivo: 'ja-inscrito' };
        if (aprovado) return { ok: false, motivo: 'ja-aprovado' };
        if (tipo === 'exclusivo' && reprovadoNestaTurma) return { ok: false, motivo: 'reprovado-nesta-turma' };
        return { ok: true, motivo: null };
    }

    /* RF-23: coringas do texto do certificado (D2 s18).
       Coringa desconhecido, como [nome_curso_], fica como está, para o admin perceber o erro. */
    const TEXTO_CERTIFICADO_PADRAO =
        'por ter concluído o curso [nome_curso], com início em [dt_inicio_curso] e término em [dt_fim_curso].';

    function preencherCoringas(texto, valores) {
        return String(texto || '').replace(/\[(nome_curso|dt_inicio_curso|dt_fim_curso)\]/g,
            (_, chave) => (valores && valores[chave] != null && valores[chave] !== '' ? valores[chave] : '—'));
    }

    /* RF-22: validação do cadastro de curso. Devolve lista de erros (vazia = válido),
       cada um com a aba onde o admin deve corrigir. */
    function validarCurso(c) {
        const erros = [];
        const aulasValidas = (c.aulas || []).filter(t => String(t || '').trim());
        if (!String(c.titulo || '').trim()) erros.push({ aba: 'estrutura', campo: 'titulo', mensagem: 'Informe o nome do curso.' });
        if (!aulasValidas.length) erros.push({ aba: 'estrutura', campo: 'aulas', mensagem: 'Inclua ao menos uma aula com título.' });
        if ((c.aulas || []).length !== aulasValidas.length && aulasValidas.length) erros.push({ aba: 'estrutura', campo: 'aulas', mensagem: 'Há aula sem título. Preencha ou remova.' });
        if (c.tipo === 'padrao') {
            if (!(Number(c.prazoDias) >= 1)) erros.push({ aba: 'inscricao', campo: 'prazoDias', mensagem: 'O prazo de participação deve ter ao menos 1 dia.' });
        } else {
            const datas = [c.inscricaoDe, c.inscricaoAte, c.turmaDe, c.turmaAte];
            if (datas.some(d => !d)) erros.push({ aba: 'inscricao', campo: 'datas', mensagem: 'Informe as datas de inscrição e da turma.' });
            else if (c.inscricaoAte < c.inscricaoDe) erros.push({ aba: 'inscricao', campo: 'datas', mensagem: 'O fim das inscrições não pode ser antes do início.' });
            else if (c.turmaAte < c.turmaDe) erros.push({ aba: 'inscricao', campo: 'datas', mensagem: 'O fim da turma não pode ser antes do início.' });
            else if (c.turmaDe < c.inscricaoDe) erros.push({ aba: 'inscricao', campo: 'datas', mensagem: 'A turma não pode começar antes de abrir as inscrições.' });
            if (!(Number(c.vagas) >= 1)) erros.push({ aba: 'inscricao', campo: 'vagas', mensagem: 'Informe ao menos 1 vaga.' });
        }
        return erros;
    }

    return {
        TEXTO_CERTIFICADO_PADRAO, preencherCoringas, validarCurso,
        APROVACAO_MINIMA_PCT, QUESTOES_POR_EXERCICIO, PRAZO_ATIVIDADE_HORAS, ATRASO_LIBERACAO_DIAS,
        percentual, aprovadoPadrao, aprovadoExclusivo,
        diaLiberacaoAula, diaLimiteCurso,
        avaliarPadrao, avaliarExclusivo, podeInscrever,
    };
});
