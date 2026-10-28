// Imports every `.js` module under the given dist directories in plain Node, with no bundler, the way a server
// runtime loads a published package: node import-dist.ts <collect|rsc> <exports.json> <dist-dir>...
//   collect  records each module's export names into exports.json
//   rsc      run with `--conditions=react-server`: modules marked 'use client' are replaced by client reference stubs
//            exporting the recorded names, so only the modules a Server Component evaluates itself are executed
import assert from 'node:assert';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [mode, exportsFile, ...distDirs] = process.argv.slice(2);
assert.ok(mode === 'collect' || mode === 'rsc', 'mode is collect or rsc');
const exportNames: Record<string, string[]> = mode === 'rsc' ? JSON.parse(fs.readFileSync(exportsFile, 'utf-8')) : {};
const USE_CLIENT = /^["']use client["']/;
let stubbed = 0;

// A client reference can be passed along on the server but never called, written to or dotted into; React's own proxy
// throws the same, apart from the metadata keys the runtime probes
function clientReferenceSource(file: string) {
    const names = exportNames[file];
    assert.ok(names, `${file} was imported by the collect run`);
    return [
        "const metadata = new Set(['then', '$$typeof', '$$id', '$$async', 'name', 'displayName', 'prototype', 'length']);",
        'const reference = (id) => new Proxy(function () {}, {',
        '    get(target, key) {',
        "        if (typeof key === 'symbol' || metadata.has(key)) { return Reflect.get(target, key); }",
        '        throw new Error(`Cannot access ${id}.${key} on the server: it is a client module`);',
        '    },',
        '    apply() { throw new Error(`Attempted to call ${id} from the server but it is on the client`); },',
        '    construct() { throw new Error(`Attempted to construct ${id} from the server but it is on the client`); },',
        '    set() { throw new Error(`Cannot assign to ${id}: it is a client module imported from a server module`); },',
        '    defineProperty() { throw new Error(`Cannot assign to ${id}: it is a client module imported from a server module`); },',
        '});',
        ...names.map((name, index) => `const stub${index} = reference(${JSON.stringify(`${file}#${name}`)});`),
        `export { ${names.map((name, index) => `stub${index} as ${JSON.stringify(name)}`).join(', ')} };`,
        '',
    ].join('\n');
}

registerHooks({
    load(url, context, nextLoad) {
        // The Semi plugins own stylesheets in a bundler; Node cannot load them
        if (url.endsWith('.css')) {
            return { format: 'module', source: '', shortCircuit: true };
        }
        const loaded = nextLoad(url, context);
        if (mode === 'rsc' && url.endsWith('.js') && USE_CLIENT.test(String(loaded.source).slice(0, 20))) {
            stubbed++;
            return { format: 'module', source: clientReferenceSource(fileURLToPath(url)), shortCircuit: true };
        }
        return loaded;
    },
});

const failures: string[] = [];
let imported = 0;
for (const distDir of distDirs) {
    for (const relative of fs.globSync('**/*.js', { cwd: distDir }).toSorted()) {
        const file = fs.realpathSync(path.join(distDir, relative));
        try {
            const namespace = await import(pathToFileURL(file).href);
            exportNames[file] = Object.keys(namespace);
            imported++;
        } catch (error) {
            failures.push(`${path.join(distDir, relative)}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
if (failures.length > 0) {
    console.error(`${failures.length} of ${imported + failures.length} modules failed to import in ${mode} mode:\n${failures.slice(0, 20).join('\n')}`);
    process.exit(1);
}
if (mode === 'collect') {
    fs.writeFileSync(exportsFile, JSON.stringify(exportNames));
} else {
    assert.ok(stubbed > 0, "the 'use client' modules were replaced by stubs");
    const [stub] = Object.entries(exportNames).find(([file, names]) => names.includes('default') && USE_CLIENT.test(fs.readFileSync(file, 'utf-8'))) ?? [];
    assert.ok(stub, "a 'use client' module with a default export exists");
    const { default: reference } = await import(pathToFileURL(stub).href);
    assert.throws(() => reference(), /from the server/, 'calling a client reference throws');
    assert.throws(() => (reference as { Title: unknown }).Title, /Cannot access/, 'reading a property of a client reference throws');
    assert.throws(() => Object.assign(reference, { Title: 1 }), /Cannot assign/, 'assigning to a client reference throws');
}
console.log(`${mode}: ${imported} modules imported${mode === 'rsc' ? `, ${stubbed} client references` : ''}`);
