import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import { apiFiles, apiType, type Description, type Locale, locales, renderTable, root, website, writeFragments } from './api-table.ts';

export interface ApiDescription {
    /** Repo-relative component file; `<file>#<Name>` reads the named export `Name` instead of the default export */
    source: string;
    props: Record<string, Description>;
    /** Methods of what `ref` receives; required only when the component has them */
    methods?: Record<string, Description>;
}
export interface ApiMember {
    name: string;
    type: string;
    optional: boolean;
    default?: string;
}
export interface ComponentApi {
    props: ApiMember[];
    methods: ApiMember[];
}

/** What sets one framework's components apart for the extraction */
export interface Framework {
    /** Declarations in matching files are the platform's native attributes and members, left out of the tables */
    native: RegExp;
    /** The object literal holding the component's defaults, an expression that resolves to one, or a destructured parameter */
    defaults: (checker: ts.TypeChecker, file: ts.SourceFile, component: ts.Symbol, name: string) => ts.Expression | ts.ObjectBindingPattern | undefined;
    /** What a `ref` of this (non-nullable) type receives; its own members are the Methods table */
    refTarget: (checker: ts.TypeChecker, refType: ts.Type) => ts.Type | undefined;
}

const headings: Record<Locale, string[][]> = {
    'zh-CN': [
        ['属性', '说明', '类型', '默认值'],
        ['方法', '说明', '类型'],
    ],
    'en-US': [
        ['Property', 'Description', 'Type', 'Default'],
        ['Method', 'Description', 'Type'],
    ],
};

export function unwrap(expression: ts.Expression) {
    while (ts.isSatisfiesExpression(expression) || ts.isAsExpression(expression) || ts.isParenthesizedExpression(expression)) expression = expression.expression;
    return expression;
}

/** The module-level variables of a file */
export function moduleVariables(file: ts.SourceFile) {
    return file.statements.filter(ts.isVariableStatement).flatMap((statement) => [...statement.declarationList.declarations]);
}

type Constant = string | number | boolean | null | Constant[];
const unresolved = Symbol('unresolved');

function formatConstant(value: Constant): string {
    if (Array.isArray(value)) return `[${value.map(formatConstant).join(', ')}]`;
    return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

// Follows a default to the literals it is built from, so `cssClasses.PREFIX` prints as the class prefix even when the
// constants object is not `as const`; anything else (a function, a value computed at run time) stays unresolved.
function evaluate(checker: ts.TypeChecker, node: ts.Expression | ts.QualifiedName, depth = 0): Constant | typeof unresolved {
    if (depth > 20) return unresolved;
    const next = (expression: ts.Expression) => evaluate(checker, expression, depth + 1);
    if (!ts.isQualifiedName(node)) node = unwrap(node);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return node.kind === ts.SyntaxKind.TrueKeyword;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
        const value = next(node.operand);
        return typeof value === 'number' ? -value : unresolved;
    }
    if (ts.isTemplateExpression(node)) {
        let text = node.head.text;
        for (const span of node.templateSpans) {
            const value = next(span.expression);
            if (typeof value !== 'string' && typeof value !== 'number') return unresolved;
            text += `${value}${span.literal.text}`;
        }
        return text;
    }
    if (ts.isArrayLiteralExpression(node)) {
        const items: Constant[] = [];
        for (const element of node.elements) {
            const value = next(ts.isSpreadElement(element) ? element.expression : element);
            if (value === unresolved) return unresolved;
            if (!ts.isSpreadElement(element)) items.push(value);
            else if (Array.isArray(value)) items.push(...value);
            else return unresolved;
        }
        return items;
    }
    if (ts.isElementAccessExpression(node)) {
        const array = next(node.expression);
        const index = next(node.argumentExpression);
        return Array.isArray(array) && typeof index === 'number' && index in array ? array[index] : unresolved;
    }
    if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node) || ts.isQualifiedName(node)) {
        const declaration = valueDeclaration(checker, node);
        const constant = declaration && ts.isVariableDeclaration(declaration) && (ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) !== 0;
        if ((constant || (declaration && ts.isPropertyAssignment(declaration))) && declaration.initializer) return next(declaration.initializer);
    }
    return unresolved;
}

/** The declaration a name refers to, through imports */
export function valueDeclaration(checker: ts.TypeChecker, node: ts.Node) {
    let symbol = checker.getSymbolAtLocation(node);
    if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    // A member copied by an object spread keeps the original declarations but not the value declaration
    return symbol?.valueDeclaration ?? (symbol && symbol.flags & ts.SymbolFlags.Transient ? symbol.declarations?.[0] : undefined);
}

