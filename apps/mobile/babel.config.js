const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@shared': path.resolve(__dirname, '../../packages/shared/src'),
          },
        },
      ],
    ],
  };
};
