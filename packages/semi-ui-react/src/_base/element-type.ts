import { isValidElement } from 'react';

/**
 * Components mark themselves with a static elementType (Icon, Button, Tabs.TabPane) so a parent can recognize them
 * among its children. Property access, not `in`: the type of Fragment, Suspense and StrictMode is a symbol.
 */
export default function elementTypeOf(node: unknown): string | undefined {
    return isValidElement(node) ? (node.type as { elementType?: string }).elementType : undefined;
}
