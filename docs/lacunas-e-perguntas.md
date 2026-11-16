# Lacunas e Perguntas — Agenda de Alinhamento

Perguntas construtivas para o gestor, originadas das contradições e omissões encontradas nos PPTX (D1 = Projeto, D2 = Telas). Cada pergunta traz a **evidência**, a **hipótese de trabalho** usada no protótipo enquanto não houver resposta e o **impacto** de errar.

Prioridade: **P1** bloqueia regra central · **P2** afeta uma tela ou fluxo · **P3** detalhe.

## Pauta da Reunião com o Stakeholder

| # | Pri. | Tema | Pergunta | Evidência | Hipótese adotada no protótipo | Resposta | Status |
|---|------|------|----------|-----------|-------------------------------|----------|--------|
| L-01 | P1 | Liberação das aulas | Em curso Padrão, a próxima aula libera **no dia seguinte**, **24 h após o exercício anterior** ou **ao concluir o exercício**? | D1 s2: "Aula 1 no dia seguinte à inscrição; seguintes condicionadas à conclusão da atividade anterior". D2 s5: "disponibilizada após 24 horas da realização do exercício da aula anterior" | Aula 1 no dia seguinte; demais 24 h após o exercício anterior | — | Aberto |
| L-02 | P1 | Perfis | O perfil **Revisor** existe como perfil separado? Hoje D1 lista Administrador/Revisor/Regional e D2 mostra só "admin master" e "admin da Regional". Quem analisa PTAM e edita notas de prova? | D1 s7; D2 s15, s23, s29 | 3 perfis no protótipo (Corretor, Admin Master, Admin Regional); Revisor **não** implementado | — | Aberto |
| L-03 | P1 | Prazo da atividade | O que acontece se o aluno não fizer o exercício em **48 h**? Perde a aula, reprova, ou o prazo só vale como lembrete? | D1 s2: "48h após disponibilização" sem consequência | Apenas aviso visual; sem bloqueio | — | Aberto |
| L-04 | P1 | Certificado | Em curso Padrão o certificado sai **ao terminar a última aula** (D1) ou **quando o prazo do curso encerra** e o sistema analisa o aproveitamento (D2)? | D1 s2 vs D2 s5 e s7 | Certificado ao concluir a última aula com ≥ 60 % | — | Aberto |
| L-05 | P1 | Escala da nota | A nota é **percentual** (aprovação ≥ 60 %) ou **0 a 10**? A tela de edição de nota mostra "5.33". Então 60 % = 6,0? | D1 s2; D2 s22 | Exercícios em %; prova presencial em 0–10 (mínimo 6,0) | — | Aberto |
| L-06 | P2 | Prova presencial | Quem **agenda** a prova (aluno ou Regional) e onde? A tela 2 fixa "Sede do CRECISP, Rua Pamplona, 1200", mas D1 diz "agendada pela Regional" | D1 s2; D2 s7 | Local e data por Regional, definidos pela Regional | — | Aberto |
| L-07 | P2 | Certificados | A tela "Meus Certificados" só tem imagem. Existe **validação pública** do certificado (código/QR)? Isso consta no briefing mas não no texto dos PPTX | Briefing; D2 s4, s14 | Página pública de validação por código | — | Aberto |
| L-08 | P1 | Login e elegibilidade | (a) Como o corretor **sem e-mail @creci.org.br** entra ("Não lembrou ou não possuo")? (b) O sistema consulta o cadastro oficial para confirmar que é corretor **ativo**? | D2 s1; D1 s2 | Só `@creci.org.br`; sem fluxo alternativo | — | Aberto |
| L-09 | P2 | Reprovação em Exclusivo | Reprovado em turma exclusiva pode **refazer em outra turma** do mesmo curso? D1 só diz "perde o acesso na turma reprovada" | D1 s2 | Pode refazer em nova turma | — | Aberto |
| L-10 | P3 | Tutorial | Qual o conteúdo do tutorial (passos, vídeo, texto)? É exibido no 1º acesso ou sempre acessível? | D1 s3; D2 s1–s2 (imagem) | Tutorial curto acessível a qualquer momento | — | Aberto |
| L-11 | P2 | Conteúdo da aula | Quais **tipos de conteúdo** a aula suporta (só vídeo, texto, PDF de apoio)? As telas D2 s9–s12 só têm imagem | D2 s9–s12 | Vídeo + exercício | — | Aberto |
| L-12 | P2 | Fluxo do PTAM | (a) Quantas **reapresentações** são permitidas e em que prazo? (b) Diferença entre *Rejeitado* e *Reapresentar*? (c) Tamanho máximo do PDF? | D2 s23 | Reapresentação ilimitada; Rejeitado encerra | — | Aberto |
| L-13 | P2 | Importação XLSX | (a) O que é a coluna "Diploma"? (b) A importação **gera** certificados para todas as linhas, ou só confirma notas? (c) E linhas com erro? | D2 s21 | Importa notas e libera certificados dos aprovados; erros listados | — | Aberto |
| L-14 | P2 | Padrão regional | Curso Padrão pode ser "Regional". Isso restringe o catálogo pela **Regional do aluno** (vinda de onde: CRECI do cadastro)? | D1 s2 | Regional do cadastro do corretor | — | Aberto |
| L-15 | P2 | Migração | Os dados do Moodle (histórico, certificados já emitidos, alunos em andamento) serão **migrados**? | — (não consta) | Fora do protótipo | — | Aberto |
| L-16 | P2 | Vídeos | Onde ficam hospedados os vídeos (servidor próprio, YouTube não listado, Vimeo)? | — (não consta) | Vídeo simulado | — | Aberto |
| L-17 | P3 | Estatísticas | Quais indicadores compõem "Estatísticas Gerais"? A tela é imagem | D2 s28 | Totais por curso e por resultado | — | Aberto |
| L-18 | P3 | Edições | Cursos com "Edição 315/316" são as **turmas** dos Exclusivos? Como são numeradas? | D2 s31 | Edição = turma | — | Aberto |
| L-19 | P3 | Status "Habilitado para Prova" | Qual regra torna o aluno habilitado (concluir todas as aulas? mínimo de nota?) | D2 s31 | Concluiu todas as aulas online | — | Aberto |
| L-20 | P2 | Dados reais nos slides | O slide D2 s23 parece conter nomes e e-mails **reais** de corretores. Podem ser usados na apresentação? | D2 s23 | Protótipo usa só dados fictícios | — | Aberto |

