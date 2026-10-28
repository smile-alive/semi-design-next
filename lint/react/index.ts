import { frameworkFiles, frameworkSpecifiers, type FrameworkLint } from '../framework.ts';
import { jsxA11yRules } from '../jsx-a11y.ts';
import { reactComponentOrder } from './component-order.ts';
import { reactExemptions, reactIconOnClickExemptions } from './exemptions.ts';

const files = frameworkFiles('react');

export const react: FrameworkLint = {
    name: 'React',
    files,
    // preact stands in for React via preact/compat; only the motion and tiptap bindings are React's
    imports: ['react', 'react-dom', 'react-is', '@types/react*', 'preact', 'motion/react', '@tiptap/react', '@testing-library/react', '@test/utils/react', '@tanstack/react-virtual', 'react-infinite-scroller', '@fibrae/semi-*-react', ...frameworkSpecifiers('react')],
    packages: ['semi-ui-react', 'semi-ai-react', 'semi-icons-react', 'semi-illustrations-react'],
    overrides: [
        {
            files,
            plugins: ['react', 'jsx-a11y'],
            jsPlugins: ['eslint-plugin-perfectionist'],
            rules: {
                'react/rules-of-hooks': 'error',
                'react/jsx-no-comment-textnodes': 'error',
                'react/jsx-no-target-blank': 'error',
                'react/no-unescaped-entities': 'error',
                'react/no-unknown-property': [
                    'error',
                    {
                        // Semi's own x-* attributes carry state for its stylesheets and tests
                        ignore: ['x-semi-prop', 'x-placement', 'x-type', 'x-label-pos', 'x-prompt-pos', 'x-field-id', 'x-extra-pos', 'x-open-type', 'x-panel-yearandmonth-open-type', 'x-insetinput', 'x-preset-position', 'x-form-id'],
                    },
                ],
                'react/require-render-return': 'error',
                'react/self-closing-comp': ['error', { component: true, html: true }],
                'react/jsx-boolean-value': ['error', 'never'],
                'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never', propElementValues: 'always' }],
                // Consumers run this through React Compiler: a suppressed hooks rule makes it skip the whole function
                'react/rule-suppression': 'error',
                'react/invariant': 'error',
                ...jsxA11yRules,
            },
        },
        {
            files: ['packages/{semi-ui-react,semi-ai-react}/**/*.tsx'],
            jsPlugins: ['eslint-plugin-perfectionist'],
            rules: {
                'perfectionist/sort-jsx-props': [
                    'error',
                    {
                        type: 'alphabetical',
                        order: 'asc',
                        ignoreCase: true,
                        groups: [
                            'react-reserved', // key, ref
                            'identity', // id, name
                            'element-type', // as, type, htmlFor
                            'class-name',
                            'style',
                            'data',
                            'a11y', // role, aria-*, tabIndex, title and the like
                            'form-state', // value, checked, disabled and the like
                            'unknown', // everything else, alphabetical
                            'render', // render*, *Render and node props such as icon
                            'react-special', // children, dangerouslySetInnerHTML, suppress*Warning
                            'callback', // on*, handle*
                        ],
                        customGroups: [
                            { groupName: 'react-reserved', elementNamePattern: '^(key|ref)$' },
                            { groupName: 'identity', elementNamePattern: '^(id|name)$' },
                            { groupName: 'element-type', elementNamePattern: '^(as|component|type|htmlFor)$' },
                            {
                                groupName: 'class-name',
                                // multi-word prefixes such as lineNumberClassName and Resizable's handleWrapperClass
                                elementNamePattern: '^(className|classNames|[a-z][a-zA-Z]*(ClassName|Class))$',
                            },
                            // matched before callback, so handleStyle and handleWrapperStyle are not handlers
                            { groupName: 'style', elementNamePattern: '^(style|styles|[a-z][a-zA-Z]*Style)$' },
                            { groupName: 'data', elementNamePattern: '^data-' },
                            {
                                groupName: 'a11y',
                                elementNamePattern: ['^role$', '^aria-', '^tabIndex$', '^title$', '^alt$', '^lang$', '^dir$', '^hidden$', '^inert$', '^autoFocus$', '^accessKey$'],
                            },
                            {
                                groupName: 'form-state',
                                elementNamePattern: ['^(value|defaultValue)$', '^(checked|defaultChecked)$', '^(disabled|readOnly|required|multiple)$', '^(placeholder|autoComplete|form|min|max|step|pattern|maxLength|minLength)$'],
                            },
                            {
                                groupName: 'render',
                                elementNamePattern: ['^render[A-Z]', '[a-z]Render$', '^(icon|prefix|suffix|extra)$'],
                            },
                            {
                                groupName: 'react-special',
                                elementNamePattern: ['^children$', '^dangerouslySetInnerHTML$', '^suppressHydrationWarning$', '^suppressContentEditableWarning$'],
                            },
                            { groupName: 'callback', elementNamePattern: ['^on[A-Z]', '^handle[A-Z]'] },
                        ],
                    },
                ],
            },
        },
        {
            files: ['packages/semi-ai-react/**', 'packages/semi-ui-react/**'],
            plugins: ['react'],
            rules: {
                // Syntax React Compiler cannot handle (`??=`, object getters, JSX in parameter defaults) skips silently
                'react/todo': 'error',
            },
        },
    ],
    exemptions: reactExemptions,
    componentOrder: reactComponentOrder,
    iconOnClickExemptions: reactIconOnClickExemptions,
};
