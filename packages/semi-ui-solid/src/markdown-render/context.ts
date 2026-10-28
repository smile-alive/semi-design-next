import { createContext } from '../_base/create-context';

// an image inside a link must not open a preview: the link is the only control
export const [LinkContext, useLinkContext] = createContext<boolean>('MarkdownRender.a', { defaultValue: false });

// The image renders a div, invalid inside a p, so the paragraph around it renders a div. Solid cannot read a child's
// component, so the image reports itself while it is created, before the paragraph picks its tag.
export const [ParagraphContext, useParagraphContext] = createContext<{ markImage: () => void }>('MarkdownRender.p', { optional: true });

// CodeHighlight's div and pre are invalid inside a pre, so the pre around a highlighted block goes; reported the same way
export const [PreContext, usePreContext] = createContext<{ markHighlighted: () => void }>('MarkdownRender.pre', { optional: true });
