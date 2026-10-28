import type React from 'react';
import { focusableSelector } from '@fibrae/semi-foundation/steps/constants';
import { namedRole } from '../_base/named-role';

interface StepItemOptions {
    role?: React.AriaRole;
    onChange?: () => void;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

/** Click and keyboard behavior shared by step items; a step with a handler is a button */
export function useStepItem({ role, onChange, onClick, onKeyDown }: StepItemOptions, named: React.AriaAttributes) {
    const clickable = Boolean(onChange || onClick);
    return {
        clickable,
        role: role ?? (clickable ? 'button' : namedRole(named)),
        tabIndex: clickable ? 0 : undefined,
        onClick: (e: React.MouseEvent<HTMLDivElement>) => {
            onClick?.(e);
            // a click on a control inside title or description is that control's own, not a step switch
            if ((e.target as Element).closest(focusableSelector) === e.currentTarget) {
                onChange?.();
            }
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
            onKeyDown?.(e);
            // keys typed in a focusable child (e.g. an input in the title) must not switch the step
            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault(); // Space would scroll the page
                e.currentTarget.click();
            }
        },
    };
}
