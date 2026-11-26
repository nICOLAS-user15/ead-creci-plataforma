# Painel Executivo — Status do Projeto

_Atualizado em 26/11/2026_

**Versão em andamento:** v2.0 · **última versão fechada:** v1.0 (ver [CHANGELOG.md](CHANGELOG.md))

## Marcos da v1.0 (até 23/11/2026)

- [x] Leitura dos PPTXs de apresentação (texto dos 38 slides; imagens não lidas)
- [ ] Análise do EAD atual (Moodle): faltam dados da instalação (ver comparativo-moodle.md §5)
- [x] Prototipagem inicial (`prototipo/`, 3 perfis)
- [x] Levantamento de requisitos: 30 RF, 16 RN, 8 RNF com origem por slide
- [x] Agenda de alinhamento com o stakeholder: 24 perguntas (7 de prioridade P1)
- [x] Log de engenharia de prompts iniciado (16 registros; revisão humana pendente)
- [x] Comparativo Moodle × sob medida (estrutura e contagem pronta; custos a levantar)
- [x] Definição de tecnologias e etapas
- [x] Auditoria e correção do protótipo contra a matriz: regras separadas, Relatórios, Criar Curso (ver docs/auditoria-e-melhorias.md)
- [x] Testes: 11 de regras + 32 de navegador
- [x] Protótipo publicado no GitHub Pages e funcionando sem internet (dependências em `prototipo/vendor/`)
- [x] Ajustes finais: aba renomeada para Meus Cursos, toasts mais curtos, manual do aluno corrigido no celular
- [x] Primeira reunião com o gestor (por volta de 24/11/2026)

## Marcos da v2.0 (em andamento)

- [x] Ícone próprio (`prototipo/icone.svg`) como favicon e marca, 25/11/2026
- [x] Plano de etapas e tecnologias revisado, 26/11/2026
- [x] Decisão: funções além dos requisitos originais (perfil, notificações, ajuda, validação de certificado) ficam no protótipo sem etiqueta, 26/11/2026
- [x] Código do protótipo dividido por assunto em `prototipo/js/`, 26/11/2026
- [x] Testes automáticos no GitHub a cada push, 26/11/2026
- [x] Marcação de versões (tag `v1.0`) e histórico em CHANGELOG.md, 26/11/2026
- [ ] Registrar as respostas da primeira reunião em [docs/lacunas-e-perguntas.md](docs/lacunas-e-perguntas.md)
- [ ] Apresentação refeita para demonstrar a evolução da v1 para a v2 (`apresentacao/`)

## Situação Atual

- **Fase:** 4 (Validação) com o gestor, em paralelo à evolução do protótipo (v2.0)
- **Bloqueios:** respostas às perguntas P1 (L-01 a L-05, L-08, L-21) dependem do gestor
- **Riscos:** perfil Revisor ausente; perguntas P1 abertas até serem registradas as respostas da reunião

## Próximos passos

1. Registrar o que o gestor respondeu e pediu na primeira reunião
2. Definir o escopo da v2.0 a partir desse retorno
3. Obter dados do Moodle atual para fechar o custo

## Decisões em aberto

Ver [docs/lacunas-e-perguntas.md](docs/lacunas-e-perguntas.md).
