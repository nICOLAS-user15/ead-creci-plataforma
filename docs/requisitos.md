# Requisitos — Plataforma EAD CRECI

> **Fontes lidas (texto dos slides):**
> - **D1** = `Projeto Plataforma Ead v2027.pptx` (7 slides)
> - **D2** = `Telas e navegacao v2027.pptx` (31 slides)
>
> **Limite da extração:** só o texto dos slides foi lido. Imagens, setas e anotações de layout dentro dos PPTX **não** foram interpretadas (ex.: a tela "Meus Certificados" e as telas de conteúdo de aula só têm título em texto). O que depende dessas imagens está marcado como lacuna (ver [lacunas-e-perguntas.md](lacunas-e-perguntas.md)).
>
> **Coluna Origem:** `D1 sN` / `D2 sN` = slide de origem. `Briefing` = pedido do gestor fora dos PPTX. `Proposto` = sugerido pela análise, **não consta nos PPTX** e precisa de validação.
>
> **Coluna Status:** `Confirmado` = está explícito no PPTX · `Ambíguo` = PPTX se contradiz ou é omisso (vira pergunta) · `Proposto` = sem origem no PPTX.
>
> **Coluna Protótipo:** estado em `prototipo/` (a conferir tela a tela na etapa de validação).

## 1. Matriz de Rastreabilidade

### Requisitos Funcionais

| ID | Descrição | Origem | Prio. | Status | Lacuna |
|----|-----------|--------|-------|--------|--------|
| RF-01 | Login sem senha: aluno informa e-mail `@creci.org.br` e solicita link de acesso | D2 s1 | Alta | Confirmado | L-08 |
| RF-02 | Tela de confirmação do envio do link, informando validade de 20 min e aviso para checar SPAM/Lixo eletrônico | D2 s3 | Alta | Confirmado | — |
| RF-03 | Opção "Não lembrou ou não possuo @creci.org.br" na tela inicial | D2 s1 | Média | Ambíguo | L-08 |
| RF-04 | Tela de Tutorial explicando a navegação da plataforma | D1 s3; D2 s1–s2 | Média | Confirmado | L-10 |
| RF-05 | Acesso exclusivo a corretores de imóveis, com controle de acesso por Regional do CRECI | D1 s2 | Alta | Confirmado | L-08, L-14 |
| RF-06 | Cabeçalho logado com nome completo do usuário e botão "sair" em todas as telas | D2 s4–s31 | Alta | Confirmado | — |
| RF-07 | Navegação do aluno em 3 abas: **Todos os Cursos**, **Meus Cursos**, **Meus Certificados** | D2 s4, s8, s14 | Alta | Confirmado | — |
| RF-08 | Aba Todos os Cursos: catálogo em grade com os cursos disponíveis | D2 s4 | Alta | Confirmado | — |
| RF-09 | Aba Meus Cursos separada em "Cursos em andamento" e "Cursos finalizados com aprovação" | D2 s8 | Alta | Confirmado | — |
| RF-10 | Aba Meus Certificados: lista dos certificados do aluno | D1 s6; D2 s4 | Alta | Ambíguo | L-07 (tela é imagem) |
| RF-11 | Inscrição em curso **padrão**: descrição (nº de aulas, prazo), Termos de Participação e checkbox/botão de aceite | D2 s5 | Alta | Confirmado | — |
| RF-12 | Inscrição em curso **exclusivo**: 1º escolher a Regional (lista das Regionais com oferta), 2º ler termos e aceitar | D2 s6–s7 | Alta | Confirmado | L-06 |
| RF-13 | Tela de conteúdo do curso (lista de aulas) e tela de conteúdo da aula | D2 s9–s10 | Alta | Ambíguo | L-11 (telas são imagem) |
| RF-14 | Tela de vídeo da aula | D2 s11–s12 | Alta | Ambíguo | L-11, L-16 |
| RF-15 | Exercícios de múltipla escolha ao final de cada aula | D1 s2 | Alta | Confirmado | — |
| RF-16 | Envio de arquivo **PDF** (trabalho dissertativo; exemplo: PTAM) em cursos exclusivos | D1 s2; D2 s13 | Alta | Confirmado | L-12 |
| RF-17 | Cálculo do Resultado Final (%) e decisão Aprovado/Reprovado (ver RN-08, RN-09) | D1 s2 | Alta | Confirmado | L-05 |
| RF-18 | Emissão de certificado conforme regra de cada tipo de curso (ver RN-10) | D1 s2 | Alta | Confirmado | L-04 |
| RF-19 | **Validação pública de certificado** | Briefing | Média | **Proposto** (não está no texto dos PPTX) | L-07 |
| RF-20 | Perfis administrativos: **Administrador** (tudo), **Revisor** (relatórios, analisa uploads, edita notas de prova presencial), **Regional** (relatórios e cursos da sua Regional) | D1 s7 | Alta | Ambíguo (D2 só mostra "admin master" e "admin da Regional") | L-02 |
| RF-21 | Admin: lista de todos os cursos com botão **Criar Curso** | D2 s15 | Alta | Confirmado | — |
| RF-22 | Admin: criação de curso em 3 abas — **Estrutura**, **Inscrição e Participação**, **Certificado** | D2 s16–s18 | Alta | Confirmado | — |
| RF-23 | Admin: texto do certificado editável com coringas `[nome_curso]`, `[dt_inicio_curso]`, `[dt_fim_curso]` | D2 s18 | Média | Confirmado | — |
| RF-24 | Admin: **Notas de Provas** — importar lista `.xlsx` (Diploma, CRECI, Regional, Nome, Nota Final, Turma, ID do Curso, Cidade, Data de Início, Data de Conclusão, Data de Entrega, E-mail) para gerar certificados; botão só habilita após selecionar o curso | D2 s20–s21 | Alta | Confirmado | L-13 |
| RF-25 | Admin: **Editar Nota de Aluno** (selecionar curso, buscar aluno, editar nota) | D2 s22 | Alta | Confirmado | L-05 |
| RF-26 | Admin: **Gerenciar Atividades de Cursos** — fila de arquivos enviados por curso, com colunas Aluno, E-mail, Status, Data de envio, Ação; status vistos: *não enviado*, *concluído*, *reapresentar*, *rejeitado* | D2 s23 | Alta | Confirmado | L-12 |
| RF-27 | Admin: **Relatórios** — (a) Busca por Aluno (cursos em andamento, aprovados com data do certificado, reprovados com período); (b) Relatórios por Curso; (c) Estatísticas Gerais | D2 s24–s28 | Alta | Confirmado (conteúdo de (c) é imagem) | L-17 |
| RF-28 | Relatório por Curso com filtros: Curso (1 ou mais), Período (ou tudo), Resultado (aprovados, reprovados, em curso), Regional (1 ou mais) | D2 s27 | Alta | Confirmado | — |
| RF-29 | Admin Regional: acesso restrito a Relatórios e navegação em Todos os Cursos, filtrado à sua Regional (sem filtro de Regional) | D2 s29–s31; D1 s7 | Alta | Confirmado | — |
| RF-30 | Resultado do relatório exibe Curso/Edição, Inscrito, Regional, Data inscrição, Data término, Resultado (Aprovado, Reprovado, Em Andamento, **Habilitado para Prova**) | D2 s31 | Média | Confirmado | L-19 |

