# Auditoria e Melhorias do Projeto (16/11/2026)

## Diagnóstico

| Camada | Situação encontrada |
|--------|---------------------|
| **Back-end** | **Não existe.** O que o `app.js` chama de "simulador de backend" é estado em memória misturado com a tela, num arquivo de 2.400 linhas. Nenhuma regra era testável |
| **Regras de negócio** | Divergiam dos PPTX em pontos centrais (ver tabela 1) |
| **Telas** | Faltavam Relatórios e Criar Curso; abas fora da ordem e nomes diferentes do PPTX; manual do aluno com regras antigas |
| **Design / acessibilidade** | Visual coeso, mas: foco escapava do modal com Tab; botões e ícones com 30–36 px de altura (mínimo recomendado para toque: 44 px); rótulos de 9 px |

## 1. Regras de negócio

| Regra | Antes | Depois | Por quê |
|-------|-------|--------|---------|
| RN-10 aprovação | Cada exercício exigia 60 %, com tentativas ilimitadas; o curso concluía sem checar nota final | Nota final = Σ acertos ÷ Σ questões de todos os exercícios; ≥ 60 % aprova | D1 s2. Antes, ninguém podia ser reprovado |
| Arredondamento | — | Compara inteiros (`acertos×100 ≥ 60×total`), nunca o valor arredondado | 59,84 % arredonda para 60 e aprovaria indevidamente |
| RN-13 reprovação | Não existia | Reprova por nota ou por prazo; perde o acesso; vai para o histórico; Padrão pode se reinscrever; Exclusivo não repete a mesma turma | D1 s2, D2 s26 (relatório lista reprovações) |
| RN-07 prazo do curso | Não existia | Padrão tem prazo em dias; ao vencer, o sistema avalia (questão não respondida conta como erro) | D2 s5 |
| RN-04 liberação | Uma aula por dia fixa | Aula 1 no dia seguinte; demais 24 h após o exercício anterior | D1 s2 / D2 s5, hipótese L-01 |
| Inscrição | Botão "Solicitar vaga" com aprovação simulada | Termos de Participação com aceite obrigatório | D2 s5–s7. O fluxo anterior era invenção |
| Exclusivo reprovado | Aluno ficava preso, "procure a Regional" | Perde acesso à turma, entra no histórico | D1 s2 |
| Nota de prova | `>= 6` espalhado em 4 lugares | Uma função, `aprovadoExclusivo` | Uma regra, um lugar |

**Estrutura nova:** [prototipo/regras.js](../prototipo/regras.js) concentra as decisões em funções puras, sem DOM. É o trecho que irá para o servidor na etapa 6, e já roda no Node. Por isso é testável: [prototipo/tests/regras.test.js](../prototipo/tests/regras.test.js).

## 2. Telas novas e ajustadas

- **Relatórios** (D2 s24–s31): filtros por aluno, período, curso (vários), resultado (vários) e Regional (vários, só Master). KPIs, tabela e exportação CSV. O Admin Regional só enxerga a própria Regional (RN-15).
- **Criar Curso** (D2 s15–s18): três abas (Estrutura, Inscrição e Participação, Certificado), validação com salto para a aba do erro, coringas `[nome_curso]`, `[dt_inicio_curso]`, `[dt_fim_curso]` com pré-visualização. O texto configurado aparece no certificado emitido.
- **Navegação:** tela inicial do aluno = Todos os Cursos; abas na ordem e com os nomes do PPTX.
- **Manual do aluno:** reescrito nos trechos que ensinavam as regras antigas.

## 3. Design e acessibilidade

| Mudança | Motivo |
|---------|--------|
| Foco preso no modal (Tab e Shift+Tab) | Antes, teclado e leitor de tela saíam do modal para a página escondida atrás |
| Alvos de toque ≥ 44 px em dispositivos de toque | 70 % dos acessos são por celular; antes os botões pequenos tinham ~30 px |
| Campos com 16 px em toque | Abaixo disso o iOS dá zoom ao focar |
| Rótulos e cabeçalhos de tabela com mínimo de 11 px | Estavam com ~9 px |

## 4. Verificação

- `node --test prototipo/tests/regras.test.js`: **11 testes** das regras (60 %, arredondamento, 24 h, prazo, reprovação, coringas, validação).
- `node prototipo/tests/rodar-smoke.js`: abre o protótipo no Edge/Chrome e percorre **32 verificações** (login, inscrição, aprovação, reprovação por nota e por prazo, Exclusivo, relatórios com filtros, criar curso, permissões dos 3 perfis, foco no modal). Tudo passa e não há erro de JavaScript.
- Telas novas conferidas em captura de celular.

## 5. O que **não** foi feito (e por quê)

- **Prazo de 48 h por atividade:** o PPTX não diz o que acontece ao perder (L-03).
- **Perfil Revisor:** aguarda resposta (L-02).
- **Login só com e-mail (sem escolher Regional/perfil):** o protótipo mantém a escolha de Regional e perfil para demonstração. O comportamento real depende de L-08 e L-22.
- **Back-end real, banco, e-mail, hospedagem de vídeo:** fora do escopo do protótipo (etapa 6 do plano).
- **Tailwind via CDN:** adequado para protótipo; em produção deve ser compilado (a própria ferramenta avisa).
- **Divisão do `app.js` em módulos:** só as regras foram separadas. O restante continua um arquivo grande; dividir agora aumentaria o risco sem ganho para a avaliação.
