import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { apiFiles, locales, root, runCli, website, writeFragments } from './api-table.ts';
import { type ApiDescription, type ApiMember, type ComponentApi, type Framework, members, moduleVariables, readDefault, renderApi, unwrap } from './ts-api.ts';

export { renderApi, type ApiDescription } from './ts-api.ts';
export type SvelteApi = ComponentApi;

// Native attributes come from svelte/elements and native element members from the DOM lib. Svelte components have no
// ref and pass defaults as $props() destructuring fallbacks, which extractApis reads itself.
const svelte: Framework = {
    native: /\/node_modules\/svelte\/|\/typescript\/lib\//,
    defaults: () => undefined,
    refTarget: () => undefined,
};

interface Script {
    // Where the instance script starts in `code`; statements before it belong to the module script
    instance: number;
    code: string;
}

// The `<script module>` and the instance `<script>` joined into one TypeScript module, so the checker sees the
// destructured $props() with its annotation. Runes are undeclared there and type as errors, which extraction ignores.
function readScript(path: string): Script {
    const scripts = [...readFileSync(path, 'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    const isModule = (attributes: string) => /\bmodule\b|context=["']module["']/.test(attributes);
    const instance = scripts.filter((script) => !isModule(script[1]));
    if (instance.length !== 1) throw new Error(`组件需要恰好一个实例 <script>：${path}`);
    const head = scripts
        .filter((script) => isModule(script[1]))
        .map((script) => script[2] + '\n')
        .join('');
    return { instance: head.length, code: head + instance[0][2] };
}

function isCall(node: ts.Expression, name: string): node is ts.CallExpression {
    return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name;
}

function extract(checker: ts.TypeChecker, file: ts.SourceFile, script: Script, path: string): ComponentApi {
    const variables = moduleVariables(file);
    const props = variables.find((declaration) => declaration.initializer && isCall(unwrap(declaration.initializer), '$props'));
    if (!props?.type) throw new Error(`组件需要带类型标注的 $props() 声明，如 let { ... }: XxxProps = $props() 或 const props: XxxProps = $props()：${path}`);
    // useDefaultProps returns the reader that wraps each fallback: `size = defaults('size', 'default')`
    const reader = variables.find((declaration) => declaration.initializer && isCall(unwrap(declaration.initializer), 'useDefaultProps'));
    const readerName = reader && ts.isIdentifier(reader.name) ? reader.name.text : undefined;
    const defaults = new Map<string, string>();
    const destructured: string[] = [];
    // Props left in a single identifier (`const props: X = $props()`) or a rest element (`{ a, ...props }`) have no fallback in the
    // pattern; the only ones that can be read for sure are `props.x ?? <literal>` anywhere in the file, including the template,
    // which the checker never sees. Anything else stays `-`.
    const elements = ts.isObjectBindingPattern(props.name) ? props.name.elements : [];
    const holder = ts.isIdentifier(props.name) ? props.name : elements.find((element) => element.dotDotDotToken)?.name;
    if (holder && ts.isIdentifier(holder)) {
        const access = new RegExp(`\\b${holder.text}\\.(\\w+) \\?\\? ('[^']*'|"[^"]*"|-?\\d+(?:\\.\\d+)?|true|false)(?![\\w.])`, 'g');
        for (const [, name, literal] of readFileSync(path, 'utf8').matchAll(access)) defaults.set(name, literal);
    }
    for (const element of elements) {
        if (element.dotDotDotToken) continue;
        const key = element.propertyName ?? element.name;
        if (!ts.isIdentifier(key) && !ts.isStringLiteral(key)) throw new Error(`无法读取的 prop：${path} ${element.getText()}`);
        destructured.push(key.text);
        let value = element.initializer && unwrap(element.initializer);
        if (value && readerName && isCall(value, readerName)) value = value.arguments[1];
        else if (value && isCall(value, '$bindable')) value = value.arguments[0];
        const text = value && readDefault(checker, unwrap(value));
        if (text !== undefined) defaults.set(key.text, text);
    }
    const propsType = checker.getTypeFromTypeNode(props.type);
    const own = members(svelte, checker, propsType, props, defaults);
    // A native attribute the component destructures (Spin's `children`) is handled by the component, not passed through
    const taken: ApiMember[] = destructured
        .filter((name) => !own.some((member) => member.name === name))
        .flatMap((name) => {
            const symbol = propsType.getProperty(name);
            if (!symbol) return [];
            const declaration = symbol.declarations?.find(ts.isPropertySignature);
            const type = declaration?.type ? declaration.type.getText() : checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, props), undefined, ts.TypeFormatFlags.NoTruncation);
            // svelte/elements writes `import('svelte').Snippet`; the table shows the name users import
            return [{ name, type: type.replaceAll(/import\([^)]*\)\./g, ''), optional: (symbol.flags & ts.SymbolFlags.Optional) !== 0, default: defaults.get(name) }];
        });
    // Methods are the instance script's `export function`s, reached through bind:this
    const methods = file.statements
        .flatMap((statement) => {
            if (!ts.isFunctionDeclaration(statement) || !statement.name || statement.getStart() < script.instance || !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) return [];
            const signature = checker.getSignatureFromDeclaration(statement);
            const returns = statement.type ? statement.type.getText() : signature ? checker.typeToString(signature.getReturnType()) : 'void';
            return [{ name: statement.name.text, type: `(${statement.parameters.map((parameter) => parameter.getText()).join(', ')}) => ${returns}`, optional: false }];
        })
        .toSorted((a, b) => a.name.localeCompare(b.name, 'en'));
    return { props: [...own, ...taken].toSorted((a, b) => a.name.localeCompare(b.name, 'en')), methods };
}

