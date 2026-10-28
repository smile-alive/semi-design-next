import { splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import Button, { type ButtonProps } from '@fibrae/semi-ui-solid/button/index';
import getConfigureItem from './get-configure-item';

type ConfigureButtonProps = Omit<ButtonProps, 'value' | 'onChange' | 'onClick'> & {
    /** Whether the button is pressed */
    value?: boolean;
    onChange: (value: boolean) => void;
    onClick?: (value: boolean) => void;
};

function ConfigureButton(props: ConfigureButtonProps) {
    const [local, rest] = splitProps(props, ['value', 'onChange', 'class', 'onClick']);

    const handleClick = () => {
        const newValue = !local.value;
        local.onChange(newValue);
        local.onClick?.(newValue);
    };

    return (
        <Button
            type="tertiary"
            class={clsx(`${cssClasses.PREFIX}-footer-configure-button`, local.class, {
                [`${cssClasses.PREFIX}-footer-configure-button-active`]: local.value,
            })}
            aria-pressed={Boolean(local.value)}
            theme="outline"
            onClick={handleClick}
            {...rest}
        />
    );
}

export default getConfigureItem(ConfigureButton);
