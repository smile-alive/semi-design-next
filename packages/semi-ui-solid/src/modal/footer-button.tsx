import { type JSX, mergeProps, splitProps } from 'solid-js';
import callHandler from '../_base/call-handler';
import mergeStyles from '../_base/merge-styles';
import Button from '../button';
import type { ButtonProps } from '../button/button';

export interface ModalButtonProps extends ButtonProps {
    /** Selects the button the dialog focuses on opening, so it never reaches the DOM */
    autoFocus?: boolean;
}

export interface FooterButtonProps extends ButtonProps {
    /** The consumer's props, which win over the ones given here */
    own?: ModalButtonProps;
    /** Placed under the consumer's style */
    baseStyle?: JSX.CSSProperties;
    onPress: (event: MouseEvent) => void;
}

/** A default footer button of a dialog: the consumer's onClick runs before the dialog's own handler */
export default function FooterButton(props: FooterButtonProps) {
    const own = mergeProps(() => props.own ?? {});

    // the dialog decides the text (okText, finishText), as React's JSX children win over a spread `children`
    const [ownLocal, ownRest] = splitProps(own, ['autoFocus', 'children', 'onClick', 'style']);
    const [local, rest] = splitProps(props, ['own', 'baseStyle', 'onPress', 'style']);

    return (
        <Button
            {...rest}
            {...ownRest}
            style={mergeStyles(local.baseStyle, ownLocal.style)}
            onClick={(event) => {
                callHandler(ownLocal.onClick, event);
                local.onPress(event);
            }}
        />
    );
}
