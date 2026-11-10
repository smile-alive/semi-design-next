import { RuleTester } from 'eslint';
import vue from 'eslint-plugin-vue';
import { describe, it } from 'vite-plus/test';
import { templateTernary } from '../../template-ternary.ts';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const parser = vue.configs['flat/base'].find((config) => config.languageOptions?.parser)?.languageOptions?.parser;
const tester = new RuleTester({ languageOptions: { parser, ecmaVersion: 'latest', sourceType: 'module' } });
const sfc = (template: string, script = '') => `<script setup>${script}</script>\n<template>${template}</template>`;

tester.run('template-ternary', templateTernary, {
    valid: [
        sfc('{{ item.name || item.value }}'),
        // Calls may return a different value or run code on each read
        sfc('{{ getName() ? getName() : fallback }}'),
        sfc('{{ list[i] ? list[i] : fallback }}'),
        sfc('<i :a="ok ? 1 : 0" />'),
        // oxlint checks the script
        sfc('<i />', 'const a = b ? b : c;'),
    ],
    invalid: [
        { code: sfc('{{ item.name ? item.name : item.value }}'), output: sfc('{{ item.name || item.value }}'), errors: [{ messageId: 'logical' }] },
        { code: sfc('<i :a="a ? a : b ?? c" />'), output: sfc('<i :a="a || (b ?? c)" />'), errors: [{ messageId: 'logical' }] },
        { code: sfc('<i :a="a === b ? true : false" />'), output: sfc('<i :a="a === b" />'), errors: [{ messageId: 'boolean' }] },
        { code: sfc('<i :a="value ? true : false" />'), output: sfc('<i :a="!!value" />'), errors: [{ messageId: 'boolean' }] },
        { code: sfc('<i :a="a && b ? false : true" />'), output: sfc('<i :a="!(a && b)" />'), errors: [{ messageId: 'boolean' }] },
    ],
});
