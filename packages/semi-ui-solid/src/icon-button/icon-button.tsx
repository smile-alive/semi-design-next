import { type ButtonProps, renderButton } from '../button/button';

export interface IconButtonProps extends ButtonProps {}

// Same renderer as Button; its own global key keeps an icon Button from reading IconButton defaults
export default function IconButton(props: IconButtonProps) {
    return renderButton('IconButton', props);
}
