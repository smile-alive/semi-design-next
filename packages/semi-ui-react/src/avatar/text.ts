import type React from 'react';
import { Children } from 'react';
import { isText } from '../_utils';

export function getAvatarText(children: React.ReactNode): string | undefined {
    const nodes = Children.toArray(children);
    return nodes.length > 0 && nodes.every(isText) ? nodes.join('') : undefined;
}
