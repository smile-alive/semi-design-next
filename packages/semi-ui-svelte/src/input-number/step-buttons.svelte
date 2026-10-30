<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/input-number/constants';
    import { IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-svelte';

    // Not focusable, no role: the keyboard steps with the input's arrow keys.
    let {
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
    ]}
>
    <span
        class={[
            `${prefix}-number-button`,
            `${prefix}-number-button-up`,
            {
                [`${prefix}-number-button-up-disabled`]: disabled,
                [`${prefix}-number-button-up-not-allowed`]: upNotAllowed,
            },
        ]}
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
        ]}
        onlostpointercapture={onRelease}
        onmousedown={onMouseDown}
        onpointerdown={onPressDown}
    >
        <IconChevronDown size="extra-small" />
    </span>
</div>
