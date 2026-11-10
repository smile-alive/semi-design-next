import { children, createMemo, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/divider/constants';
import { toCssLength } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/divider/divider.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';
import { hasContent } from '../../utils/index';

const prefixCls = cssClasses.PREFIX;

export interface DividerProps extends ElementProps<'div'> {
    align?: 'left' | 'right' | 'center';
    margin?: number | string;
    dashed?: boolean;
    layout?: 'horizontal' | 'vertical';
}

const defaultProps = { layout: 'horizontal', align: 'center' } satisfies Partial<DividerProps>;

export default function Divider(rawProps: DividerProps) {
    const props = useDefaultProps('Divider', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['align', 'children', 'class', 'dashed', 'layout', 'margin', 'style']);

    // a vertical divider has no title, so its children are never created
    const content = children(() => (local.layout === 'horizontal' ? local.children : undefined));
    const nodes = createMemo(() => content.toArray().filter(hasContent));

    const hasText = () => nodes().length > 0;

    const isTextOnly = () => nodes().every((node) => typeof node === 'string' || typeof node === 'number');

    // the consumer's style comes last so it can override the margin
    const style = () => {
        const margin = local.margin;
        const own = local.style;
        if (margin === undefined) {
            return own;
        }
        const spacing = local.layout === 'vertical' ? { 'margin-left': toCssLength(margin), 'margin-right': toCssLength(margin) } : { 'margin-top': toCssLength(margin), 'margin-bottom': toCssLength(margin) };
        if (typeof own === 'string') {
            const declarations = Object.entries(spacing).map(([name, value]) => `${name}: ${value}`);
            return [...declarations, own].join('; ');
        }
        return { ...spacing, ...own } as JSX.CSSProperties;
    };

    return (
        // a separator's children are presentational, so a divider with text has no role
        <div
            aria-orientation={!hasText() && local.layout === 'vertical' ? 'vertical' : undefined}
            role={hasText() ? undefined : 'separator'}
            {...rest}
            class={clsx(prefixCls, local.class, {
                [`${prefixCls}-horizontal`]: local.layout === 'horizontal',
                [`${prefixCls}-vertical`]: local.layout === 'vertical',
                [`${prefixCls}-dashed`]: Boolean(local.dashed),
                [`${prefixCls}-with-text`]: hasText(),
                [`${prefixCls}-with-text-${local.align}`]: hasText(),
            })}
            style={style()}
        >
            <Show when={hasText()}>
                <Show when={isTextOnly()} fallback={nodes()}>
                    <span class={`${prefixCls}_inner-text`} x-semi-prop="children">
                        {nodes()}
                    </span>
                </Show>
            </Show>
        </div>
    );
}
