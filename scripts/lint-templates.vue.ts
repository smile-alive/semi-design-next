// Build, tests and vue-tsc compile templates with prefixIdentifiers, and compiler-core then skips checks that compare
// raw expressions, such as X_V_IF_SAME_KEY (v-if/else branches sharing a key). Volar compiles without prefixing and
// reports them in the editor, so lint compiles every template once more the same way.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { compileTemplate, parse } from 'vue/compiler-sfc';

const files = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', '*.vue'], { encoding: 'utf8' })
    .stdout.split('\n')
    // --cached still lists files deleted in the worktree but not yet staged
    .filter((file) => file && fs.existsSync(file));

let failed = false;

for (const file of files) {
    const { descriptor, errors } = parse(fs.readFileSync(file, 'utf8'), { filename: file });
    for (const error of errors) {
        console.error(`${file}: ${error.message}`);
        failed = true;
    }
    const { template } = descriptor;
    if (!template) continue;

    const result = compileTemplate({
        source: template.content,
        filename: file,
        id: file,
        transformAssetUrls: false,
        // module mode forces prefixing, and cached handlers need it
        compilerOptions: { mode: 'function', prefixIdentifiers: false, hoistStatic: false, cacheHandlers: false, expressionPlugins: ['typescript'] },
    });
    for (const error of result.errors) {
        // template.content starts on the line of the <template> tag
        const line = typeof error === 'string' || !error.loc ? template.loc.start.line : template.loc.start.line + error.loc.start.line - 1;
        console.error(`${file}:${line}: ${typeof error === 'string' ? error : error.message}`);
        failed = true;
    }
    for (const tip of result.tips) {
        console.error(`${file}: ${tip}`);
        failed = true;
    }
}

if (failed) process.exit(1);
