import { type ReactNode, Children, Fragment, cloneElement, isValidElement } from 'react';

/**
 * Children as a parent that collects child components sees them, like Vue's slotNodes: Children.toArray flattens
 * arrays and drops null and booleans but keeps a Fragment as one element, so Fragments are opened here. The
 * Fragment's key prefixes its children's keys, so siblings from different Fragments cannot collide.
 */
export default function flattenChildren(children: ReactNode): ReactNode[] {
    return Children.toArray(children).flatMap((node) => {
        if (!isValidElement<{ children?: ReactNode }>(node) || node.type !== Fragment) {
            return [node];
        }
        return flattenChildren(node.props.children).map((child) => (isValidElement(child) ? cloneElement(child, { key: `${node.key}:${child.key}` }) : child));
    });
}
