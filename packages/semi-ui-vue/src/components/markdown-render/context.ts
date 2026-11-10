import { createContext } from '../../base/index';

export const [provideMarkdownLinkContext, useMarkdownLinkContext] = createContext<true>('MarkdownRender.a', { optional: true });
