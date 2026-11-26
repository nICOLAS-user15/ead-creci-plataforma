# Histórico de versões

Cada versão tem uma marcação (tag) no GitHub, que permite abrir o projeto exatamente como estava naquele momento.

## v2.0 (em desenvolvimento)

Segunda versão, construída a partir do retorno da primeira reunião com o gestor.

### Protótipo
- Ícone próprio da plataforma (`prototipo/icone.svg`), usado como favicon e marca.
- Meu Perfil, Notificações, Ajuda e Validar certificado assumidos como funcionalidades do protótipo, mesmo não constando nos requisitos originais.

### Organização do código
- `app.js` (2.800 linhas) dividido em 18 arquivos por assunto, em `prototipo/js/`. O código não mudou, só foi reorganizado.
- `regras.js` movido para `prototipo/js/regras.js`.

### Testes e automação
- Testes rodam sozinhos no GitHub a cada push (`.github/workflows/testes.yml`).
- Teste de navegador corrigido: usa um perfil de navegador descartável e explica o motivo quando não consegue rodar.

### Documentação
- Plano de etapas e tecnologias atualizado (dependências locais e fontes).
- Este histórico de versões.

## v1.0 (23/11/2026)

Versão apresentada ao gestor na primeira reunião. Marcação `v1.0`.

- Protótipo navegável com 3 perfis (Corretor, Administrador Master, Administrador Regional).
- Regras de negócio separadas e testadas (`regras.js`).
- Matriz de requisitos, agenda de perguntas, comparativo com o Moodle, plano de etapas e log de prompts em `docs/`.
- Manual do Aluno e documento de apresentação.
- Publicado no GitHub Pages e funcionando sem internet.
