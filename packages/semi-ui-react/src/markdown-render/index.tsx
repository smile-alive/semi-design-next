import type React from 'react';
import { useEffect, useState } from 'react';
import * as runtime from 'react/jsx-runtime';
import clsx from 'clsx';
import { omitBy } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import MarkdownRenderFoundation, { type MarkdownRenderAdapter, type MarkdownRenderBaseProps, type MarkdownRenderBaseState } from '@fibrae/semi-foundation/markdown-render/foundation';
import { isDev } from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/markdown-render/markdown-render.scss';
import type { ElementProps } from '../_base/base';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import * as SemiMarkdownComponents from './components';

// the index signature also admits tag names: without it an intrinsic key could not keep its own tag name, nor could
// a spread of this type be assigned back to it
export type MarkdownRenderComponents = Partial<{
    [K in keyof React.JSX.IntrinsicElements]: React.ComponentType<any> | K;
}> &
    Record<string, React.ComponentType<any> | keyof React.JSX.IntrinsicElements>;

// the compiled markdown is the root's only content, so children and raw HTML would clash with it
export interface MarkdownRenderProps extends MarkdownRenderBaseProps, ElementProps<'div', 'children' | 'dangerouslySetInnerHTML'> {
    components?: MarkdownRenderComponents;
    style?: React.CSSProperties;
    className?: string;
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

export interface MarkdownRenderState extends MarkdownRenderBaseState {}

const defaultProps = { format: 'mdx', remarkGfm: true } satisfies Partial<MarkdownRenderProps>;

// plugin arrays are usually literals: keep the previous array while the entries are the same
function usePluginList(plugins: MarkdownRenderProps['remarkPlugins']) {
    const [stable, setStable] = useState(plugins);
    if (!MarkdownRenderFoundation.isSamePluginList(stable, plugins)) {
        setStable(plugins);
        return plugins;
    }
    return stable;
}

function MarkdownRender(rawProps: MarkdownRenderProps) {
    const props = useDefaultProps('MarkdownRender', rawProps, defaultProps);
    const { ref, raw, components, format, remarkPlugins, rehypePlugins, remarkGfm, className, ...rest } = props;

    const [foundation, { renderContent }] = useFoundation<MarkdownRenderFoundation<MarkdownRenderProps, MarkdownRenderState>, MarkdownRenderAdapter<MarkdownRenderProps, MarkdownRenderState>, MarkdownRenderProps, MarkdownRenderState>(
        MarkdownRenderFoundation,
        props,
        // effects do not run on the server, so md is compiled here for the server HTML and the hydrating render
        () => ({ renderContent: MarkdownRenderFoundation.compileMdSync(props, runtime) }),
        () => ({
            getRuntime: () => runtime,
            notifyCompileError: (error) => {
                if (isDev()) {
                    console.error(error);
                }
            },
        })
    );

    const remarkPluginList = usePluginList(remarkPlugins);
    const rehypePluginList = usePluginList(rehypePlugins);

    // components apply at render; only what changes the compiled tree compiles again
    useEffect(() => {
        void foundation.updateContent();
    }, [foundation, raw, format, remarkGfm, remarkPluginList, rehypePluginList]);

    return (
        <div role={namedRole(rest)} {...rest} ref={ref} className={clsx(cssClasses.PREFIX, className)}>
            {/* called, not rendered as <Content />: each compile yields a new function, which would remount the
                subtree. Known limit: a `components.wrapper` still remounts the content on each compile. */}
            {/* an explicit undefined would replace the default, and the runtime takes it for an element type */}
            {renderContent && renderContent({ components: { ...SemiMarkdownComponents, ...omitBy(components ?? {}, (component) => component === undefined) } })}
        </div>
    );
}

export default Object.assign(MarkdownRender, { defaultComponents: SemiMarkdownComponents });
