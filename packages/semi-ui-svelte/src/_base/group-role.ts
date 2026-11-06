import { namedRole } from '@fibrae/semi-foundation/utils/a11y';

/** attrs are not reactive, so call this while rendering */
export function groupRole(attrs: Record<string, unknown>) {
    return namedRole(attrs.role as string | undefined, attrs['aria-label'] as string | undefined, attrs['aria-labelledby'] as string | undefined);
}
