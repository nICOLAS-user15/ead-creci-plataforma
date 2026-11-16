// Executar: node prototipo/tests/rodar-smoke.js
// Abre o protótipo em Edge/Chrome sem janela, percorre os fluxos (login, inscrição,
// aprovação, reprovação, prazo, relatórios, criar curso, perfis) e imprime PASS/FAIL.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const proto = path.resolve(__dirname, '..');
const candidatos = [
    process.env.NAVEGADOR,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const navegador = candidatos.find(p => fs.existsSync(p));
if (!navegador) { console.error('Nenhum Edge/Chrome encontrado. Defina a variável NAVEGADOR.'); process.exit(2); }

const cenario = fs.readFileSync(path.join(__dirname, 'smoke-navegador.js'), 'utf8');
const pagina = path.join(proto, '_smoke.html');
let html = fs.readFileSync(path.join(proto, 'index.html'), 'utf8');
html = html.replace('</body>', () => `<script>window.addEventListener("load",()=>setTimeout(()=>{${cenario}},300));</script></body>`);
fs.writeFileSync(pagina, html);

let codigo = 2;
try {
    const dom = execFileSync(navegador, ['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=60000', '--dump-dom', pathToFileURL(pagina).href],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = /<pre id="smoke-out">([\s\S]*?)<\/pre>/.exec(dom);
    if (!m) console.error('O cenário não produziu resultado.');
    else {
        const texto = m[1].replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        console.log(texto);
        codigo = /^FAIL|ERRO NO CEN|ERROS JS/m.test(texto) ? 1 : 0;
    }
} finally {
    fs.rmSync(pagina, { force: true });
}
process.exit(codigo);
