// Writes the English API-table prop descriptions into the built .d.ts files of the UI and AI packages as JSDoc.
// Usage: node website/scripts/dts-jsdoc.ts [package...] (semi-ui-<framework> or semi-ai-<framework>; default all, needs built dist)
// Output: one PASS/FAIL line per package with injection counts plus unmatched props, exit code 1 on a package that injected or already carried nothing
import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import ts from 'typescript';
import { readJson } from '../../scripts/lib/json.ts';
import { root, website } from '../../scripts/lib/paths.ts';

const packageNames = ['react', 'vue', 'solid', 'svelte'].flatMap((framework) => [`semi-ui-${framework}`, `semi-ai-${framework}`]);

interface Candidate {
    text: string;
    own: boolean;
}

interface Target {
    declaration: ts.Declaration;
    candidates: Candidate[];
}

interface Insert {
    fileName: string;
    position: number;
    text: string;
}

interface Report {
    injected: number;
    current: number;
    documented: number;
    external: number;
    conflicts: number;
    unmatched: string[];
}

type Entry = ReturnType<typeof readEntries>[number];

const comment = (text: string) => `/** ${text.replaceAll('*/', '*\\/')} */`;

function readEntries() {
    return globSync('content/**/api.*.json', { cwd: website })
        .toSorted()
        .flatMap((file) =>
            Object.entries(readJson<Record<string, { source: string; props?: Record<string, { 'en-US': string }> }>>(join(website, file))).map(([name, description]) => {
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

function createDtsProgram(dist: string) {
    const rootNames = globSync('**/*.d.ts', { cwd: dist }).map((file) => join(dist, file));
    return ts.createProgram({
        rootNames,
        options: { module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ESNext, skipLibCheck: true, noEmit: true, types: [] },
    });
}

/** A declaration shared by several components collects several candidates */
function collectTargets(program: ts.Program, packageName: string, entries: Entry[], report: Report) {
    const packageDir = join(root, 'packages', packageName);
    const dist = join(packageDir, 'dist') + '/';
    const checker = program.getTypeChecker();
    const targets = new Map<string, Target>();

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
                const declarationFile = declaration.getSourceFile().fileName;
                const target = targets.getOrInsertComputed(`${declarationFile}:${declaration.getStart()}`, () => ({ declaration, candidates: [] }));
                target.candidates.push({ text: comment(description['en-US']), own: dirname(declarationFile) === dirname(distFile) });
            }
        }
    }
    return targets;
}

/** Undefined when the declaration already has a description; counts the outcome in `report` */
function planInsert({ declaration, candidates }: Target, report: Report): Insert | undefined {
    // A props interface shared through Pick or extends takes the description from the component that declares it
    const [winner] = candidates.toSorted((a, b) => Number(b.own) - Number(a.own));
    const file = declaration.getSourceFile();
    const comments = (ts.getLeadingCommentRanges(file.text, declaration.pos) ?? []).map((range) => file.text.slice(range.pos, range.end));
    if (comments.includes(winner.text)) {
        report.current++;
        return undefined;
    }
    if (comments.some((text) => text.startsWith('/**'))) {
        report.documented++;
        return undefined;
    }
    if (new Set(candidates.map((candidate) => candidate.text)).size > 1) report.conflicts++;
    const start = declaration.getStart();
    const indent = file.text.slice(file.getPositionOfLineAndCharacter(file.getLineAndCharacterOfPosition(start).line, 0), start);
    // A member sharing its line with other code (`{ a?: X; b?: Y }`) takes the comment inline
    const text = indent.trim() ? `${winner.text} ` : `${winner.text}\n${indent}`;
    report.injected++;
    return { fileName: file.fileName, position: start, text };
}

function writeInserts(inserts: Insert[]) {
    for (const [fileName, fileInserts] of Map.groupBy(inserts, (insert) => insert.fileName)) {
        // Back to front, so earlier positions stay valid
        const text = fileInserts.toSorted((a, b) => b.position - a.position).reduce((source, { position, text: insert }) => source.slice(0, position) + insert + source.slice(position), readFileSync(fileName, 'utf8'));
        writeFileSync(fileName, text);
    }
}

function processPackage(packageName: string, entries: Entry[]) {
    const report: Report = { injected: 0, current: 0, documented: 0, external: 0, conflicts: 0, unmatched: [] };
    const program = createDtsProgram(join(root, 'packages', packageName, 'dist') + '/');
    const targets = collectTargets(program, packageName, entries, report);
    writeInserts([...targets.values()].map((target) => planInsert(target, report)).filter((insert) => insert !== undefined));
    return report;
}

const { positionals: selected } = parseArgs({ allowPositionals: true });
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
