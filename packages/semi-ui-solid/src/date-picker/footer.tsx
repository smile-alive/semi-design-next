import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import Button from '../button';

interface FooterProps {
    prefixCls: string;
    locale: Locale['DatePicker'];
    disabledConfirm?: boolean;
    onCancelClick?: () => void;
    onConfirmClick?: () => void;
}

/** The cancel and confirm buttons of a panel that needs confirmation */
export default function Footer(props: FooterProps) {
    return (
        <div class={`${props.prefixCls}-footer`}>
            <Button theme="borderless" onClick={() => props.onCancelClick?.()}>
                {props.locale.footer.cancel}
            </Button>
            <Button disabled={props.disabledConfirm} theme="solid" onClick={() => props.onConfirmClick?.()}>
                {props.locale.footer.confirm}
            </Button>
        </div>
    );
}
