module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^((?:CCS-\d+)|(?:[a-z0-9]{9,}))\s+(\w+):\s+(.*)$/,
      headerCorrespondence: ['ticket', 'type', 'subject'],
    },
  },
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'test',
        'revert',
        'style',
        'create',
        'delete',
      ],
    ],
    'type-case': [2, 'always', ['lower-case']],
    'subject-case': [
      2,
      'always',
      ['upper-case', 'lower-case', 'sentence-case'],
    ],
    'subject-max-length': [2, 'always', 80],
  },
};

