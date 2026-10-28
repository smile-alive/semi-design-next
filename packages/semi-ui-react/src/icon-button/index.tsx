import { memo } from 'react';
import useDefaultProps from '../_base/use-default-props';
import Button, { type ButtonProps } from '../button/button';
import { useButtonGroupLooks, withGroupLooks } from '../button/context';

export type { HorizontalPaddingType } from '../button/button';

export interface IconButtonProps extends ButtonProps {}

function IconButton(rawProps: IconButtonProps & { 'x-semi-children-alias'?: string }) {
    // same renderer as Button; its own global key keeps an icon Button from reading IconButton defaults
    const props = useDefaultProps('IconButton', withGroupLooks(rawProps, useButtonGroupLooks()), {});

    return <Button {...props} />;
}

// elementType lets Tooltip treat a loading IconButton specially
export default Object.assign(memo(IconButton), { elementType: 'IconButton' });
