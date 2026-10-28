import type { JSX } from 'solid-js';
import { focusableSelector } from '@fibrae/semi-foundation/steps/constants';
import callHandler from '../_base/call-handler';
import { namedRole } from '../_base/named-role';

// namedRole yields a plain string, which the typed role attribute does not accept
export type Role = JSX.HTMLAttributes<HTMLDivElement>['role'];

interface StepItemProps {
    role?: Role;
    onChange?: () => void;
    onClick?: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>;
    onKeyDown?: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent>;
}

interface StepItemNames {
    'aria-label'?: string;
    'aria-labelledby'?: string;
}

/** Click and keyboard behavior shared by step items; a step with a handler is a button */
export function createStepItem(local: StepItemProps, named: StepItemNames) {
    const clickable = () => Boolean(local.onChange || local.onClick);
    return {
        clickable,
        role: (): Role => local.role ?? (clickable() ? 'button' : (namedRole(undefined, named['aria-label'], named['aria-labelledby']) as Role)),
        tabIndex: () => (clickable() ? 0 : undefined),
        onClick: (event: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
            callHandler(local.onClick, event);
            // a click on a control inside title or description is that control's own, not a step switch
            if (event.target.closest(focusableSelector) === event.currentTarget) {
                local.onChange?.();
            }
        },
        onKeyDown: (event: KeyboardEvent & { currentTarget: HTMLDivElement; target: Element }) => {
            callHandler(local.onKeyDown, event);
            // keys typed in a focusable child (e.g. an input in the title) must not switch the step
            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault(); // Space would scroll the page
                event.currentTarget.click();
            }
        },
    };
}