### Perguntas surgidas ao corrigir o protótipo

| # | Pri. | Tema | Pergunta | Hipótese adotada no protótipo | Status |
|---|------|------|----------|-------------------------------|--------|
| L-21 | P1 | Tentativas | O aluno pode **refazer** um exercício? Se pode, vale a 1ª nota ou a melhor? Como a nota final é a soma de todos os acertos, tentativas ilimitadas tornariam a reprovação impossível | **Uma tentativa por exercício** | Aberto |
| L-22 | P2 | Regional na inscrição | No curso exclusivo, o aluno **escolhe a Regional** na inscrição (D2 s6)? O protótipo pede a Regional já no login, como o EAD antigo | Regional escolhida no login | Aberto |
| L-23 | P2 | Admin Regional | O Admin Regional também avalia PTAM? D1 diz que a Regional tem "relatórios e navegação"; quem avalia upload é o Revisor | Admin Regional avalia PTAM da sua Regional (por falta do perfil Revisor) | Aberto |
| L-24 | P3 | Vagas | Turma exclusiva tem **limite de vagas**? Não consta nos PPTX | Limite de vagas mantido como proposta | Aberto |

## Inconsistências editoriais (sem pergunta, só correção)

- D2 s18, tela do certificado: aparece o texto "Digite seu e-mail @creci.org.br" junto ao botão "Atualizar texto". Provável resto copiado da tela de login. Vamos ignorar.
- D1 s2: cabeçalho diz "Padrão / Exclusivo", mas o texto da aprovação mistura "turma" e "curso". Usamos "turma" para Exclusivo e "curso" para Padrão.

## Pontos Pendentes

1. Obter resposta das perguntas **P1** (L-01 a L-05, L-08, L-21) antes de fechar a v1 do protótipo.
2. Confirmar com o gestor o conteúdo das telas que só existem como imagem (Meus Certificados, aulas, estatísticas).
3. Registrar a data de cada resposta e atualizar [requisitos.md](requisitos.md) (Status Ambíguo → Confirmado).
