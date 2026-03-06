#!/usr/bin/env node
/**
 * Gera APK localmente (sem EAS).
 * Usa assembleRelease com keystore de debug para APK standalone (JS embutido).
 * O APK fica em android/app/build/outputs/apk/release/app-release.apk
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const gradlew = isWindows ? 'gradlew.bat' : './gradlew';
const androidDir = path.join(__dirname, '..', 'android');
const localPropsPath = path.join(androidDir, 'local.properties');

if (!fs.existsSync(androidDir)) {
  console.error('Pasta android/ não encontrada. Rode antes: npx expo prebuild --platform android');
  process.exit(1);
}

// Garantir SDK: ANDROID_HOME ou local.properties; no Windows tentar caminho padrão do Android Studio
let sdkDir = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!sdkDir && isWindows && process.env.LOCALAPPDATA) {
  const defaultSdk = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');
  if (fs.existsSync(path.join(defaultSdk, 'platform-tools'))) sdkDir = defaultSdk;
}
if (sdkDir && !fs.existsSync(localPropsPath)) {
  const content = `sdk.dir=${sdkDir.replace(/\\/g, '\\\\')}\n`;
  fs.writeFileSync(localPropsPath, content);
  console.log('Criado android/local.properties com sdk.dir');
}
if (!sdkDir && !fs.existsSync(localPropsPath)) {
  console.error('Android SDK não encontrado. Defina ANDROID_HOME ou instale o Android Studio (padrão: %LOCALAPPDATA%\\Android\\Sdk)');
  process.exit(1);
}

// Em monorepo, Metro usa a raiz do workspace por padrão; forçar o uso de apps/mobile
const mobileDir = path.join(__dirname, '..');
process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1';
process.env.NODE_ENV = 'production';

console.log('Building APK (release com JS embutido, sem depender do Metro)...');
execSync(`${gradlew} assembleRelease`, {
  cwd: androidDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, EXPO_NO_METRO_WORKSPACE_ROOT: '1', NODE_ENV: 'production' },
});

const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
console.log('\nAPK gerado:', apkPath);
console.log('Instale no celular copiando o arquivo ou com: adb install', apkPath);