/** Reads each `.svelte` component: the props type its `$props()` is annotated with, their fallbacks, and its exported functions */
export function extractApis(sources: string[]): ComponentApi[] {
    const targets = sources.map((path) => {
        if (!existsSync(path)) throw new Error(`组件源文件不存在：${path}`);
        const config = ts.findConfigFile(dirname(path), existsSync);
        if (!config) throw new Error(`组件缺少 tsconfig.json：${path}`);
        const virtual = `${path}.__api.ts`;
        if (existsSync(virtual)) throw new Error(`与提取用的虚拟文件重名：${virtual}`);
        return { path, config, virtual, script: readScript(path) };
    });
    // One program per tsconfig, as in ts-api: types print from their declarations, so sharing a checker keeps the output stable
    const programs = new Map<string, ts.Program>();
    const programOf = (config: string) => {
        const cached = programs.get(config);
        if (cached) return cached;
        const parsed = ts.readConfigFile(config, (path) => ts.sys.readFile(path));
        if (parsed.error) throw new Error(ts.flattenDiagnosticMessageText(parsed.error.messageText, '\n'));
        const { options } = ts.parseJsonConfigFileContent(parsed.config, ts.sys, dirname(config));
        // The foundation's sources let a fallback such as `cssClasses.PREFIX` print as its value
        const paths = Object.fromEntries(['semi-foundation', 'semi-ai-foundation'].map((name) => [`@fibrae/${name}/*`, [join(root, 'packages', name, 'src', '*')]]));
        const merged = { ...options, paths: { ...options.paths, ...paths } };
        const codes = new Map(targets.filter((target) => target.config === config).map((target) => [target.virtual, target.script.code]));
        const host = ts.createCompilerHost(merged);
        const getSourceFile = host.getSourceFile.bind(host);
        host.getSourceFile = (name, language, ...rest) => {
            const code = codes.get(name);
            return code === undefined ? getSourceFile(name, language, ...rest) : ts.createSourceFile(name, code, language, true);
        };
        host.fileExists = (name) => codes.has(name) || ts.sys.fileExists(name);
        host.readFile = (name) => codes.get(name) ?? ts.sys.readFile(name);
        const program = ts.createProgram({ rootNames: [...codes.keys()], options: merged, host });
        programs.set(config, program);
        return program;
    };
    return targets.map(({ path, config, virtual, script }) => {
        const program = programOf(config);
        const file = program.getSourceFile(virtual);
        if (!file) throw new Error(`无法读取组件脚本：${path}`);
        return extract(program.getTypeChecker(), file, script, path);
    });
}

/** Writes, or with `check` verifies, the fragments of every `api.svelte.json` among the pages */
export function generateApis(check: boolean, pages: string[]) {
    const entries = apiFiles('svelte', pages).flatMap((file) => {
        const json = join(website, file);
        return Object.entries(JSON.parse(readFileSync(json, 'utf8')) as Record<string, ApiDescription>).map(([name, description]) => {
            if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof description.source !== 'string' || !description.source.endsWith('.svelte')) throw new Error(`无效组件配置：${json} ${name}`);
            return { json, name, description };
        });
    });
    const apis = extractApis(entries.map((entry) => resolve(root, entry.description.source)));
    const fragments = entries.flatMap((entry, index) => locales.map((locale) => ({ path: join(dirname(entry.json), 'api', `${entry.name}.svelte.${locale}.mdx`), body: renderApi(apis[index], entry.description, locale) })));
    writeFragments(fragments, check, 'Svelte');
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    runCli(generateApis);
}
