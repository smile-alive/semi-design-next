export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'subject-case': [0, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
        'header-max-length': [2, 'always', 72],
        // Chinese bodies are written one paragraph per line, without hard wrapping
        'body-max-line-length': [0],
    },
};
