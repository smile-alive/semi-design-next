import type React from 'react';
import { cloneElement, isValidElement } from 'react';
import clsx from 'clsx';
import { isSemiIcon } from '../_utils';

interface IconElementProps {
    size?: string;
    className?: string;
}

/**
 * A Semi icon takes the size of its slot unless it sets its own; other nodes get no `size`.
 */
export function fitNavIcon(node: React.ReactNode, size: string, className?: string) {
    if (!isValidElement<IconElementProps>(node)) {
        return node;
    }
    const props: IconElementProps = {};
    if (isSemiIcon(node) && !node.props.size) {
        props.size = size;
    }
    if (className !== undefined) {
        props.className = clsx(node.props.className, className);
    }
    return Object.keys(props).length ? cloneElement(node, props) : node;
}
