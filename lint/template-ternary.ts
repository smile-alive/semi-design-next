import type { Rule } from 'eslint';

type Expression = Rule.Node & { type: string };

// `x ? x : y` stays when `x` may run code or be re-evaluated differently; references read twice are the same value
function isPlainReference(node: Expression): boolean {
    if (node.type === 'Identifier' || node.type === 'ThisExpression') return true;
    if (node.type !== 'MemberExpression') return false;
    const { object, property, computed } = node as unknown as { object: Expression; property: Expression; computed: boolean };
    return isPlainReference(object) && (!computed || property.type === 'Literal');
}

const booleanOperators = new Set(['==', '===', '!=', '!==', '<', '>', '<=', '>=', 'in', 'instanceof']);
const isBoolean = (node: Expression) => (node.type === 'BinaryExpression' && booleanOperators.has((node as unknown as { operator: string }).operator)) || (node.type === 'UnaryExpression' && (node as unknown as { operator: string }).operator === '!');
const isAtom = (node: Expression) => ['Identifier', 'ThisExpression', 'Literal', 'MemberExpression', 'CallExpression', 'ChainExpression'].includes(node.type);
// Operands that would bind looser than `||`, or that `||` may not mix with without parentheses
const bindsLooserThanOr = (node: Expression) => ['ConditionalExpression', 'AssignmentExpression', 'SequenceExpression', 'ArrowFunctionExpression', 'YieldExpression'].includes(node.type) || (node.type === 'LogicalExpression' && (node as unknown as { operator: string }).operator === '??');

/**
 * Template counterpart of oxlint's unicorn/prefer-logical-operator-over-ternary and no-unneeded-ternary: eslint-plugin-oxlint
 * turns the ESLint copies off for whole .vue and .svelte files, and oxlint never parses template expressions
 */
export const templateTernary: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        docs: { description: 'Simplify ternaries in Vue and Svelte templates' },
        fixable: 'code',
        schema: [],
        messages: {
            logical: 'Use `||` instead of a ternary that repeats its condition',
            boolean: 'Use the condition instead of a ternary between boolean literals',
        },
    },
    create(context) {
        const { sourceCode } = context;
        const text = (node: Expression) => sourceCode.getText(node);
        const negated = (node: Expression) => `!${isAtom(node) ? text(node) : `(${text(node)})`}`;

        const check = (node: Expression) => {
            const { test, consequent, alternate } = node as unknown as Record<'test' | 'consequent' | 'alternate', Expression>;
            if (isPlainReference(test) && text(test) === text(consequent)) {
                const right = bindsLooserThanOr(alternate) ? `(${text(alternate)})` : text(alternate);
                context.report({ node, messageId: 'logical', fix: (fixer) => fixer.replaceText(node, `${text(test)} || ${right}`) });
                return;
            }
            const literal = (side: Expression) => (side.type === 'Literal' ? (side as unknown as { value: unknown }).value : undefined);
            const [whenTrue, whenFalse] = [literal(consequent), literal(alternate)];
            if (typeof whenTrue !== 'boolean' || typeof whenFalse !== 'boolean' || whenTrue === whenFalse) return;
            const replacement = whenTrue ? (isBoolean(test) ? text(test) : `!${negated(test)}`) : negated(test);
            context.report({ node, messageId: 'boolean', fix: (fixer) => fixer.replaceText(node, replacement) });
        };

        const { defineTemplateBodyVisitor } = sourceCode.parserServices as { defineTemplateBodyVisitor?: (visitor: Rule.RuleListener) => Rule.RuleListener };
        if (defineTemplateBodyVisitor) return defineTemplateBodyVisitor({ ConditionalExpression: check });

        // svelte-eslint-parser puts the markup and the <script> into one tree; oxlint already checks the script
        const scripts = (sourceCode.ast.body as unknown as { type: string; range?: [number, number] }[]).filter((node) => node.type === 'SvelteScriptElement').map(({ range }) => range ?? [0, 0]);
        const inScript = ({ range = [0, 0] }: Expression) => scripts.some(([start, end]) => start <= range[0] && range[1] <= end);
        return {
            ConditionalExpression(node) {
                if (!inScript(node)) check(node);
            },
        };
    },
};
