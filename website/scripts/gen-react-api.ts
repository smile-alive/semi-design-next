import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { runCli } from './api-table.ts';
import { type Framework, extractApis as extract, generateApis as generate, moduleVariables, unwrap, valueDeclaration } from './ts-api.ts';

export { renderApi, type ApiDescription, type ComponentApi as ReactApi } from './ts-api.ts';

const wrappers = new Set(['memo', 'forwardRef']);

// The function behind an exported component: `Object.assign(memo(Button), statics)` and the like take the function as
// their first argument.
function componentFunction(checker: ts.TypeChecker, node: ts.Node | undefined, depth = 0): ts.FunctionLikeDeclaration | undefined {
    if (!node || depth > 10) return undefined;
    const next = (child: ts.Node | undefined) => componentFunction(checker, child, depth + 1);
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) return node;
    if (ts.isExportAssignment(node)) return next(node.expression);
    if (ts.isVariableDeclaration(node)) return next(node.initializer);
    if (!ts.isExpression(node)) return undefined;
    const expression = unwrap(node);
    if (ts.isCallExpression(expression)) {
        const callee = expression.expression;
        const name = ts.isPropertyAccessExpression(callee) ? callee.name.text : ts.isIdentifier(callee) ? callee.text : '';
        const assign = ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.expression.text === 'Object' && name === 'assign';
        return assign || wrappers.has(name) ? next(expression.arguments[0]) : undefined;
    }
    if (ts.isIdentifier(expression)) return next(valueDeclaration(checker, expression));
    return next(expression);
}

const react: Framework = {
    // Native attributes come from @types/react (through ElementProps) and native element members from the DOM lib
    native: /\/(@types\/react|typescript\/lib)\//,
    // The defaults the component passes to useDefaultProps with its own props, or else the ones its destructured props
    // parameter declares; a module-level `defaultProps` stands in when the function is out of reach. A useDefaultProps
    // call fed with other values (a parent's context) reads another component's defaults.
    defaults(checker, file, component) {
        const own = new Set<string>();
        const bind = (name: ts.BindingName) => {
            if (ts.isIdentifier(name)) own.add(name.text);
            else name.elements.forEach((element) => ts.isBindingElement(element) && bind(element.name));
        };
        const mentionsOwn = (node: ts.Node): boolean => {
            if (ts.isIdentifier(node)) return own.has(node.text);
            if (ts.isPropertyAccessExpression(node)) return mentionsOwn(node.expression);
            if (ts.isPropertyAssignment(node)) return mentionsOwn(node.initializer);
            return ts.forEachChild(node, (child) => mentionsOwn(child) || undefined) ?? false;
        };
        let found: ts.Expression | undefined;
        const visit = (node: ts.Node) => {
            if (found) return;
            if (ts.isVariableDeclaration(node) && node.initializer && mentionsOwn(node.initializer)) bind(node.name);
            if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'useDefaultProps') {
                const [, props, defaults] = node.arguments;
                if (props && defaults && mentionsOwn(props)) found = defaults;
            }
            ts.forEachChild(node, visit);
        };
        const fn = componentFunction(checker, component.valueDeclaration ?? component.declarations?.[0]);
        if (fn?.parameters[0]) bind(fn.parameters[0].name);
        if (fn?.body) visit(fn.body);
        const parameter = fn?.parameters[0]?.name;
        return found ?? (parameter && ts.isObjectBindingPattern(parameter) ? parameter : moduleVariables(file).find((declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === 'defaultProps')?.initializer);
    },
    // Ref<T> is a callback taking T, an object holding T, or null; the callback names T
    refTarget(checker, refType) {
        const [callback] = (refType.isUnion() ? refType.types : [refType]).flatMap((type) => type.getCallSignatures());
        const [parameter] = callback?.getParameters() ?? [];
        return parameter && checker.getNonNullableType(checker.getTypeOfSymbol(parameter));
    },
};

export const extractApis = (sources: string[]) => extract(react, sources);

export const generateApis = (check: boolean, pages: string[]) => generate(react, 'react', 'React', check, pages);

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    runCli(generateApis);
}
