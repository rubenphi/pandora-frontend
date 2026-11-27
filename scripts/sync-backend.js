const fs = require('fs');
const path = require('path');

const withData = process.argv.includes('--with-data');
const bundleSrc = path.resolve(__dirname, '../../pandora-nest/dist/bundle/index.js');
const distDir = path.resolve(__dirname, '../dist');

function isValidSqlite(filePath) {
  try {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1000) return false;
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    fs.closeSync(fd);
    return buf.toString('utf8') === 'SQLite format 3\0';
  } catch (_) {
    return false;
  }
}

const dbCandidates = [
  path.resolve(__dirname, '../../pandora-nest/data/pandora.sqlite'),
  path.resolve(__dirname, '../../pandora-nest/pandora_storage/data/pandora.sqlite'),
  path.resolve(__dirname, '../../pandora_storage/data/pandora.sqlite'),
];

let dbSrc = dbCandidates.find((c) => isValidSqlite(c));
if (dbSrc) {
  console.log(`[Sync Backend] Base de datos SQLite sana encontrada en: ${dbSrc}`);
} else {
  console.warn(`[Sync Backend] AVISO: No se encontro una base de datos SQLite con formato valido.`);
}

const targets = [
  path.resolve(__dirname, '../public/nodejs'),
  path.resolve(__dirname, '../dist/nodejs'),
  path.resolve(__dirname, '../android/app/src/main/assets/public/nodejs'),
  path.resolve(__dirname, '../../pandora-nest/dist/bundle'),
  path.resolve(__dirname, '../../pandora-nest'),
];

console.log(`[Sync Backend] Sincronizando (modo: ${withData ? 'CON DATA COMPLETA Y WEB WWW' : 'LIMPIO'})...`);

targets.forEach((targetDir) => {
  if (!fs.existsSync(targetDir) && targetDir.includes('android') && !fs.existsSync(path.dirname(targetDir))) {
    return;
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // 1. Copiar bundle backend
  if (fs.existsSync(bundleSrc)) {
    fs.copyFileSync(bundleSrc, path.join(targetDir, 'index.js'));
  }

  // 2. Base de datos SQLite
  const targetDb = path.join(targetDir, 'data', 'pandora.sqlite');
  if (withData && fs.existsSync(dbSrc)) {
    fs.mkdirSync(path.join(targetDir, 'data'), { recursive: true });
    fs.copyFileSync(dbSrc, targetDb);
  } else if (!withData && fs.existsSync(targetDb) && targetDb !== dbSrc) {
    try {
      fs.unlinkSync(targetDb);
    } catch (_) {}
  }

  // 3. Frontend Web estático en www (para que otros dispositivos puedan entrar por navegador)
  // No copiar si el destino es un subdirectorio de dist (como dist/nodejs)
  if (!targetDir.startsWith(distDir) && fs.existsSync(distDir) && fs.existsSync(path.join(distDir, 'index.html'))) {
    const wwwDir = path.join(targetDir, 'www');
    fs.mkdirSync(wwwDir, { recursive: true });
    try {
      fs.cpSync(distDir, wwwDir, {
        recursive: true,
        filter: (srcPath) => {
          if (srcPath.includes('nodejs')) return false;
          if (srcPath.endsWith('.map')) return false;
          return true;
        },
      });
      console.log(`  -> Frontend web www copiado exitosamente a: ${wwwDir}`);
    } catch (err) {
      console.error(`  -> Error al copiar www a ${wwwDir}:`, err.message);
    }
  }
});

console.log('[Sync Backend] Sincronización completada.');

