const {chromium} = require('playwright');
const {spawn} = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');

(async () => {
  const repoRoot = path.resolve(__dirname, '..');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pni-'));
  const filesDir = path.join(tmpDir, 'files');
  fs.mkdirSync(filesDir, {recursive: true});
  fs.mkdirSync(path.join(tmpDir, 'logs'));
  fs.chmodSync(tmpDir, 0o755);
  fs.chmodSync(filesDir, 0o755);
  fs.copyFileSync(path.join(repoRoot, 'file_index.html'), path.join(tmpDir, 'file_index.html'));
  fs.writeFileSync(path.join(filesDir, 'hello.txt'), 'hello');

  const conf = `
user root;
events {}
http {
  server {
    listen 8080;
    root ${tmpDir};
    autoindex on;
    autoindex_format json;
    location /files/ {
      try_files $uri /file_index.html =404;
    }
    location ~* ^/list(?<path>/files/.*) {
      autoindex on;
      autoindex_format json;
      try_files $path/ =404;
    }
  }
}`;
  const confPath = path.join(tmpDir, 'nginx.conf');
  fs.writeFileSync(confPath, conf);

  const nginx = spawn('nginx', ['-c', confPath, '-p', tmpDir, '-g', 'daemon off;']);
  await new Promise(r => setTimeout(r, 1000));

  const browser = await chromium.launch();
  const context = await browser.newContext({acceptDownloads: true});
  const page = await context.newPage();

  await page.goto('http://localhost:8080/files/');
  await page.waitForSelector('#filelist-body tr');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.evaluate(() => downloadAllAsZip())
  ]);
  const zipPath = path.join(tmpDir, 'download.zip');
  await download.saveAs(zipPath);

  await browser.close();
  nginx.kill('SIGTERM');

  const zip = new AdmZip(zipPath);
  const names = zip.getEntries().map(e => e.entryName);
  if (!names.includes('hello.txt')) {
    throw new Error('Expected hello.txt in ZIP, got: ' + names.join(', '));
  }

  console.log('ZIP download test passed');
})();
