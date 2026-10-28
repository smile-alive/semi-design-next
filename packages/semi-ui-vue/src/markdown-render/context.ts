import { createContext } from '../_base/create-context';

export const [provideMarkdownLinkContext, useMarkdownLinkContext] = createContext<true>('MarkdownRender.a', { optional: true });
