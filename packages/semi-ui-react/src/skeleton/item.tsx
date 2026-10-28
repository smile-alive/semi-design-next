import type React from 'react';
import { type CSSProperties, memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/skeleton/constants';
import '@fibrae/semi-foundation/skeleton/skeleton.scss';
import type { ElementProps } from '../_base/base';

export interface BasicProps extends ElementProps<'div'> {
    prefixCls?: string;
    className?: string;
    style?: CSSProperties;
    type?: string;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export interface ParagraphProps extends ElementProps<'ul'>, Pick<BasicProps, 'prefixCls'> {
    rows?: number;
    /** Attached to the root ul */
    ref?: React.Ref<HTMLUListElement>;
}

export interface AvatarProps extends BasicProps {
    // the sizes skeleton.scss styles; Avatar's 'default' has none
    size?: 'extra-extra-small' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
    shape?: 'circle' | 'square';
}

export type GenericProps = AvatarProps;

function Generic({ prefixCls = cssClasses.PREFIX, className, type, size = 'medium', shape = 'circle', ...others }: GenericProps) {
    const avatar = type.toUpperCase() === 'AVATAR';

    const classString = clsx(className, `${prefixCls}-${type}`, {
        [`${prefixCls}-${type}-${size}`]: avatar,
        [`${prefixCls}-${type}-${shape}`]: avatar,
    });

    return <div aria-hidden="true" {...others} className={classString} />;
}

// a type passed by the user replaces the kit's own, but an explicit undefined must not erase it
export function Avatar(props: AvatarProps) {
    return <Generic {...props} type={props.type ?? 'avatar'} />;
}

export function Image(props: BasicProps) {
    return <Generic {...props} type={props.type ?? 'image'} />;
}

export function Title(props: BasicProps) {
    return <Generic {...props} type={props.type ?? 'title'} />;
}

export function Button(props: BasicProps) {
    return <Generic {...props} type={props.type ?? 'button'} />;
}

export const Paragraph = memo(function Paragraph({ prefixCls = cssClasses.PREFIX, className, rows = 4, ...rest }: ParagraphProps) {
    return (
        <ul aria-hidden="true" {...rest} className={clsx(className, `${prefixCls}-paragraph`)}>
            {Array.from({ length: rows }, (_, i) => (
                <li key={i} />
            ))}
        </ul>
    );
});
