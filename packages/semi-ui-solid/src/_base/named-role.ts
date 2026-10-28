/**
 * An explicit role wins; otherwise a generic div given a name becomes a group, since a div without a role cannot carry
 * one. Takes the values, not props, so the caller's read stays in its own JSX expression and keeps tracking.
 */
export function namedRole(role?: string, ariaLabel?: string, ariaLabelledby?: string) {
    return role ?? (ariaLabel || ariaLabelledby ? 'group' : undefined);
}
