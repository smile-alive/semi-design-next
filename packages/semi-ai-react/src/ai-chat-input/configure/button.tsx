import { useCallback } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import Button, { type ButtonProps } from '@fibrae/semi-ui-react/button/index';
import getConfigureItem from './get-configure-item';

type ConfigureButtonProps = Omit<ButtonProps, 'value' | 'onChange' | 'onClick'> & {
    /** Whether the button is pressed */
    value?: boolean;
    onChange: (value: boolean) => void;
    onClick?: (value: boolean) => void;
};

function ConfigureButton({ value, onChange, className, onClick, ...rest }: ConfigureButtonProps) {
    const onButtonClick = useCallback(() => {
        const newValue = !value;
        onChange(newValue);
        onClick?.(newValue);
    }, [value, onChange, onClick]);

    return (
        <Button
            type="tertiary"
            className={clsx(`${cssClasses.PREFIX}-footer-configure-button`, {
                [className]: className,
                [`${cssClasses.PREFIX}-footer-configure-button-active`]: value,
            })}
            aria-pressed={Boolean(value)}
            theme="outline"
            onClick={onButtonClick}
            {...rest}
        />
    );
}

export default getConfigureItem(ConfigureButton);
