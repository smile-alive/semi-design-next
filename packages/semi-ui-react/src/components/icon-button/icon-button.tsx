import { memo } from 'react';
import { useDefaultProps } from '../../base/index';
import BaseButton, { type ButtonProps } from '../button/base-button';
import { useInheritedButtonLooks, withGroupLooks } from '../button/context';

export type { HorizontalPaddingType } from '../button/base-button';

export interface IconButtonProps extends ButtonProps {}

function IconButton(rawProps: IconButtonProps & { 'x-semi-children-alias'?: string }) {
    // same renderer as Button; its own global key keeps an icon Button from reading IconButton defaults
    const props = useDefaultProps('IconButton', withGroupLooks(rawProps, useInheritedButtonLooks()), {});

    return <BaseButton {...props} />;
}

// elementType lets Tooltip treat a loading IconButton specially
export default Object.assign(memo(IconButton), { elementType: 'IconButton' });
