// Generates the Solid API tables (api/<component>.solid.<locale>.mdx) from component types and api.solid.json descriptions.
// Usage: node scripts/gen-solid-api.ts [--check] [<category>/<page>...]   (run in website/; without pages, every page)
// Output: one MDX fragment per component and locale, exit code 1 on --check when a fragment is stale or missing
import ts from 'typescript';
import { runCli } from './lib/api-table.ts';
import { type ComponentApi, type Framework, extractApis as extract, generateApis as generate, isCallTo, moduleVariable, moduleVariables, unwrap } from './lib/ts-api.ts';

export { renderApi, type ApiDescription } from './lib/ts-api.ts';
export type SolidApi = ComponentApi;

const solid: Framework = {
    // Native attributes come from solid-js's JSX types (through ElementProps) and native element members from the DOM lib
    native: /\/(solid-js|typescript\/lib)\//,
    // A default export passes the module-level `defaultProps` to useDefaultProps (an Object.assign wrapper hides the
    // call, so it is found by name); other components pass their defaults to mergeProps, as a module-level object or a
    // literal.
    defaults(checker, file, component, name) {
        const declarations = moduleVariables(file);
        const defaultProps = moduleVariable(file, 'defaultProps');
        if (name === 'default' && defaultProps) return defaultProps.initializer;
        let found: ts.Expression | undefined;
        const visit = (node: ts.Node) => {
            if (found) return;
            if (isCallTo(node, 'mergeProps') && node.arguments[0]) {
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

if (import.meta.main) {
    await runCli(generateApis);
}
