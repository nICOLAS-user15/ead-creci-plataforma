# Plataforma EAD CRECI

[![Testes](https://github.com/nICOLAS-user15/ead-creci-plataforma/actions/workflows/testes.yml/badge.svg)](https://github.com/nICOLAS-user15/ead-creci-plataforma/actions/workflows/testes.yml)

**Versão atual:** v2.0 em desenvolvimento · última versão fechada: [v1.0](https://github.com/nICOLAS-user15/ead-creci-plataforma/tree/v1.0) · [histórico de versões](CHANGELOG.md)

Planejamento e protótipo interativo da nova Plataforma EAD do CRECI, em substituição ao ambiente atual baseado em Moodle.

**▶ [Abrir o protótipo](https://nicolas-user15.github.io/ead-creci-plataforma/prototipo/)** · [Apresentação](https://nicolas-user15.github.io/ead-creci-plataforma/apresentacao/)

> **Isto é um protótipo front-end.** Simula navegação, responsividade e regras de negócio com dados fictícios. Não há back-end nem banco de dados.

## Modalidades de Cursos

| | Padrão | Exclusivo |
|--|--------|-----------|
| Disponibilidade | Indefinida | Turmas com datas de início e fim |
| Abrangência | Todo o Brasil ou Regional | Apenas Regional |
| Inscrição | A qualquer tempo | Período definido por turma |
| Prova final | Inexistente | Presencial, agendada pela Regional |
| Resultado final | % de acertos nos exercícios | % de acertos na prova presencial |

Todo o acesso é **exclusivo a corretores de imóveis**. Aprovação: no mínimo 60 %. Detalhes e ambiguidades em [docs/requisitos.md](docs/requisitos.md).

## Navegação do aluno (3 abas)

1. **Todos os Cursos**: catálogo
2. **Meus Cursos**: em andamento e finalizados com aprovação
3. **Meus Certificados**

## Perfis de acesso

- **Corretor** (aluno)
- **Administrador (Master)**: cria cursos, importa notas, vê tudo
- **Administrador Regional**: relatórios e cursos da sua Regional
- **Revisor** (previsto em D1, ainda não implementado, ver pergunta L-02)

## Documentação (`/docs`)

| Arquivo | Conteúdo |
|---------|----------|
| [requisitos.md](docs/requisitos.md) | Matriz de rastreabilidade (RF, RN, RNF) ligada aos slides |
| [lacunas-e-perguntas.md](docs/lacunas-e-perguntas.md) | Agenda de alinhamento com o gestor |
| [prompts.md](docs/prompts.md) | Log de engenharia de prompts: falhas da IA e correções |
| [comparativo-moodle.md](docs/comparativo-moodle.md) | Comparativo Moodle × sob medida |
| [plano-etapas-e-tecnologias.md](docs/plano-etapas-e-tecnologias.md) | Fases, stack do protótipo e stack recomendada |
| [auditoria-e-melhorias.md](docs/auditoria-e-melhorias.md) | O que foi corrigido no protótipo e por quê |

Acompanhe o andamento em [STATUS.md](STATUS.md). A apresentação executiva está em `apresentacao/`.

## Protótipo

Abra `prototipo/index.html` no navegador. Tecnologias: HTML5, Tailwind CSS e JavaScript ES6+. Tailwind, ícones (Lucide) e fontes ficam em `prototipo/vendor/`, então o protótipo funciona sem internet.

As regras de negócio (60 %, liberação de aulas, prazo, reprovação) ficam em `prototipo/js/regras.js`, sem ligação com a tela. O restante do código fica dividido por assunto em `prototipo/js/` (ver estrutura abaixo).

### Testes

```
node --test prototipo/tests/regras.test.js   # 11 testes das regras
node prototipo/tests/rodar-smoke.js          # 32 verificações no navegador (Chrome/Edge)
```

Os dois rodam sozinhos no GitHub a cada push (aba **Actions**). O selo no topo desta página mostra o resultado do último push.

## Estrutura de Diretórios

```
EAD-CRECI/
├── README.md                  capa do projeto
├── STATUS.md                  painel de andamento
├── CHANGELOG.md               histórico de versões
├── .github/workflows/         testes automáticos no GitHub
├── docs/                      requisitos, perguntas, plano, comparativo, log de prompts
├── apresentacao/              documento de apresentação
└── prototipo/
    ├── index.html             estrutura da página (menu, barra superior, janela modal)
    ├── manual-do-aluno.html
    ├── styles.css
    ├── icone.svg
    ├── vendor/                Tailwind, ícones e fontes (cópias locais)
    ├── tests/                 testes das regras e de navegador
    └── js/                    carregados nesta ordem pelo index.html
        ├── regras.js          regras de negócio (sem tela; roda também no Node)
        ├── utilitarios.js     funções de apoio e datas simuladas
        ├── dados.js           dados fictícios
        ├── estado.js          estado da interface, tema e fonte
        ├── componentes.js     peças reaproveitadas: cabeçalho, modal, avisos
        ├── login-cenario.js   fundo animado do login
        ├── login.js           fluxo de login
        ├── layout.js          menu, barra superior, notificações, troca de telas
        ├── cursos.js          inscrição, progresso, aprovação e reprovação
        ├── telas/             uma tela por arquivo
        └── inicio.js          eventos globais e inicialização (sempre por último)
```

As imagens de referência visual (`prints PTAM e CRECI INTEGRA/`) e os PPTX ficam só no computador local, fora do GitHub.

## Como trabalhamos

- **Ramo único `main`**, revisado pelo responsável antes de cada push.
- **Mensagens de commit** com prefixo: `feat:` (novidade), `fix:` (correção), `docs:` (documentação), `chore:` (limpeza), `test:` (testes), `refactor:` (reorganização sem mudar o comportamento).
- **Versões** marcadas com tags (`v1.0`, `v2.0`) e descritas no [CHANGELOG.md](CHANGELOG.md).
- **Publicação**: cada push no `main` atualiza o GitHub Pages em poucos minutos.
