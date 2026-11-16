import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import ts from 'typescript';
import { root, website } from './api-table.ts';

const packageNames = ['react', 'vue', 'solid', 'svelte'].flatMap((framework) => [`semi-ui-${framework}`, `semi-ai-${framework}`]);

interface Candidate {
    text: string;
    own: boolean;
}

interface Report {
    injected: number;
    current: number;
    documented: number;
    external: number;
    conflicts: number;
    unmatched: string[];
}

const comment = (text: string) => `/** ${text.replaceAll('*/', '*\\/')} */`;

function readEntries() {
    return globSync('content/**/api.*.json', { cwd: website })
        .toSorted()
        .flatMap((file) =>
            Object.entries(JSON.parse(readFileSync(join(website, file), 'utf8')) as Record<string, { source: string; props?: Record<string, { 'en-US': string }> }>).map(([name, description]) => {
                const [path, exportName = 'default'] = description.source.split('#');
                return { name, path, exportName, props: description.props ?? {} };
            })
        );
}

// The props of a component as a consumer sees them: Vue's DefineComponent keeps defaulted props in `$props` and the
// rest on the instance, and a Svelte Component takes its props after the internals.
function propsTypes(checker: ts.TypeChecker, type: ts.Type, svelte: boolean) {
    for (const signature of type.getConstructSignatures()) {
        const instance = signature.getReturnType();
        const props = instance.getProperty('$props');
        if (props) return [checker.getTypeOfSymbol(props), instance];
    }
    const parameter = type.getCallSignatures()[0]?.getParameters()[svelte ? 1 : 0];
    return parameter ? [checker.getTypeOfSymbol(parameter)] : [];
}

function processPackage(packageName: string, entries: ReturnType<typeof readEntries>) {
    const packageDir = join(root, 'packages', packageName);
    const dist = join(packageDir, 'dist') + '/';
    const files = globSync('**/*.d.ts', { cwd: dist }).map((file) => join(dist, file));
    const program = ts.createProgram({
        rootNames: files,
        options: { module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ESNext, skipLibCheck: true, noEmit: true, types: [] },
    });
    const checker = program.getTypeChecker();
    const report: Report = { injected: 0, current: 0, documented: 0, external: 0, conflicts: 0, unmatched: [] };
    const targets = new Map<string, { declaration: ts.Declaration; candidates: Candidate[] }>();

    for (const entry of entries.filter((item) => item.path.startsWith(`packages/${packageName}/src/`))) {
        const distFile = join(dist, relative(join(packageDir, 'src'), join(root, entry.path)).replace(/\.(tsx?|vue)$/, '') + '.d.ts');
        const file = program.getSourceFile(distFile);
        const module = file && checker.getSymbolAtLocation(file);
        const exported = module && checker.getExportsOfModule(module).find((symbol) => symbol.escapedName === entry.exportName);
        if (!file || !exported) {
            report.unmatched.push(`${entry.name}（${relative(root, distFile)} 缺少导出 ${entry.exportName}）`);
            continue;
        }
        const component = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
        const shapes = propsTypes(checker, checker.getTypeOfSymbolAtLocation(component, file), packageName.endsWith('-svelte')).flatMap((type) => (type.isUnion() ? type.types : [type]));
        for (const [prop, description] of Object.entries(entry.props)) {
            const declarations = shapes.flatMap((shape) => checker.getPropertyOfType(shape, prop)?.declarations ?? []);
            const local = declarations.filter((declaration) => declaration.getSourceFile().fileName.startsWith(dist));
            if (!local.length) {
                if (declarations.length) report.external++;
                else report.unmatched.push(`${entry.name}.${prop}`);
                continue;
            }
            for (const declaration of local) {
                const key = `${declaration.getSourceFile().fileName}:${declaration.getStart()}`;
                const target = targets.get(key) ?? { declaration, candidates: [] };
                target.candidates.push({ text: comment(description['en-US']), own: dirname(declaration.getSourceFile().fileName) === dirname(distFile) });
                targets.set(key, target);
            }
        }
    }

    const edits = new Map<string, { position: number; text: string }[]>();
    for (const { declaration, candidates } of targets.values()) {
        // A props interface shared through Pick or extends takes the description from the component that declares it
        const [winner] = candidates.toSorted((a, b) => Number(b.own) - Number(a.own));
        const file = declaration.getSourceFile();
        const comments = (ts.getLeadingCommentRanges(file.text, declaration.pos) ?? []).map((range) => file.text.slice(range.pos, range.end));
        if (comments.includes(winner.text)) {
            report.current++;
            continue;
        }
        if (comments.some((text) => text.startsWith('/**'))) {
            report.documented++;
            continue;
        }
        if (new Set(candidates.map((candidate) => candidate.text)).size > 1) report.conflicts++;
        const start = declaration.getStart();
        const indent = file.text.slice(file.getPositionOfLineAndCharacter(file.getLineAndCharacterOfPosition(start).line, 0), start);
        // A member sharing its line with other code (`{ a?: X; b?: Y }`) takes the comment inline
        const text = indent.trim() ? `${winner.text} ` : `${winner.text}\n${indent}`;
        edits.set(file.fileName, [...(edits.get(file.fileName) ?? []), { position: start, text }]);
        report.injected++;
    }
    for (const [fileName, inserts] of edits) {
        let text = readFileSync(fileName, 'utf8');
        for (const { position, text: insert } of inserts.toSorted((a, b) => b.position - a.position)) text = text.slice(0, position) + insert + text.slice(position);
        writeFileSync(fileName, text);
    }
    return report;
}

const selected = process.argv.slice(2);
for (const name of selected) {
    if (!packageNames.includes(name)) throw new Error(`未知包：${name}，可选 ${packageNames.join(' ')}`);
}
const entries = readEntries();
let failed = false;
for (const packageName of selected.length ? selected : packageNames) {
    const report = processPackage(packageName, entries);
    const ok = report.injected + report.current > 0;
    failed ||= !ok;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${packageName}：已注入 ${report.injected}，已是本说明 ${report.current}，已有 JSDoc 跳过 ${report.documented}，外部声明跳过 ${report.external}，说明冲突 ${report.conflicts}，未匹配 ${report.unmatched.length}`);
    for (const item of report.unmatched) console.log(`  未匹配 ${item}`);
}
if (failed) process.exitCode = 1;
