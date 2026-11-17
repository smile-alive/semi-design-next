// Compiles every .vue template without identifier prefixing and fails on the errors and tips it reports.
// Usage: node scripts/lint-templates.vue.ts
// Output: one `file[:line]: message` per parse error, compile error or tip on stderr, exit code 1 on any.
// Build, tests and vue-tsc compile with prefixIdentifiers, which makes compiler-core skip checks on raw expressions such
// as X_V_IF_SAME_KEY (v-if/else branches sharing a key). Volar compiles without prefixing and reports them, so this does too.
import fs from 'node:fs';
import { compileTemplate, parse } from 'vue/compiler-sfc';
import { gitFiles } from './lib/git-files.ts';

function lintFile(file: string) {
    const { descriptor, errors } = parse(fs.readFileSync(file, 'utf8'), { filename: file });
    const messages = errors.map((error) => `${file}: ${error.message}`);
    const { template } = descriptor;
    if (!template) return messages;

    const result = compileTemplate({
        source: template.content,
        filename: file,
        id: file,
        transformAssetUrls: false,
        // module mode forces prefixing, and cached handlers need it
        compilerOptions: { mode: 'function', prefixIdentifiers: false, hoistStatic: false, cacheHandlers: false, expressionPlugins: ['typescript'] },
    });
    const compileMessages = result.errors.map((error) => {
        // error lines are relative to template.content, which starts on the <template> tag's line
        const line = typeof error === 'string' || !error.loc ? template.loc.start.line : template.loc.start.line + error.loc.start.line - 1;
        return `${file}:${line}: ${typeof error === 'string' ? error : error.message}`;
    });
    return [...messages, ...compileMessages, ...result.tips.map((tip) => `${file}: ${tip}`)];
}

const messages = gitFiles('*.vue').flatMap(lintFile);

if (messages.length) {
    console.error(messages.join('\n'));
    process.exit(1);
}
