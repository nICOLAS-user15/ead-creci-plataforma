# Log de Engenharia de Prompts e Filtro Humano

Registro de onde a IA **errou, inventou ou extrapolou**, e do que foi corrigido. Este arquivo é a evidência do método de trabalho.

> **Atenção:** as entradas P-01 a P-07 foram registradas pela própria IA ao auditar o repositório em 16/11/2026. A coluna "Filtro humano" mostra a ação aplicada; **Nicolas deve revisar e marcar "validado"**. Prompts de sessões anteriores (criação do protótipo v1–v5) não estão no histórico e devem ser acrescentados por quem os executou.

## Registro de Prompts

| ID | Data | Objetivo | Prompt (resumo) | Resultado da IA | Filtro humano |
|----|------|----------|-----------------|-----------------|---------------|
| P-01 | 16/11/2026 | Extrair requisitos dos 2 PPTX | "Leia os PPTX, extraia RFs, RNs, RNFs e organize em matriz de rastreabilidade ligada às telas" | Extraiu texto dos 38 slides via XML (python não instalado; usou PowerShell). **Não leu imagens**: telas como "Meus Certificados" e aulas só têm título | **Ajustado:** limite registrado no topo de `requisitos.md` e perguntas L-07, L-11, L-17 |
| P-02 | 16/11/2026 | Conferir o `README.md` contra os PPTX | "Audite README e docs contra os seis pilares" | **Erro no README:** diz que as "3 abas" são Área do Aluno / Professor-Conteudista / Administrativa. Os PPTX definem as 3 abas do aluno: *Todos os Cursos, Apenas Meus Cursos, Meus Certificados*. "Professor/Conteudista" **não existe** nos PPTX (quem cria curso é o Administrador) | **Corrigido** no README |
| P-03 | 16/11/2026 | Idem | Idem | **Erro no README:** diz que cursos Padrão são "de acesso geral aos corretores e à comunidade". D1 s2 diz acesso **exclusivo a corretores** para toda a plataforma. Padrão e Exclusivo diferem em turma, Regional e prova, não em público | **Corrigido** no README |
| P-04 | 16/11/2026 | Mapear perfis administrativos | Idem | **Divergência encontrada:** briefing e protótipo falam em *Admin Master* e *Admin Regional*. D1 s7 lista **Administrador, Revisor e Regional**. O perfil Revisor não existe no protótipo | **Mantido como lacuna L-02**; nada implementado sem resposta do gestor |
| P-05 | 16/11/2026 | Extrair regras de liberação de aulas | Idem | **Contradição entre PPTX:** D1 diz "dia seguinte à inscrição"; D2 diz "24 h após o exercício anterior". A IA poderia ter escolhido uma sem avisar | **Registrado como L-01 (P1)** com hipótese explícita |
| P-06 | 16/11/2026 | Listar requisitos do briefing | "…emissão/validação de certificados" | **Não consta nos PPTX:** "validação" de certificado só aparece no briefing. Marcado como *Proposto*, não *Confirmado* | **Ajustado** (RF-19, L-07) |
| P-07 | 16/11/2026 | Interpretar D1 s2 (tabela de duas colunas) | Idem | A tabela perde a estrutura ao virar texto. Mapear esquerda = Padrão e direita = Exclusivo é **inferência** da IA, não dado | **Ajustado:** premissa declarada em `requisitos.md` e a conferir com o gestor |
| P-08 | 16/11/2026 | Auditar protótipo contra a matriz | Idem | Protótipo contém itens que **não constam nos PPTX** (edição de perfil, notificações, central de ajuda, página pública de validação). Podem ser úteis, mas são extrapolação | **Pendente:** decidir se ficam como "proposta" na demonstração |
| P-09 | 16/11/2026 | Gerar comparativo com o Moodle | "Escreva comparativo quantificado" | A IA **não tem dados do Moodle atual** (nº de usuários, custo, plugins). Números de custo ficaram como "a levantar", sem inventar | **Ajustado:** só há contagem derivada da matriz; custos são placeholders |

### Auditoria do protótipo (16/11/2026, segunda etapa)

| ID | Objetivo | Problema encontrado | Filtro humano / correção |
|----|----------|---------------------|--------------------------|
| P-10 | Auditar regras de negócio do `app.js` | **Exercício travava em 60 % por aula, com tentativas ilimitadas.** Os PPTX pedem o contrário: o resultado final é Σ acertos ÷ Σ questões (D1 s2). Com tentativas ilimitadas ninguém seria reprovado, e a regra RN-13 nunca disparava | **Corrigido:** uma tentativa por exercício; resultado final calculado em `regras.js`; pergunta L-21 |
| P-11 | Idem | **Não existia reprovação.** Curso Padrão concluía ao terminar as aulas, sem checar 60 %, e não havia prazo do curso | **Corrigido:** reprovação por nota ou por prazo, histórico guardado (RN-14), reinscrição |
| P-12 | Idem | **Fluxo inventado:** "Solicitar vaga" com aprovação simulada pela Regional. Nada disso está nos PPTX, que mostram inscrição direta após aceitar os termos (D2 s5–s7) | **Corrigido:** tela de Termos de Participação com aceite; controle de vagas mantido como *proposta* (L-24) |
| P-13 | Idem | **Liberação de aulas** era "uma por dia, calendário fixo". Contradizia a hipótese documentada em L-01 (24 h após o exercício anterior) | **Corrigido** e coberto por testes |
| P-14 | Idem | **Telas ausentes:** Relatórios (D2 s24–s31) e Criar Curso com coringas (D2 s15–s18) não existiam | **Implementadas** |
| P-15 | Idem | `manual-do-aluno.html` ensinava as regras antigas (tentativas ilimitadas, solicitar vaga) | **Atualizado** |
| P-16 | Verificar o próprio trabalho | **Erros da própria IA nesta etapa:** (a) o 1º script de edição falhou por diferença de fim de linha (CRLF×LF), sem alterar nada; (b) um teste de navegador usava `String.replace` com `$$` e o texto saiu corrompido; (c) um teste deu **falso FAIL** porque o corpo do modal fica no DOM depois de fechado | **Detectados pela execução**, não por revisão visual. Teste ajustado para olhar se o modal está ativo |

## Padrões de erro observados

1. **Preencher lacuna com texto plausível** (P-02, P-03): o README inicial descreve um produto genérico de EAD, não o que os PPTX pedem.
2. **Escolher silenciosamente um lado de uma contradição** (P-05).
3. **Tratar inferência como fato** (P-07).
4. **Misturar o que o gestor disse com o que a IA acha que ele quer** (P-06, P-08).

## Boas práticas adotadas a partir daqui

- Todo requisito tem coluna de origem (slide) e status *Confirmado / Ambíguo / Proposto*.
- Número só entra no documento se vier de fonte nomeada ou de contagem verificável.
- Contradição vira pergunta com hipótese, não decisão.
- O que a IA não conseguiu ler (imagens) é declarado.

## Observações

_Acrescentar aqui prompts das sessões anteriores e novas falhas encontradas na validação do protótipo._
