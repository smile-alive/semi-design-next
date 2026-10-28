import type { OxlintOverride } from 'vite-plus/lint';

// Shared by every framework whose files are JSX: jsx-a11y reads only element and attribute names
export const jsxA11yRules = {
    // A component's own autoFocus prop is its API
    'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
    // Same allowances as eslint-plugin-jsx-a11y's recommended config, e.g. ul/li as listbox/option
    'jsx-a11y/no-noninteractive-element-to-interactive-role': [
        'error',
        {
            ul: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
            ol: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
            li: ['menuitem', 'menuitemradio', 'menuitemcheckbox', 'option', 'row', 'tab', 'treeitem'],
            table: ['grid'],
            td: ['gridcell'],
            fieldset: ['radiogroup', 'presentation'],
        },
    ],
    // A named scrollable <section> takes tabIndex={0} (axe scrollable-region-focusable); the rule misses its role
    'jsx-a11y/no-noninteractive-tabindex': ['error', { tags: ['section'], roles: ['tabpanel'] }],
} satisfies NonNullable<OxlintOverride['rules']>;
