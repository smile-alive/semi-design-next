import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { runCli } from './api-table.ts';
import { type ComponentApi, type Framework, extractApis as extract, generateApis as generate, moduleVariables, unwrap } from './ts-api.ts';

export { renderApi, type ApiDescription } from './ts-api.ts';
export type SolidApi = ComponentApi;

const solid: Framework = {
    // Native attributes come from solid-js's JSX types (through ElementProps) and native element members from the DOM lib
    native: /\/(solid-js|typescript\/lib)\//,
    // A default export passes the module-level `defaultProps` to useDefaultProps (an Object.assign wrapper hides the
    // call, so it is found by name); other components pass their defaults to mergeProps, as a module-level object or a
    // literal.
    defaults(checker, file, component, name) {
        const declarations = moduleVariables(file);
        const defaultProps = declarations.find((declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === 'defaultProps');
        if (name === 'default' && defaultProps) return defaultProps.initializer;
        let found: ts.Expression | undefined;
        const visit = (node: ts.Node) => {
            if (found) return;
            if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'mergeProps' && node.arguments[0]) {
                const argument = unwrap(node.arguments[0]);
                const symbol = checker.getSymbolAtLocation(argument);
                found = ts.isObjectLiteralExpression(argument) ? argument : declarations.find((declaration) => declaration === symbol?.valueDeclaration)?.initializer;
            }
            ts.forEachChild(node, visit);
        };
        if (component.valueDeclaration) visit(component.valueDeclaration);
        return found;
    },
    // Ref<T> is T or a callback taking T
    refTarget: (_, refType) => (refType.isUnion() ? refType.types.find((type) => !type.getCallSignatures().length) : refType),
};

export const extractApis = (sources: string[]) => extract(solid, sources);

export const generateApis = (check: boolean, pages: string[]) => generate(solid, 'solid', 'Solid', check, pages);

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    runCli(generateApis);
}