### Regras de Negócio

> Em D1 s2 cada linha tem duas colunas (esquerda/direita). Assumimos **esquerda = Padrão** e **direita = Exclusivo**, pela ordem do cabeçalho "PADRÃO / EXCLUSIVO". Isso é uma interpretação e está na lacuna L-01.

| ID | Regra | Padrão | Exclusivo | Origem | Status |
|----|-------|--------|-----------|--------|--------|
| RN-01 | Disponibilidade | Indefinida | Por turmas com data de início e fim | D1 s2 | Confirmado |
| RN-02 | Abrangência | Todo o Brasil ou Regional | Apenas Regional | D1 s2 | Confirmado (L-14) |
| RN-03 | Período de inscrição | A qualquer tempo | Datas de início e fim por turma | D1 s2 | Confirmado |
| RN-04 | Liberação das aulas | Aula 1 no dia seguinte à inscrição; demais após concluir a atividade da anterior | Conforme cronograma, condicionadas à conclusão da atividade anterior | D1 s2 | **Ambíguo**: D2 s5 diz "24 horas após o exercício anterior" (L-01) |
| RN-05 | Tipo de atividade | Múltipla escolha | Múltipla escolha + eventualmente trabalho dissertativo em PDF | D1 s2 | Confirmado |
| RN-06 | Prazo de cada atividade | 48 h após disponibilização | 48 h após disponibilização | D1 s2 | Confirmado (L-03: sem regra para perda do prazo) |
| RN-07 | Prazo do curso | Total de dias a partir da inscrição | Conforme cronograma | D1 s2; D2 s5 | Confirmado |
| RN-08 | Prova final presencial | Inexistente | Agendada pela Regional (pode estar no cronograma) | D1 s2 | Confirmado (L-06) |
| RN-09 | Resultado Final (%) | Σ acertos de todos os exercícios ÷ Σ questões de todos os exercícios | Σ acertos da prova presencial ÷ Σ questões da prova presencial | D1 s2 | Confirmado (L-05: escala da nota) |
| RN-10 | Aprovação | ≥ 60 % no Resultado Final | ≥ 60 % no Resultado Final | D1 s2 | Confirmado |
| RN-11 | Certificado disponível | Após término do exercício da última aula | Após inclusão da nota da prova presencial | D1 s2 | **Ambíguo** vs D2 s5 ("quando o prazo encerrar o sistema analisa") (L-04) |
| RN-12 | Pós-aprovação | Mantém acesso ao conteúdo; **não** pode nova inscrição no mesmo curso | Mantém acesso; **não** pode inscrever-se em outra turma do mesmo curso | D1 s2 | Confirmado |
| RN-13 | Pós-reprovação | Registra o resultado, **elimina a inscrição** e permite nova inscrição no mesmo curso | **Perde o acesso** ao conteúdo na turma reprovada | D1 s2; D2 s5, s7 | **Ambíguo** para Exclusivo: pode refazer em outra turma? (L-09) |
| RN-14 | Histórico | O relatório por aluno lista cursos reprovados com período, mesmo após "eliminar a inscrição" | idem | D2 s26 | Confirmado: implica **guardar o histórico** separado da inscrição ativa |
| RN-15 | Escopo por Regional | Admin Regional só vê dados da própria Regional | idem | D1 s7; D2 s29–s31 | Confirmado |
| RN-16 | Link de acesso expira em 20 min | — | — | D2 s3 | Confirmado |

