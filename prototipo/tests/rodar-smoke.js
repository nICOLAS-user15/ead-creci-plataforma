// Executar: node prototipo/tests/rodar-smoke.js
// Abre o protótipo em Chrome/Edge sem janela, percorre os fluxos (login, inscrição,
// aprovação, reprovação, prazo, relatórios, criar curso, perfis) e imprime PASS/FAIL.
// Para escolher outro navegador: defina a variável NAVEGADOR com o caminho do executável.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');

const proto = path.resolve(__dirname, '..');
const candidatos = [
    process.env.NAVEGADOR,
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const navegador = candidatos.find(p => fs.existsSync(p));
if (!navegador) { console.error('Nenhum Chrome/Edge encontrado. Defina a variável NAVEGADOR.'); process.exit(2); }

// Página temporária: o index.html com o cenário de teste injetado no final.
const cenario = fs.readFileSync(path.join(__dirname, 'smoke-navegador.js'), 'utf8');
const pagina = path.join(proto, '_smoke.html');
const html = fs.readFileSync(path.join(proto, 'index.html'), 'utf8')
    .replace('</body>', () => `<script>window.addEventListener("load",()=>setTimeout(()=>{${cenario}},300));</script></body>`);
fs.writeFileSync(pagina, html);

// Perfil de navegador próprio e descartável. Sem isso, se o navegador já estiver aberto,
// a chamada é entregue à janela existente e termina sem devolver a página.
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'ead-smoke-'));

let codigo = 2;
try {
    const r = spawnSync(navegador, [
        '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
        `--user-data-dir=${perfil}`, '--virtual-time-budget=60000', '--dump-dom', pathToFileURL(pagina).href,
    ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000 });

    const m = /<pre id="smoke-out">([\s\S]*?)<\/pre>/.exec(r.stdout || '');
    if (m) {
        const texto = m[1].replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        console.log(texto);
        const pass = (texto.match(/^PASS/gm) || []).length;
        const fail = (texto.match(/^FAIL/gm) || []).length;
        console.log(`\n${pass} passaram, ${fail} falharam`);
        codigo = fail || /ERRO NO CEN|ERROS JS/.test(texto) ? 1 : 0;
    } else if (!r.stdout) {
        console.error(`O navegador não devolveu a página (${path.basename(navegador)}, código ${r.status}${r.error ? ', ' + r.error.message : ''}).`);
        console.error('O modo sem janela pode estar bloqueado nesta máquina. Tente outro navegador com a variável NAVEGADOR.');
        if (r.stderr) console.error(r.stderr.split('\n').slice(-10).join('\n'));
    } else {
        console.error('A página abriu, mas o cenário não terminou. Últimas linhas da página:');
        console.error(r.stdout.slice(-1500));
    }
} finally {
    fs.rmSync(pagina, { force: true });
    fs.rmSync(perfil, { recursive: true, force: true });
}
process.exit(codigo);
