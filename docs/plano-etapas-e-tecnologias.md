# Plano de Etapas e Tecnologias

## 1. Etapas do projeto

Entregas pequenas e visíveis, porque o projeto tem prioridade secundária. Cada etapa tem um critério de pronto verificável.

| Etapa | Entrega | Critério de pronto | Estado |
|-------|---------|--------------------|--------|
| 0. Infraestrutura | Repositório, README, STATUS, pastas | Repositório criado | Feito |
| 1. Análise | Leitura dos 2 PPTX; matriz de requisitos com origem por slide | 100 % dos slides com texto mapeados; ambiguidades listadas | **Feito** em 16/11/2026 (texto; imagens não lidas) |
| 2. Documentação | Lacunas e perguntas; log de prompts; comparativo Moodle; este plano | Todos os arquivos de `/docs` preenchidos | **Feito** (comparativo depende de dados do Moodle) |
| 3. Prototipação | Protótipo navegável mobile-first, 3 perfis | Cada tela do D2 tem equivalente; regras RN-01 a RN-16 simuladas ou listadas como pendentes | **Em andamento** (v5) |
| 4. Validação | Reunião com o gestor; respostas às perguntas P1; ajuste do protótipo | Perguntas L-01 a L-05 e L-08 respondidas; matriz sem "Ambíguo" de prioridade alta | Não iniciado |
| 5. Apresentação | Deck executivo defendendo o método e a decisão | Roteiro de 10 min ensaiado | Rascunho em `/apresentacao` |
| 6. Evolução (futuro) | Back-end real, banco, e-mail, certificados em PDF | Fora do escopo desta demanda; só com aprovação | Planejado |

### Etapa 6 em incrementos (proposta)

| Incremento | Conteúdo |
|------------|----------|
| 6.1 | Login por link + perfis + catálogo |
| 6.2 | Inscrição, aulas, exercícios, resultado e aprovação |
| 6.3 | Exclusivos: turmas por Regional, prova presencial, envio de PDF e fila de revisão |
| 6.4 | Certificados, validação pública, importação XLSX |
| 6.5 | Relatórios e estatísticas; migração do Moodle (se aprovada, L-15) |

## 2. Tecnologias do protótipo (já em uso)

| Tecnologia | Papel | Justificativa |
|------------|-------|---------------|
| HTML5 | Estrutura | Abre em qualquer navegador, sem instalação |
| Tailwind CSS 3.4 (CDN) | Estilo e responsividade | Mobile-first por padrão; ajuste rápido de layout para os 70 % de acesso por celular |
| JavaScript ES6+ (sem framework) | Simula navegação e regras com dados fictícios | Zero build, fácil de demonstrar e de inspecionar |
| Lucide (ícones) | Iconografia | Leve e consistente |
| Google Fonts (Inter) | Tipografia | Legibilidade em tela pequena |

**Limites assumidos:** sem back-end, sem banco, sem e-mail real. O link de acesso, o timer de 20 min e as regras de 48 h/60 % são **simulados** no navegador. Os dados são fictícios (L-20).

## 3. Tecnologias recomendadas para produção (proposta, a validar com a TI do CRECI)

| Camada | Recomendação | Por quê | Alternativa |
|--------|--------------|---------|-------------|
| Front-end | React + TypeScript (ou o framework que a TI do CRECI já domine) | Reaproveita a estrutura de telas do protótipo; tipagem reduz erro nas regras | Vue |
| Estilo | Tailwind CSS | Continuidade com o protótipo | — |
| Back-end | Node.js + TypeScript (API REST) | Mesma linguagem do front; regras de negócio em um só lugar | Python/Django, PHP/Laravel (se a equipe já usa) |
| Banco | PostgreSQL | Dados relacionais: curso, turma, inscrição, nota; consultas de relatório | MySQL |
| Autenticação | Link mágico com token de uso único e expiração de 20 min; sessão por cookie seguro | Atende RF-01/RN-16 sem guardar senha | — |
| E-mail | Serviço transacional (SMTP do CRECI ou provedor) | Entrega do link; precisa monitorar caixa de spam (D2 s3) | — |
| Arquivos | Armazenamento de objetos com acesso privado (PDFs do PTAM) | Controle de acesso por Regional e revisor | Disco do servidor |
| Vídeo | A definir (L-16) | Decisão do gestor afeta custo e banda | — |
| Certificados | Geração de PDF no servidor, com código único para validação | RF-18, RF-19 | — |
| Hospedagem | Nuvem com região no Brasil | LGPD (RNF-05); latência nacional | Servidor próprio do CRECI |
| Qualidade | Testes automatizados nas regras RN-04 a RN-13 | São o coração do sistema e hoje estão ambíguas | — |

Estas escolhas são **recomendação de arquitetura**, não decisão. O PPTX não define tecnologia. A escolha final depende da equipe que irá manter o sistema.

## 4. Riscos

| Risco | Efeito | Mitigação |
|-------|--------|-----------|
| Regras contraditórias nos PPTX (L-01, L-04, L-05) | Retrabalho no código | Responder P1 antes da etapa 6 |
| Protótipo ganhar funções não pedidas | Parece produto pronto; confunde a avaliação | Marcar extras como "proposta" (P-08) |
| Sem equipe de manutenção | Sob medida vira dívida | Decidir dono do sistema antes de construir |
| Dados reais nos slides | LGPD | Só dados fictícios (L-20) |
| Entrega de e-mail do link cair em SPAM | Aluno não consegue entrar | Monitorar entrega; fluxo alternativo (L-08) |