function typeQueries(node: ts.Node) {
    if (ts.isTypeQueryNode(node)) return [node];
    const queries: ts.TypeQueryNode[] = [];
    ts.forEachChild(node, (child) => void queries.push(...typeQueries(child)));
    return queries;
}

// Prints a type as written, except where it names something a reader cannot look up: a `typeof` query over constants
// prints the literals it resolves to, and a non-generic alias a module keeps to itself prints its definition (a global
// or a namespace member, such as `JSX.Element`, can be looked up).
function printType(checker: ts.TypeChecker, node: ts.Node): string {
    const queries = ts.isTypeNode(node) ? typeQueries(node) : [];
    if (queries.length) {
        const type = checker.getTypeFromTypeNode(node as ts.TypeNode);
        const parts = type.isUnion() ? type.types : [type];
        if (parts.every((part) => part.isLiteral())) {
            // The checker orders a union by when it met each literal; the constants give the order the author wrote
            const order = queries.flatMap((query) => [evaluate(checker, query.exprName)].flat());
            const rank = (part: ts.Type) => {
                const index = order.indexOf((part as ts.LiteralType).value as Constant);
                return index < 0 ? order.length : index;
            };
            return parts
                .toSorted((a, b) => rank(a) - rank(b))
                .map((part) => checker.typeToString(part, undefined, ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType))
                .join(' | ');
        }
    }
    if (ts.isTypeReferenceNode(node) && !node.typeArguments) {
        const alias = checker.getSymbolAtLocation(node.typeName)?.declarations?.find(ts.isTypeAliasDeclaration);
        const local = alias && ts.isSourceFile(alias.parent) && ts.isExternalModule(alias.parent) && !alias.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
        if (alias && local && !alias.typeParameters) {
            const definition = printType(checker, alias.type);
            const loose = ts.isUnionTypeNode(alias.type) || ts.isIntersectionTypeNode(alias.type) || ts.isFunctionTypeNode(alias.type) || ts.isConditionalTypeNode(alias.type);
            const tight = ts.isArrayTypeNode(node.parent) || ts.isIndexedAccessTypeNode(node.parent) || ts.isTypeOperatorNode(node.parent) || ts.isIntersectionTypeNode(node.parent);
            return loose && tight ? `(${definition})` : definition;
        }
    }
    const source = node.getSourceFile().text;
    let text = '';
    let position = node.getStart();
    ts.forEachChild(node, (child) => {
        text += source.slice(position, child.getStart()) + printType(checker, child);
        position = child.end;
    });
    return text + source.slice(position, node.end);
}

function isNative(framework: Framework, declaration: ts.Declaration) {
    return framework.native.test(declaration.getSourceFile().fileName);
}

function memberType(framework: Framework, checker: ts.TypeChecker, symbol: ts.Symbol, location: ts.Node) {
    // A handle method may share its name with a native one (`focus`); the handle's declaration documents it
    const declaration = symbol.declarations?.find((item) => !isNative(framework, item));
    if (declaration && ts.isPropertySignature(declaration) && declaration.type) return printType(checker, declaration.type);
    if (declaration && ts.isMethodSignature(declaration)) {
        return `(${declaration.parameters.map((parameter) => printType(checker, parameter)).join(', ')}) => ${declaration.type ? printType(checker, declaration.type) : 'void'}`;
    }
    return checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, location), undefined, ts.TypeFormatFlags.NoTruncation);
}

// Shapes that type a member differently document the union of their types: a type another one already accepts adds
// nothing, and a function type is parenthesized so the union does not read as its return type.
function unionType(framework: Framework, checker: ts.TypeChecker, symbols: ts.Symbol[], location: ts.Node) {
    const types = symbols.map((symbol) => checker.getTypeOfSymbolAtLocation(symbol, location));
    const covered = (index: number) => types.some((other, otherIndex) => otherIndex !== index && checker.isTypeAssignableTo(types[index], other) && (otherIndex < index || !checker.isTypeAssignableTo(other, types[index])));
    const texts = [...new Set(symbols.filter((_, index) => !covered(index)).map((symbol) => memberType(framework, checker, symbol, location).replaceAll(/\s+/g, ' ')))];
    return texts.length === 1 ? texts[0] : texts.map((text) => (text.includes('=>') ? `(${text})` : text)).join(' | ');
}

