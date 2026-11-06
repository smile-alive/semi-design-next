import type React from 'react';
import { namedRole as namedRoleOf } from '@fibrae/semi-foundation/utils/a11y';

export function namedRole(props: Pick<React.HTMLAttributes<HTMLElement>, 'role' | 'aria-label' | 'aria-labelledby'>): React.AriaRole | undefined {
    return namedRoleOf(props.role, props['aria-label'], props['aria-labelledby']);
}
