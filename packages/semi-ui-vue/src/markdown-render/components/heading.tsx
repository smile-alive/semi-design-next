/** @jsxImportSource vue */
import { defineComponent } from 'vue';
import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import { TypographyTitle } from '../../typography';

// Stateful rather than functional, so markdown attributes (such as rehype-slug ids) fall through to the title.
// JSX rather than a template because the heading level picks the component's `heading` prop per factory call.
const heading = (level: 1 | 2 | 3 | 4 | 5 | 6) =>
    defineComponent({
        name: `MarkdownRenderH${level}`,
        setup:
            (_, { slots }) =>
            () => (
                <TypographyTitle class={`${cssClasses.PREFIX}-component-header`} heading={level}>
                    {{ default: slots.default }}
                </TypographyTitle>
            ),
    });

export const h1 = heading(1);
export const h2 = heading(2);
export const h3 = heading(3);
export const h4 = heading(4);
export const h5 = heading(5);
export const h6 = heading(6);
