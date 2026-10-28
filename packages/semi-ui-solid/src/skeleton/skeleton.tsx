import { type JSX, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/skeleton/constants';
import '@fibrae/semi-foundation/skeleton/skeleton.scss';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';
import { Avatar, Button, Image, Paragraph, Title } from './item';

const prefixCls = cssClasses.PREFIX;

export interface SkeletonProps extends ElementProps<'div'> {
    active?: boolean;
    loading?: boolean;
    placeholder?: JSX.Element;
}

const defaultProps = { loading: true } satisfies Partial<SkeletonProps>;

function Skeleton(rawProps: SkeletonProps) {
    const props = useDefaultProps('Skeleton', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['active', 'children', 'class', 'loading', 'placeholder']);

    return (
        <Show when={local.loading} fallback={local.children}>
            <div {...rest} class={clsx(prefixCls, { [`${prefixCls}-active`]: Boolean(local.active) }, local.class)} aria-busy="true" x-semi-prop="placeholder">
                {local.placeholder}
            </div>
        </Show>
    );
}

export default Object.assign(Skeleton, { Avatar, Title, Button, Paragraph, Image });
