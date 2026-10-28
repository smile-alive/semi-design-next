import { type Component, createEffect, createMemo, For, type JSX, on, splitProps } from 'solid-js';
import clsx from 'clsx';
import { omitBy } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import MarkdownRenderFoundation, { type MarkdownRenderAdapter, type MarkdownRenderBaseProps, type MarkdownRenderBaseState } from '@fibrae/semi-foundation/markdown-render/foundation';
import { isDev } from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/markdown-render/markdown-render.scss';
import type { ElementProps } from '../_base/element-props';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import * as defaultComponents from './components';
import runtime, { Fragment, isMarkdownElement, markdownNodeKey, renderMarkdownNode } from './runtime';

// the index signature also admits tag names: without it an intrinsic key could not keep its own tag name, nor could
// a spread of this type be assigned back to it
export type MarkdownRenderComponents = Partial<{ [K in keyof JSX.IntrinsicElements]: Component<any> | K }> & Record<string, Component<any> | keyof JSX.IntrinsicElements | undefined>;

// the compiled markdown is the root's only content, so children and raw content would clash with it
export interface MarkdownRenderProps extends MarkdownRenderBaseProps, ElementProps<'div', 'children' | 'innerHTML' | 'textContent' | 'innerText'> {
    /** Merged over `MarkdownRender.defaultComponents`; a change renders again without compiling again */
    components?: MarkdownRenderComponents;
}

type Foundation = MarkdownRenderFoundation<MarkdownRenderProps>;
type Adapter = MarkdownRenderAdapter<MarkdownRenderProps>;

interface Block {
    key: string | undefined;
    node: unknown;
}

const defaultProps = { format: 'mdx', remarkGfm: true } satisfies Partial<MarkdownRenderProps>;

function topLevelNodes(content: unknown) {
    return isMarkdownElement(content) && content.type === Fragment ? [content.props.children].flat() : [content];
}

function MarkdownRender(rawProps: MarkdownRenderProps) {
    const props = useDefaultProps('MarkdownRender', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['raw', 'components', 'format', 'remarkPlugins', 'rehypePlugins', 'remarkGfm', 'class']);

    const { foundation, state } = useFoundation<Foundation, Adapter, MarkdownRenderProps, MarkdownRenderBaseState>(
        MarkdownRenderFoundation,
        props,
        // compiled during render so the server output and the first client render both start with the content
        (p) => ({ renderContent: MarkdownRenderFoundation.compileMdSync(p, runtime) }),
        () => ({
            getRuntime: () => runtime,
            notifyCompileError: (error) => {
                if (isDev()) {
                    console.error(error);
                }
            },
        })
    );

    // an explicit undefined would replace a default, and the runtime takes it for an element type
    const components = createMemo(() => ({ ...defaultComponents, ...omitBy(local.components ?? {}, (component) => component === undefined) }));

    // only what changes the compiled tree compiles again; plugin arrays are usually literals, so entries are compared
    const source = createMemo(() => ({ raw: local.raw, format: local.format, remarkGfm: local.remarkGfm, remarkPlugins: local.remarkPlugins, rehypePlugins: local.rehypePlugins }), undefined, {
        equals: (a, b) => a.raw === b.raw && a.format === b.format && a.remarkGfm === b.remarkGfm && MarkdownRenderFoundation.isSamePluginList(a.remarkPlugins, b.remarkPlugins) && MarkdownRenderFoundation.isSamePluginList(a.rehypePlugins, b.rehypePlugins),
    });

    // Each compile or components change yields new elements throughout. A top-level block equal to one of the last
    // render keeps its block, and For keeps its DOM, so streamed content re-creates only the blocks that changed.
    // Known limit: a `components.wrapper` is one block, so its content is re-created on each compile.
    const blocks = createMemo<Block[]>((previous) => {
        const renderContent = state().renderContent;
        if (!renderContent) {
            return [];
        }
        const reusable = new Map<string, Block[]>();
        for (const block of previous) {
            if (block.key !== undefined) {
                reusable.set(block.key, [...(reusable.get(block.key) ?? []), block]);
            }
        }
        return topLevelNodes(renderContent({ components: components() })).map((node) => {
            const key = markdownNodeKey(node);
            return (key === undefined ? undefined : reusable.get(key)?.shift()) ?? { key, node };
        });
    }, []);

    createEffect(on(source, () => void foundation.updateContent()));

    return (
        <div {...rest} role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as JSX.HTMLAttributes<HTMLDivElement>['role']} class={clsx(cssClasses.PREFIX, local.class)}>
            {/* called here, not returned: the insert would call a returned element again on every change of the list */}
            <For each={blocks()}>{(block) => renderMarkdownNode(block.node)}</For>
        </div>
    );
}

export default Object.assign(MarkdownRender, { defaultComponents });
