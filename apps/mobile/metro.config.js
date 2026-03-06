const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const monorepoRoot = path.resolve(__dirname, '../..');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Monorepo: permitir resolver @sigeo/shared e outros pacotes do workspace
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
