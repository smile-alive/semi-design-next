import { createContext } from '../../base/index';

// an image inside a link must not open a preview: the link is the only control
export const [LinkContext, useLinkContext] = createContext<boolean>('MarkdownRender.a', { defaultValue: false });
