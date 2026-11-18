const fs = require('fs');
const path = require('path');

const withData = process.argv.includes('--with-data');
const bundleSrc = path.resolve(__dirname, '../../pandora-nest/dist/bundle/index.js');
const dbSrc = path.resolve(__dirname, '../../pandora-nest/data/pandora.sqlite');
const distDir = path.resolve(__dirname, '../dist');

const targets = [
  path.resolve(__dirname, '../public/nodejs'),
  path.resolve(__dirname, '../dist/nodejs'),
  path.resolve(__dirname, '../android/app/src/main/assets/public/nodejs'),
  path.resolve(__dirname, '../../pandora-nest/dist/bundle'),
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
  } else if (!withData && fs.existsSync(targetDb)) {
    fs.unlinkSync(targetDb);
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

