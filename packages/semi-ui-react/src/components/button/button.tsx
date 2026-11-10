import { memo } from 'react';
import useDefaultProps from '../../base/use-default-props';
import BaseButton, { type ButtonProps as BaseButtonProps } from './base-button';
import { useInheritedButtonLooks, withGroupLooks } from './context';

export type { ButtonProps as BaseButtonProps, HorizontalPaddingType, HtmlType, Size, Theme, Type } from './base-button';

export type { ButtonGroupProps } from './button-group';

export type { SplitButtonGroupProps } from './split-button-group';

export interface ButtonProps extends BaseButtonProps {}

function Button(rawProps: ButtonProps) {
    const props = useDefaultProps('Button', withGroupLooks(rawProps, useInheritedButtonLooks()), {});

    return <BaseButton {...props} />;
}

// elementType lets ButtonGroup and Tooltip recognise the button
export default Object.assign(memo(Button), { elementType: 'Button' });
