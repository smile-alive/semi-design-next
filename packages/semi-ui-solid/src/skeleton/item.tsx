import { Index, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/skeleton/constants';
import '@fibrae/semi-foundation/skeleton/skeleton.scss';
import type { ElementProps } from '../_base/element-props';

export interface BasicProps extends ElementProps<'div'> {
    prefixCls?: string;
    type?: string;
}

export interface ParagraphProps extends ElementProps<'ul'>, Pick<BasicProps, 'prefixCls'> {
    rows?: number;
}

export interface AvatarProps extends BasicProps {
    // the sizes skeleton.scss styles; Avatar's 'default' has none
    size?: 'extra-extra-small' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
    shape?: 'circle' | 'square';
}

export type GenericProps = AvatarProps;

function Generic(props: GenericProps) {
    const [local, rest] = splitProps(props, ['class', 'prefixCls', 'shape', 'size', 'type']);

    const prefixCls = () => local.prefixCls ?? cssClasses.PREFIX;

    const type = () => local.type as string;

    const avatar = () => type().toUpperCase() === 'AVATAR';

    return (
        <div
            aria-hidden="true"
            {...rest}
            class={clsx(local.class, `${prefixCls()}-${type()}`, {
                [`${prefixCls()}-${type()}-${local.size ?? 'medium'}`]: avatar(),
                [`${prefixCls()}-${type()}-${local.shape ?? 'circle'}`]: avatar(),
            })}
        />
    );
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

export function Paragraph(props: ParagraphProps) {
    const [local, rest] = splitProps(props, ['class', 'prefixCls', 'rows']);

    return (
        <ul aria-hidden="true" {...rest} class={clsx(local.class, `${local.prefixCls ?? cssClasses.PREFIX}-paragraph`)}>
            <Index each={Array.from({ length: local.rows ?? 4 })}>{() => <li />}</Index>
        </ul>
    );
}
