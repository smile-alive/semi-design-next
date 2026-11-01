import type { OxlintOverride } from 'vite-plus/lint';

// JSX attribute order for semi-ui-react; the landing page's code samples follow it in every JSX framework
export const jsxPropsOrderRules = {
    'perfectionist/sort-jsx-props': [
        'error',
        {
            type: 'alphabetical',
            order: 'asc',
            ignoreCase: true,
            groups: ['react-reserved', 'identity', 'element-type', 'class-name', 'style', 'data', 'a11y', 'form-state', 'unknown', 'render', 'react-special', 'callback'],
            customGroups: [
                { groupName: 'react-reserved', elementNamePattern: '^(key|ref)$' },
                { groupName: 'identity', elementNamePattern: '^(id|name)$' },
                { groupName: 'element-type', elementNamePattern: '^(as|component|type|htmlFor)$' },
                {
                    groupName: 'class-name',
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
} satisfies NonNullable<OxlintOverride['rules']>;

export const landingSamples = 'website/src/components/landing/samples';
