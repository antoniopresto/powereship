const { TARGET } = process.env;
const validTargets = [
  'module',
  'browser',
  'node',
  'module-browser',
  'module-node',
];

if (!validTargets.includes(TARGET)) {
  throw new Error(
    `Invalid process.env.TARGET "${TARGET}", expected one of ${validTargets}`
  );
}

const KIND = TARGET.includes('browser') ? 'browser' : 'server';
const KIND_INVERT = KIND === 'browser' ? 'server' : 'browser';

const browserConfig = {
  useBuiltIns: 'entry',
  corejs: '3.22',
  targets: {
    browsers: '> 0.25%, not dead',
  },
};

const nodeConfig = {
  targets: {
    node: '14',
  },
};

const envConfig = {
  browser: {
    ...browserConfig,
  },

  'module-browser': {
    ...browserConfig,
    modules: false,
    targets: {
      ...browserConfig.targets,
      esmodules: true,
    },
  },

  node: {
    ...nodeConfig,
  },

  'module-node': {
    ...nodeConfig,
    modules: false,
    targets: {
      ...nodeConfig.targets,
      esmodules: true,
    },
  },
}[TARGET];

const config = {
  plugins: [
    [
      require('@darch/babel-plugins').StripBlocksPlugin,
      {
        magicComment: `@only-${KIND_INVERT}`,
      },
    ],
  ],
  presets: [
    '@babel/preset-typescript', //
    ['@babel/preset-env', envConfig],
  ],
  ignore: [
    '**/*.spec.ts', //
    '**/__tests__/**/*',
  ],
};

module.exports = config;
