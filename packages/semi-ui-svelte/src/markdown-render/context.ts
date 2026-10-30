import { createContext } from '../_base/create-context.js';

// an image inside a link must not open a preview: the link is the only control
export const [getMarkdownLinkContext, setMarkdownLinkContext] = createContext<true>('MarkdownRender.a', { optional: true });
