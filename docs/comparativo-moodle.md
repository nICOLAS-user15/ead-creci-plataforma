# Comparativo Quantificado: Moodle (customizado) × Plataforma Sob Medida

> **Leia antes:** não temos acesso ao Moodle atual do CRECI (versão, plugins, nº de usuários, custo de hospedagem). Por isso este documento **não inventa custos**. A parte quantificada é uma **contagem derivada da matriz de requisitos** ([requisitos.md](requisitos.md)): para cada capacidade exigida, estimamos se o Moodle a entrega **nativa**, com **configuração ou plugin**, ou só com **desenvolvimento customizado**.
>
> A classificação é **estimativa do autor** e deve ser validada com quem administra o Moodle hoje (ver pendência no fim).

## 1. Ajuste (fit-gap) por capacidade

Legenda: **N** = nativo · **C** = configuração ou plugin de terceiros · **D** = desenvolvimento customizado (tema, plugin próprio ou integração).

| # | Capacidade exigida | Req. | Moodle | Observação |
|---|--------------------|------|--------|------------|
| 1 | Login por link enviado a e-mail `@creci.org.br`, válido 20 min | RF-01, RN-16 | **D** | Moodle trabalha com usuário/senha. Link único exigiria plugin de autenticação próprio |
| 2 | Interface minimalista com 3 abas, mobile-first | RF-07, RNF-01, RNF-02 | **D** | Exige tema próprio. O Moodle é responsivo, mas a navegação padrão é densa |
| 3 | Cursos Padrão × Exclusivo (turmas com datas) | RN-01 a RN-03 | **C** | Datas de inscrição e grupos existem; o modelo "turma por Regional" pede configuração cuidadosa |
| 4 | Acesso por Regional e perfis Administrador/Regional | RF-20, RF-29, RN-15 | **C** | Funções e categorias por Regional são possíveis |
| 5 | Liberação sequencial (aula 1 no dia seguinte; demais 24 h após exercício) | RN-04 | **C** | Restrição por conclusão existe; atraso relativo à conclusão tende a exigir plugin (a validar) |
| 6 | Exercícios de múltipla escolha | RF-15 | **N** | Atividade Questionário |
| 7 | Envio de PDF dissertativo | RF-16 | **N** | Atividade Tarefa |
| 8 | Resultado final e aprovação ≥ 60 % | RN-09, RN-10 | **N** | Livro de notas. Fórmulas distintas por tipo de curso pedem configuração |
| 9 | Edição manual de nota | RF-25 | **N** | Livro de notas |
| 10 | Certificado com texto dinâmico | RF-18, RF-23 | **C** | Plugin de certificado de terceiros |
| 11 | Validação pública de certificado | RF-19 | **C** | Comum em plugins de certificado (a validar) |
| 12 | Importar lista XLSX e gerar certificados | RF-24 | **D** | Importação de notas existe, mas em outro formato e sem gerar certificado |
| 13 | Fila de PTAM com status Concluído / Reapresentar / Rejeitado | RF-26 | **C** | Tarefa com estados de avaliação |
| 14 | Relatórios por aluno/curso/Regional com filtros | RF-27, RF-28 | **C** | Construtor de relatórios cobre parte |
| 15 | Reprovado: eliminar inscrição, **manter histórico**, permitir reinscrição | RN-13, RN-14 | **D** | Moodle mantém a matrícula e as notas; esse ciclo exige automação |
| 16 | Prova presencial: nota lançada pela Regional | RN-08, RF-25 | **C** | Item de nota manual |
| 17 | Identidade visual alinhada ao PTAM e Creci Integra | RNF-03 | **D** | Tema próprio |

### Contagem

| Classe | Qtde | % de 17 |
|--------|------|---------|
| Nativo (N) | 4 | 24 % |
| Configuração/plugin (C) | 8 | 47 % |
| Desenvolvimento customizado (D) | 5 | 29 % |

**Leitura honesta:** o Moodle cobre bem o miolo pedagógico (questionários, tarefas, notas), e isso é um ponto forte dele. O que ele não cobre sem desenvolvimento são exatamente as **dores citadas**: login simples, experiência mobile e o ciclo de reprovação/histórico. As 5 linhas **D** mais as 8 linhas **C** (que dependem de plugins de terceiros) formam o custo de manter o Moodle customizado.

## 2. Comparação qualitativa

| Critério | Moodle customizado | Sob medida |
|----------|--------------------|------------|
| Licença | Gratuita | Gratuita (ferramentas livres) |
| Tempo até o 1º uso | Menor para o núcleo | Maior: constrói-se o núcleo (aulas, exercícios, notas) |
| Experiência do corretor (70 % mobile) | Depende de tema próprio e de limitar o sistema | Projetada desde o início para celular |
| Aderência às regras (Padrão × Exclusivo, 48 h, 60 %) | Regras viram configurações e plugins; cada atualização do Moodle pode quebrar | Regras são código próprio e testado |
| Atualizações e segurança | Núcleo e plugins evoluem juntos; compatibilidade a cada versão | Responsabilidade da equipe |
| Dependência de terceiros | Plugins de terceiros | Bibliotecas padrão |
| Superfície funcional | Muito maior que a necessária (risco de complexidade) | Só o que o CRECI pediu |
| Risco do projeto | Baixo-médio | **Médio-alto:** exige equipe de desenvolvimento e manutenção contínua |

## 3. Quando "sob medida" compensa (e quando não)

**Argumentos a favor**
- O escopo é **pequeno e bem definido** (poucas telas, regras claras). Não precisa de 90 % do que o Moodle oferece.
- As dores prioritárias (mobile e login) estão na camada de interface e autenticação, onde o Moodle é mais rígido.
- Regras como "reprovou, some a inscrição mas fica no histórico" ficam naturais num modelo de dados próprio.

**Argumentos contra (devem ser respondidos pelo gestor)**
- O Moodle é gratuito e já está em produção; migrar tem custo de dados e de treinamento (L-15).
- Sob medida cria **dívida de manutenção** permanente. Sem equipe dedicada, o ganho some.
- Funcionalidades futuras pedidas pelo gestor (relatórios novos, tipos de atividade) o Moodle já tem.

**Conclusão provisória:** a vantagem econômica do sob medida **não está demonstrada** com os dados atuais. Ela depende de a manutenção do Moodle customizado (plugins + tema + atualizações) custar mais que a equipe própria. O comparativo abaixo organiza o cálculo para fechar essa conta.

## 4. Modelo de custo total (3 anos) — a preencher

| Item | Moodle customizado | Sob medida | Fonte do número |
|------|--------------------|------------|-----------------|
| Hospedagem/ano | _a levantar_ | _a levantar_ | TI do CRECI |
| Desenvolvimento inicial (horas × valor) | 5 itens D + 8 itens C | Todas as telas do protótipo | Estimativa da equipe |
| Manutenção/ano (atualizações, plugins, correções) | _a levantar_ | _a levantar_ | Histórico do Moodle atual |
| Suporte ao aluno/ano (chamados "não consigo entrar") | _a levantar_ | _a levantar_ | Central de atendimento |
| Migração de dados | _a levantar_ | _a levantar_ | L-15 |

**Fórmula:** `TCO 3 anos = desenvolvimento inicial + 3 × (hospedagem + manutenção + suporte) + migração`

## 5. Pendências para fechar o comparativo

1. Obter do administrador do Moodle: versão, lista de plugins, nº de usuários ativos, horas mensais de manutenção.
2. Obter o volume de chamados de suporte relacionados a acesso e mobile (dor do login).
3. Validar a coluna "Moodle" das 17 linhas com quem conhece a instalação atual.