export function members(framework: Framework, checker: ts.TypeChecker, type: ts.Type, location: ts.Node, defaults = new Map<string, string>()): ApiMember[] {
    // Props written as a union of shapes (one per mode) document the members of every shape, a member some shape lacks
    // being optional. A shape that is another component's props (Feedback's modal mode is a Modal) adds only what the
    // component declares itself; the rest is documented on that component's page.
    const shapes = type.isUnion() ? type.types : [type];
    const directory = dirname(location.getSourceFile().fileName);
    const named = new Map<string, ts.Symbol[]>();
    for (const shape of shapes) {
        for (const symbol of checker.getPropertiesOfType(shape)) named.set(symbol.name, [...(named.get(symbol.name) ?? []), symbol]);
    }
    const own = (symbol: ts.Symbol) => (symbol.declarations ?? []).some((declaration) => dirname(declaration.getSourceFile().fileName) === directory);
    // `x-semi-*` attributes are markers the documentation site reads, not API
    return [...named]
        .filter(([name]) => !name.startsWith('x-semi-'))
        .map(([name, symbols]) => ({ name, symbols, declared: symbols.filter((symbol) => !(symbol.declarations ?? []).every((declaration) => isNative(framework, declaration))) }))
        .filter(({ symbols, declared }) => declared.length && (symbols.length === shapes.length || declared.some(own)))
        .map(({ name, symbols, declared }) => ({
            name,
            type: unionType(framework, checker, declared, location),
            optional: symbols.length < shapes.length || symbols.some((symbol) => (symbol.flags & ts.SymbolFlags.Optional) !== 0),
            default: defaults.get(name),
        }))
        .toSorted((a, b) => a.name.localeCompare(b.name, 'en'));
}

// A default built from literals prints as its value (a declaration file has no initializers, but a literal type still
// gives the value), anything else as its source text; a bare name the code defines that does not resolve to a literal
// (`noop`, a local computed at run time) means nothing to a reader and is left out, while a global such as `Infinity`
// stays, and a constant object shared from another module prints as its literal. A spread of another defaults object
// contributes its members.
export function readDefault(checker: ts.TypeChecker, value: ts.Expression) {
    const constant = evaluate(checker, value);
    const type = checker.getTypeAtLocation(value);
    const literal = type.isLiteral() || (type.flags & (ts.TypeFlags.BooleanLiteral | ts.TypeFlags.Null)) !== 0;
    const declaration = ts.isIdentifier(value) ? valueDeclaration(checker, value) : undefined;
    const initializer = declaration && ts.isVariableDeclaration(declaration) && declaration.initializer ? unwrap(declaration.initializer) : undefined;
    if (initializer && ts.isObjectLiteralExpression(initializer)) return initializer.getText();
    const internal = ts.isIdentifier(value) && !/\/typescript\/lib\//.test(declaration?.getSourceFile().fileName ?? '');
    return constant !== unresolved ? formatConstant(constant) : literal ? checker.typeToString(type) : internal ? undefined : value.getText();
}

function readDefaults(checker: ts.TypeChecker, file: ts.SourceFile, initializer?: ts.Expression | ts.ObjectBindingPattern, defaults = new Map<string, string>()) {
    if (!initializer) return defaults;
    if (ts.isObjectBindingPattern(initializer)) {
        for (const element of initializer.elements) {
            const key = element.propertyName ?? element.name;
            const value = element.initializer && !element.dotDotDotToken && (ts.isIdentifier(key) || ts.isStringLiteral(key)) ? readDefault(checker, unwrap(element.initializer)) : undefined;
            if (value !== undefined) defaults.set((key as ts.Identifier | ts.StringLiteral).text, value);
        }
        return defaults;
    }
    let object = unwrap(initializer);
    if (ts.isIdentifier(object)) {
        const declaration = valueDeclaration(checker, object);
        if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer) object = unwrap(declaration.initializer);
    }
    if (!ts.isObjectLiteralExpression(object)) throw new Error(`默认值不是对象字面量：${file.fileName}`);
    for (const property of object.properties) {
        if (ts.isSpreadAssignment(property)) {
            readDefaults(checker, file, property.expression, defaults);
            continue;
        }
        const value = ts.isPropertyAssignment(property) ? unwrap(property.initializer) : ts.isShorthandPropertyAssignment(property) ? property.name : undefined;
        if (!value || !property.name || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) throw new Error(`无法读取的默认值成员：${file.fileName} ${property.getText()}`);
        const text = readDefault(checker, value);
        if (text !== undefined) defaults.set(property.name.text, text);
    }
    return defaults;
}