### Requisitos Não Funcionais

| ID | Descrição | Origem | Status |
|----|-----------|--------|--------|
| RNF-01 | **Mobile-first:** mais de 70 % dos acessos do portal atual são por celular | Briefing | Confirmado (dado do gestor; não consta nos PPTX) |
| RNF-02 | Telas minimalistas, com poucos elementos por tela | D1 s3–s6 | Confirmado |
| RNF-03 | Identidade visual coerente com PTAM e Creci Integra (prints em `prints PTAM e CRECI INTEGRA/`); o print do EAD antigo serve apenas como referência de botões, não de design | Briefing; pasta de prints | Confirmado |
| RNF-04 | Autenticação por link de uso temporário, sem senha armazenada | D2 s1, s3 | Confirmado |
| RNF-05 | Conformidade com a **LGPD** (dados de corretores: nome, CRECI, e-mail, notas) | — | **Proposto** |
| RNF-06 | Trilha de auditoria de alteração de notas e decisões sobre PTAM | — | **Proposto** (decorre de RF-25 e RF-26) |
| RNF-07 | Upload limitado a PDF, com limite de tamanho a definir | D1 s2 | Parcial (tamanho: L-12) |
| RNF-08 | Disponibilidade e escala nacional (27 Regionais) | D1 s2 | Proposto: sem meta numérica no PPTX |

## 2. Fora de Escopo (confirmado pela ausência nos PPTX e pelo briefing)

Estes itens **não** aparecem em nenhum slide. Não devem ser incluídos sem pedido explícito do gestor:

- Fóruns de discussão, chat, mensagens entre alunos
- Prova presencial em curso **Padrão** (D1 s2: "Inexistente")
- Gamificação, ranking, pagamento/cobrança
- Área de "Professor/Conteudista" separada. Quem cria curso é o Administrador (D1 s7)
- Cursos abertos à "comunidade". O acesso é só de corretores (D1 s2)

## 3. Resumo da Auditoria

| Medida | Qtde |
|--------|------|
| Requisitos funcionais | 30 (24 confirmados · 5 ambíguos · 1 proposto) |
| Regras de negócio | 16 (13 confirmadas · 3 ambíguas) |
| Requisitos não funcionais | 8 (5 confirmados/parciais · 3 propostos) |

Contagens feitas à mão sobre as tabelas acima; conferir se a matriz mudar.
