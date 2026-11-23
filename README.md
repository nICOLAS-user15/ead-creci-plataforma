# Plataforma EAD CRECI

Planejamento e protótipo interativo da nova Plataforma EAD do CRECI, em substituição ao ambiente atual baseado em Moodle.

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

As regras de negócio (60 %, liberação de aulas, prazo, reprovação) ficam em `prototipo/regras.js`, sem ligação com a tela.

```
node --test prototipo/tests/regras.test.js   # 11 testes das regras
node prototipo/tests/rodar-smoke.js          # 32 verificações no navegador (Edge/Chrome)
```

## Estrutura de Diretórios

```
EAD-CRECI/
├── README.md
├── STATUS.md
├── docs/
├── prototipo/
├── apresentacao/
└── prints PTAM e CRECI INTEGRA/   (referências visuais)
```
