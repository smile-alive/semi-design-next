<script lang="ts">
    import type { ClassValue } from 'svelte/elements';
    import { cssClasses } from '@fibrae/semi-foundation/components/input-number/constants';
    import { IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-svelte';

    // Not focusable, no role: the keyboard steps with the input's arrow keys.
    let {
        classNames,
        styles,
        inner,
        innerHover,
        disabled,
        upNotAllowed,
        downNotAllowed,
        onPressUp,
        onPressDown,
        onMouseDown,
        onRelease,
    }: {
        classNames?: Partial<Record<'actions' | 'upButton' | 'downButton', ClassValue>>;
        styles?: Partial<Record<'actions' | 'upButton' | 'downButton', string>>;
        inner: boolean;
        innerHover: boolean;
        disabled: boolean;
        upNotAllowed: boolean;
        downNotAllowed: boolean;
        onPressUp: (event: PointerEvent) => void;
        onPressDown: (event: PointerEvent) => void;
        onMouseDown: (event: MouseEvent) => void;
        onRelease: () => void;
    } = $props();

    const prefix = cssClasses.PREFIX;
</script>

<div
    class={[
        `${prefix}-number-suffix-btns`,
        {
            [`${prefix}-number-suffix-btns-inner`]: inner,
            [`${prefix}-number-suffix-btns-inner-hover`]: innerHover,
        },
        classNames?.actions,
    ]}
    style={styles?.actions}
>
    <span
        class={[
            `${prefix}-number-button`,
            `${prefix}-number-button-up`,
            {
                [`${prefix}-number-button-up-disabled`]: disabled,
                [`${prefix}-number-button-up-not-allowed`]: upNotAllowed,
            },
            classNames?.upButton,
        ]}
        style={styles?.upButton}
        onlostpointercapture={onRelease}
        onmousedown={onMouseDown}
        onpointerdown={onPressUp}
    >
        <IconChevronUp size="extra-small" />
    </span>
    <span
        class={[
            `${prefix}-number-button`,
            `${prefix}-number-button-down`,
            {
                [`${prefix}-number-button-down-disabled`]: disabled,
                [`${prefix}-number-button-down-not-allowed`]: downNotAllowed,
            },
            classNames?.downButton,
        ]}
        style={styles?.downButton}
        onlostpointercapture={onRelease}
        onmousedown={onMouseDown}
        onpointerdown={onPressDown}
    >
        <IconChevronDown size="extra-small" />
    </span>
</div>
