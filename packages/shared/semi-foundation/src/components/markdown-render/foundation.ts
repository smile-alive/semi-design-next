import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified, type PluggableList } from 'unified';
import { BaseFoundation, type DefaultAdapter } from '../../base/index';
import { isDev } from '../../utils/index';

export interface MarkdownRenderAdapter<P extends MarkdownRenderBaseProps = MarkdownRenderBaseProps> extends DefaultAdapter<P, MarkdownRenderBaseState> {
    /** `Fragment`, `jsx` and `jsxs` of the automatic JSX runtime */
    getRuntime: () => any;
}

/**
 * Element renderers by tag name. Not `mdx/types`: it names the global JSX namespace that React 19 no longer declares,
 * which breaks type checking of published declarations. The values are framework components this package cannot name.
 */
export type MarkdownComponents = Record<string, any>;

export type MarkdownContent = (props: { components?: MarkdownComponents }) => any;

export interface MarkdownRenderBaseProps {
    raw: string;
    components?: MarkdownComponents;
    format?: 'md' | 'mdx';
    remarkPlugins?: PluggableList;
    rehypePlugins?: PluggableList;
    remarkGfm?: boolean;
}

export interface MarkdownRenderBaseState {
    /** Called during render, never used as an element type: a new type per compile would remount the whole subtree */
    renderContent: MarkdownContent | null;
}

type PluginProps = Pick<MarkdownRenderBaseProps, 'format' | 'remarkPlugins' | 'rehypePlugins' | 'remarkGfm'>;

export default class MarkdownRenderFoundation<P extends MarkdownRenderBaseProps = MarkdownRenderBaseProps> extends BaseFoundation<MarkdownRenderAdapter<P>, P, MarkdownRenderBaseState> {
    #requestId = 0;
    static override readonly propKeys = ['raw', 'format', 'remarkGfm', 'remarkPlugins', 'rehypePlugins'];
    // an inline plugin array is new on every render, so compare entries
    static override readonly propEquals = {
        remarkPlugins: MarkdownRenderFoundation.isSamePluginList,
        rehypePlugins: MarkdownRenderFoundation.isSamePluginList,
    };

    static #getPlugins(props: PluginProps) {
        const remarkPlugins = props.remarkPlugins ?? [];
        return {
            remarkPlugins: props.remarkGfm ? [remarkGfm, ...remarkPlugins] : remarkPlugins,
            rehypePlugins: props.rehypePlugins ?? [],
        };
    }

    static #createMdProcessor(props: PluginProps) {
        const { remarkPlugins, rehypePlugins } = MarkdownRenderFoundation.#getPlugins(props);
        // no code is generated or evaluated, so it renders under a CSP without `unsafe-eval`
        return (
            unified()
                .use(remarkParse)
                .use(remarkPlugins)
                // keeps raw HTML as `raw` nodes for plugins such as rehype-raw; toJsxRuntime drops those left over
                .use(remarkRehype, { allowDangerousHtml: true })
                .use(rehypePlugins)
        );
    }

    static #toMdContent(tree: Parameters<typeof toJsxRuntime>[0], runtime: any): MarkdownContent {
        return ({ components }) =>
            // an unparsable style (only from raw HTML) is dropped rather than thrown while rendering
            toJsxRuntime(tree, { ...runtime, components, ignoreInvalidStyle: true });
    }

    protected async evaluate(raw: string): Promise<MarkdownContent> {
        const props = {
            format: this.getProp('format'),
            remarkPlugins: this.getProp('remarkPlugins'),
            rehypePlugins: this.getProp('rehypePlugins'),
            remarkGfm: this.getProp('remarkGfm'),
        };
        const runtime = this.adapter.getRuntime();
        if (props.format === 'md') {
            const processor = MarkdownRenderFoundation.#createMdProcessor(props);
            const tree = (await processor.run(processor.parse(raw), raw)) as Parameters<typeof toJsxRuntime>[0];
            return MarkdownRenderFoundation.#toMdContent(tree, runtime);
        }
        const { remarkPlugins, rehypePlugins } = MarkdownRenderFoundation.#getPlugins(props);
        // loaded only for mdx, which runs compiled code through the Function constructor (CSP unsafe-eval)
        const { evaluate } = await import('@mdx-js/mdx');
        return (await evaluate(raw, { remarkPlugins, rehypePlugins, format: 'mdx', ...runtime })).default;
    }

    /** md compiles synchronously, so the server HTML and the first client render already hold the content */
    static getInitialState(props: Pick<MarkdownRenderBaseProps, 'raw' | 'format' | 'remarkPlugins' | 'rehypePlugins' | 'remarkGfm'>, runtime: any): MarkdownRenderBaseState {
        return { renderContent: MarkdownRenderFoundation.compileMdSync(props, runtime) };
    }

    /**
     * Compiles `md` synchronously for the first render, so server output and hydration start with the content.
     * Returns null for `mdx` (dynamic import and the Function constructor keep it async) and when compiling throws.
     * shortcut: a source that needs an async plugin has no content on the first render and its error is only
     * reported by the async compile after mount, upgrade by letting the framework await the async compile on the server.
     */
    static compileMdSync(props: Pick<MarkdownRenderBaseProps, 'raw' | 'format' | 'remarkPlugins' | 'rehypePlugins' | 'remarkGfm'>, runtime: any): MarkdownContent | null {
        if (props.format !== 'md') {
            return null;
        }
        try {
            const processor = MarkdownRenderFoundation.#createMdProcessor(props);
            let tree: Parameters<typeof toJsxRuntime>[0] | undefined;
            // not runSync: it bails on a later rejection of an async plugin, which surfaces as an unhandled rejection
            processor.run(processor.parse(props.raw), props.raw, (error, node) => {
                tree = error ? undefined : (node as Parameters<typeof toJsxRuntime>[0]);
            });
            return tree ? MarkdownRenderFoundation.#toMdContent(tree, runtime) : null;
        } catch {
            return null;
        }
    }

    /** The `language-*` id of a fenced code block's class list; ids may contain hyphens (`objective-c`) */
    static getCodeLanguage(className?: string) {
        return /(?:^|\s)language-(\S+)/.exec(className ?? '')?.[1];
    }

    /** Plugin lists match when each entry, or each item of a `[plugin, options]` entry, is the same reference */
    static isSamePluginList(a?: PluggableList, b?: PluggableList) {
        if (a === b) {
            return true;
        }
        if (!a || !b || a.length !== b.length) {
            return false;
        }
        return a.every((entry, i) => {
            const other = b[i];
            if (entry === other) {
                return true;
            }
            return Array.isArray(entry) && Array.isArray(other) && entry.length === other.length && entry.every((item, j) => item === other[j]);
        });
    }

    // mdx, and md that compileMdSync could not finish, compile after mount; destroy drops a compile still in flight,
    // so init starts it again
    override init() {
        if (!this.getState('renderContent')) {
            void this.updateContent();
        }
    }

    override destroy() {
        this.#requestId++;
    }

    override handlePropsChange() {
        void this.updateContent();
    }

    /** A failed compile keeps the last content and is logged in development */
    updateContent = async () => {
        const requestId = ++this.#requestId;
        try {
            const renderContent = await this.evaluate(this.getProp('raw'));
            if (requestId === this.#requestId) {
                this.setState({ renderContent });
            }
        } catch (error) {
            if (requestId === this.#requestId) {
                if (isDev()) {
                    console.error(error);
                }
            }
        }
    };
}
