import { type Component, createMemo, For, type JSX, splitProps } from 'solid-js';
import clsx from 'clsx';
import { omitBy } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/components/markdown-render/constants';
import MarkdownRenderFoundation, { type MarkdownRenderAdapter, type MarkdownRenderBaseProps, type MarkdownRenderBaseState } from '@fibrae/semi-foundation/components/markdown-render/foundation';
import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/components/markdown-render/markdown-render.scss';
import type { ElementProps } from '../../base/element-props';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
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
    key?: string;
    node: unknown;
}

const defaultProps = { format: 'mdx', remarkGfm: true } satisfies Partial<MarkdownRenderProps>;

function topLevelNodes(content: unknown) {
    return isMarkdownElement(content) && content.type === Fragment ? [content.props.children].flat() : [content];
}

function MarkdownRender(rawProps: MarkdownRenderProps) {
    const props = useDefaultProps('MarkdownRender', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['raw', 'components', 'format', 'remarkPlugins', 'rehypePlugins', 'remarkGfm', 'class']);

    const { state } = useFoundation<Foundation, Adapter, MarkdownRenderProps, MarkdownRenderBaseState>(
        MarkdownRenderFoundation,
        props,
        (p) => MarkdownRenderFoundation.getInitialState(p, runtime),
        () => ({ getRuntime: () => runtime })
    );

    // an explicit undefined would replace a default, and the runtime takes it for an element type
    const components = createMemo(() => ({ ...defaultComponents, ...omitBy(local.components ?? {}, (component) => component === undefined) }));

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

    return (
        <div {...rest} role={namedRole(rest)} class={clsx(cssClasses.PREFIX, local.class)}>
            {/* called here, not returned: the insert would call a returned element again on every change of the list */}
            <For each={blocks()}>{(block) => renderMarkdownNode(block.node)}</For>
        </div>
    );
}

export default Object.assign(MarkdownRender, { defaultComponents });
