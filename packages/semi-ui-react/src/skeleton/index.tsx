import type React from 'react';
import { type ReactNode, type CSSProperties, memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/skeleton/constants';
import '@fibrae/semi-foundation/skeleton/skeleton.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import { Avatar, Image, Title, Button, Paragraph } from './item';

export type { BasicProps, ParagraphProps, AvatarProps, GenericProps } from './item';

const prefixCls = cssClasses.PREFIX;

export interface SkeletonProps extends ElementProps<'div'> {
    active?: boolean;
    children?: ReactNode;
    className?: string;
    loading?: boolean;
    placeholder?: ReactNode;
    style?: CSSProperties;
    /** Attached to the placeholder root div while loading; unset once children are shown */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = { loading: true } satisfies Partial<SkeletonProps>;

function Skeleton(rawProps: SkeletonProps): ReactNode {
    const { ref, placeholder, active, children, className, loading, style, ...rest } = useDefaultProps('Skeleton', rawProps, defaultProps);

    if (!loading) {
        return children;
    }

    return (
        <div {...rest} ref={ref} className={clsx(prefixCls, { [`${prefixCls}-active`]: Boolean(active) }, className)} style={style} aria-busy="true" x-semi-prop="placeholder">
            {placeholder}
        </div>
    );
}

export default Object.assign(memo(Skeleton), { Avatar, Title, Button, Paragraph, Image });
