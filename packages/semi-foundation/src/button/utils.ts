import type { Size } from '../utils/type';
import { cssClasses } from './constants';

export type ButtonTheme = 'solid' | 'borderless' | 'light' | 'outline';
export type ButtonType = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
export type PaddingSide = 'left' | 'right';

export interface ButtonLooks {
    disabled: boolean;
    size: Size;
    type: ButtonType;
    theme: ButtonTheme;
    colorful: boolean;
}

/** The group props are defaults for its buttons: an own value wins, undefined counts as not passed */
export function inheritGroupLooks(own: Partial<ButtonLooks>, group?: Partial<ButtonLooks>): Partial<ButtonLooks> {
    return {
        disabled: own.disabled ?? group?.disabled,
        size: own.size ?? group?.size,
        type: own.type ?? group?.type,
        theme: own.theme ?? group?.theme,
        colorful: own.colorful ?? group?.colorful,
    };
}

/** Own value -> group value -> global default -> built-in default */
export function resolveButtonLooks(own: Partial<ButtonLooks>, group: Partial<ButtonLooks> | undefined, global: Partial<ButtonLooks>): ButtonLooks {
    const inherited = inheritGroupLooks(own, group);
    return {
        disabled: inherited.disabled ?? global.disabled ?? false,
        size: inherited.size ?? global.size ?? 'default',
        type: inherited.type ?? global.type ?? 'primary',
        theme: inherited.theme ?? global.theme ?? 'light',
        colorful: inherited.colorful ?? global.colorful ?? false,
    };
}

/** The separator between two grouped buttons follows the left button's looks; an outline button has none */
export function groupLineClass(prefix: string, { theme, type, disabled }: Pick<ButtonLooks, 'theme' | 'type' | 'disabled'>): string | undefined {
    if (theme === 'outline') {
        return undefined;
    }
    const line = `${prefix}-group-line`;
    return [line, `${line}-${theme}`, `${line}-${type}`, disabled && `${line}-disabled`].filter(Boolean).join(' ');
}

export function buttonClassList(prefix: string, { theme, type, size, disabled, colorful }: ButtonLooks, state: { block: boolean; withIcon: boolean; iconOnly: boolean; loading: boolean }) {
    const flags: [boolean, string][] = [
        [!disabled, `${prefix}-${type}`],
        [disabled, `${prefix}-disabled`],
        [disabled, `${prefix}-${type}-disabled`],
        [size === 'large', `${prefix}-size-large`],
        [size === 'small', `${prefix}-size-small`],
        [state.block, `${prefix}-block`],
        [colorful, `${prefix}-colorful`],
        [state.withIcon, `${prefix}-with-icon`],
        [state.iconOnly, `${prefix}-with-icon-only`],
        [state.loading, `${prefix}-loading`],
    ];
    return [prefix, `${prefix}-${theme}`, ...flags.filter(([on]) => on).map(([, name]) => name)];
}

export function paddingSides(noHorizontalPadding?: boolean | PaddingSide | PaddingSide[]): PaddingSide[] {
    if (noHorizontalPadding === true) {
        return ['left', 'right'];
    }
    if (Array.isArray(noHorizontalPadding)) {
        return noHorizontalPadding;
    }
    return noHorizontalPadding ? [noHorizontalPadding] : [];
}

export function isAILoading(theme: ButtonTheme, type: ButtonType, colorful: boolean) {
    return (colorful && ['light', 'outline', 'borderless'].includes(theme)) || (theme === 'solid' && type === 'tertiary');
}

// The --semi-button-colorful-* variables are read-only with defaults in the var() fallback: a component that
// declares its own variable would beat any value inherited from body or an ancestor.
export function colorfulFill(theme: ButtonTheme, type: ButtonType, disabled: boolean): string[] | undefined {
    let colors: string[];
    if ((theme === 'solid' && type === 'tertiary') || (type === 'primary' && ['light', 'borderless'].includes(theme))) {
        colors = [3, 2, 1, 0].map((level, i) => `var(--semi-button-colorful-multiple-fill-${i}, var(--semi-ai-general-5-${level}))`);
    } else if (type === 'tertiary' && ['light', 'borderless', 'outline'].includes(theme)) {
        colors = ['var(--semi-button-colorful-fill-primary, var(--semi-color-ai-purple))', 'var(--semi-button-colorful-fill-secondary, var(--semi-color-text-0))'];
    } else {
        return undefined;
    }
    return disabled ? colors.map(() => 'var(--semi-color-disabled-text)') : colors;
}

// CSS :first-child/:last-child cannot be used: a disabled or loading button inside a Dropdown is wrapped in a span by
// Tooltip, so it is no longer a direct child of the group. toggle with force leaves an unchanged class alone, so it
// does not wake the observer again.
export function markEnds(container: HTMLElement) {
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button, index) => {
        button.classList.toggle(`${cssClasses.PREFIX}-first`, index === 0);
        button.classList.toggle(`${cssClasses.PREFIX}-last`, index === buttons.length - 1);
    });
}
