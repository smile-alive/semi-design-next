import type { JSX } from 'solid-js';
import clsx from 'clsx';
import type { Locale } from '@fibrae/semi-foundation/locale';
import Button from '../button';

interface FooterProps {
    class?: string;
    style?: JSX.CSSProperties | string;
    prefixCls: string;
    locale: Locale['DatePicker'];
    disabledConfirm?: boolean;
    onCancelClick?: () => void;
    onConfirmClick?: () => void;
}

export default function Footer(props: FooterProps) {
    return (
        <div class={clsx(`${props.prefixCls}-footer`, props.class)} style={props.style}>
            <Button theme="borderless" onClick={() => props.onCancelClick?.()}>
                {props.locale.footer.cancel}
            </Button>
            <Button disabled={props.disabledConfirm} theme="solid" onClick={() => props.onConfirmClick?.()}>
                {props.locale.footer.confirm}
            </Button>
        </div>
    );
}