/** Reads the component each source names: its own props, their defaults, and the methods of what its `ref` receives */
export function extractApis(framework: Framework, sources: string[]): ComponentApi[] {
    const targets = sources.map((source) => {
        const [path, name = 'default'] = source.split('#');
        return { path, name };
    });
    const configs = targets.map(({ path }) => {
        if (!existsSync(path)) throw new Error(`组件源文件不存在：${path}`);
        const config = ts.findConfigFile(dirname(path), existsSync);
        if (!config) throw new Error(`组件缺少 tsconfig.json：${path}`);
        return config;
    });
    // One program per tsconfig: types print from their declarations, so sharing a checker keeps the output stable.
    const programs = new Map<string, ts.Program>();
    const programOf = (config: string) => {
        const cached = programs.get(config);
        if (cached) return cached;
        const parsed = ts.readConfigFile(config, (path) => ts.sys.readFile(path));
        if (parsed.error) throw new Error(ts.flattenDiagnosticMessageText(parsed.error.messageText, '\n'));
        const { options } = ts.parseJsonConfigFileContent(parsed.config, ts.sys, dirname(config));
        // A foundation's built declarations keep the types of its constants but not their values; its sources let a
        // default such as `cssClasses.PREFIX` print as the value.
        const paths = Object.fromEntries(['semi-foundation', 'semi-ai-foundation'].map((name) => [`@fibrae/${name}/*`, [join(root, 'packages', name, 'src', '*')]]));
        const program = ts.createProgram({ rootNames: targets.filter((_, index) => configs[index] === config).map(({ path }) => path), options: { ...options, paths: { ...options.paths, ...paths } } });
        programs.set(config, program);
        return program;
    };
    return targets.map(({ path, name }, index) => {
        const program = programOf(configs[index]);
        const checker = program.getTypeChecker();
        const file = program.getSourceFile(path);
        const module = file && checker.getSymbolAtLocation(file);
        const exported = module && checker.getExportsOfModule(module).find((symbol) => symbol.escapedName === name);
        if (!file || !exported) throw new Error(`组件源文件没有导出 ${name}：${path}`);
        const component = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
        const [signature] = checker.getTypeOfSymbolAtLocation(component, file).getCallSignatures();
        if (!signature) throw new Error(`导出 ${name} 不是组件：${path}`);
        const [parameter] = signature.getParameters();
        if (!parameter) return { props: [], methods: [] };
        const propsType = checker.getTypeOfSymbolAtLocation(parameter, file);
        const ref = propsType.getProperty('ref');
        const target = ref && framework.refTarget(checker, checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(ref, file)));
        const defaults = readDefaults(checker, file, framework.defaults(checker, file, component, name));
        return { props: members(framework, checker, propsType, file, defaults), methods: target ? members(framework, checker, target, file) : [] };
    });
}

export function renderApi(api: ComponentApi, description: ApiDescription, locale: Locale) {
    const [propHeadings, methodHeadings] = headings[locale];
    const props = api.props.map((prop) => ({ name: prop.name, cells: [apiType(prop.type, prop.optional), prop.default === undefined ? '-' : apiType(prop.default)] }));
    const tables = [renderTable('props', 'Props', propHeadings, props, description.props, locale)];
    if (api.methods.length || description.methods) {
        const methods = api.methods.map((method) => ({ name: method.name, cells: [apiType(method.type)] }));
        tables.push(renderTable('methods', 'Methods', methodHeadings, methods, description.methods, locale));
    }
    return tables.join('\n\n') + '\n';
}

/** Writes, or with `check` verifies, the fragments of every `api.<id>.json` among the pages */
export function generateApis(framework: Framework, id: string, label: string, check: boolean, pages: string[]) {
    const entries = apiFiles(id, pages).flatMap((file) => {
        const json = join(website, file);
        return Object.entries(JSON.parse(readFileSync(json, 'utf8')) as Record<string, ApiDescription>).map(([name, description]) => {
            if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof description.source !== 'string') throw new Error(`无效组件配置：${json} ${name}`);
            return { json, name, description };
        });
    });
    const apis = extractApis(
        framework,
        entries.map((entry) => resolve(root, entry.description.source))
    );
    const fragments = entries.flatMap((entry, index) => locales.map((locale) => ({ path: join(dirname(entry.json), 'api', `${entry.name}.${id}.${locale}.mdx`), body: renderApi(apis[index], entry.description, locale) })));
    writeFragments(fragments, check, label);
}
