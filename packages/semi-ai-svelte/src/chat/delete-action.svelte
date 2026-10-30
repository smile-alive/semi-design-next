<script lang="ts">
    import { onMount } from 'svelte';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import { IconDeleteStroked } from '@fibrae/semi-icons-svelte';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import Popconfirm from '@fibrae/semi-ui-svelte/popconfirm/popconfirm.svelte';

    let { visible, onShow, onHide, onConfirm }: { visible: boolean; onShow: () => void; onHide: () => void; onConfirm: () => void } = $props();

    const locale = useLocale('Chat');

    let trigger: HTMLElement | undefined;
    let leftFocus: { trigger: HTMLElement; container: HTMLElement | null } | undefined;

    const { PREFIX, PREFIX_CHAT_BOX_ACTION } = cssClasses;

    const confirm = () => {
        leftFocus = trigger && { trigger, container: trigger.closest<HTMLElement>(`.${PREFIX}-container`) };
        onConfirm();
    };

    // A confirmed delete removes this message and its focused button; the message list takes the focus instead of the
    // body. Svelte runs the cleanup after the DOM is removed.
    onMount(() => () => {
        if (leftFocus) {
            handoverFocus(leftFocus.trigger, leftFocus.container);
        }
    });
</script>

<!-- trigger="custom" ignores Esc and outside clicks; confirm or cancel only report through onVisibleChange -->
<Popconfirm onClickOutSide={onHide} onConfirm={confirm} onEscKeyDown={onHide} onVisibleChange={(next) => !next && onHide()} position="top" title={locale().locale.deleteConfirm} trigger="custom" {visible}>
    {#snippet child({ props })}
        <Button
            {...props}
            aria-label={locale().locale.delete}
            class="{PREFIX_CHAT_BOX_ACTION}-btn"
            theme="borderless"
            type="tertiary"
            onclick={(event) => {
                trigger = event.currentTarget;
                onShow();
            }}
        >
            {#snippet icon()}
                <IconDeleteStroked />
            {/snippet}
        </Button>
    {/snippet}
</Popconfirm>
