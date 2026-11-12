const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const PORT = process.env.PORT || 3000;
const UUID = process.env.UUID;
const WSPATH = process.env.WSPATH || '/ws';
if (!UUID) { console.error('UUID is required'); process.exit(1); }
const XRAY = path.join(__dirname, 'web-worker');
if (!fs.existsSync(XRAY)) {
  execSync('node setup.js', { stdio: 'inherit' });
}
const config = {
  "log": { "loglevel": "warning" },
  "inbounds": [{
    "port": 8080, "listen": "127.0.0.1", "protocol": "vless",
    "settings": { "clients": [{ "id": UUID }], "decryption": "none" },
    "streamSettings": { "network": "ws", "wsSettings": { "path": WSPATH } }
  }],
  "outbounds": [{ "protocol": "freedom" }]
};
fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config));
const xray = spawn(XRAY, ['-c', 'config.json'], { stdio: 'inherit' });
xray.on('exit', (code) => { console.error('xray exited', code); process.exit(code ?? 1); });
const sign = () => { xray.kill('SIGTERM'); process.exit(0); };
process.on('SIGTERM', sign);
process.on('SIGINT', sign);
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok\n');
}).listen(PORT, () => console.log('listening on', PORT));
