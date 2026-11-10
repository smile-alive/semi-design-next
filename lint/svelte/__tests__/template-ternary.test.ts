import { RuleTester } from 'eslint';
import svelteParser from 'svelte-eslint-parser';
import { describe, it } from 'vite-plus/test';
import { templateTernary } from '../../template-ternary.ts';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { parser: svelteParser, ecmaVersion: 'latest', sourceType: 'module' } });
const component = (markup: string, script = '') => `<script>${script}</script>\n${markup}`;

tester.run('template-ternary', templateTernary, {
    valid: [
        component('{item.name || item.value}'),
        // Calls may return a different value or run code on each read
        component('{getName() ? getName() : fallback}'),
        component('<i a={ok ? 1 : 0} />'),
        // oxlint checks the script
        component('<i />', 'const a = b ? b : c;'),
    ],
    invalid: [
        { code: component('{item.name ? item.name : item.value}'), output: component('{item.name || item.value}'), errors: [{ messageId: 'logical' }] },
        { code: component('<i a={value ? true : false} />'), output: component('<i a={!!value} />'), errors: [{ messageId: 'boolean' }] },
        { code: component('<i a={value ? false : true} />'), output: component('<i a={!value} />'), errors: [{ messageId: 'boolean' }] },
    ],
});
