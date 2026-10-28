import type React from 'react';

/** An explicit role wins; otherwise a generic div given a name becomes a group, since a div without a role cannot carry one */
export function namedRole(props: Pick<React.HTMLAttributes<HTMLElement>, 'role' | 'aria-label' | 'aria-labelledby'>): React.AriaRole | undefined {
    return props.role ?? (props['aria-label'] || props['aria-labelledby'] ? 'group' : undefined);
}
