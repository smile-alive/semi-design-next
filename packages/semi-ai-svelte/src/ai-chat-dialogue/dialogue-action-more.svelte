<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { IconDeleteStroked, IconMoreStroked } from '@fibrae/semi-icons-svelte';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import DropdownItem from '@fibrae/semi-ui-svelte/dropdown/dropdown-item.svelte';
    import DropdownMenu from '@fibrae/semi-ui-svelte/dropdown/dropdown-menu.svelte';
    import Dropdown from '@fibrae/semi-ui-svelte/dropdown/dropdown.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';

    interface DialogueActionMoreProps {
        visible: boolean;
        onShow: () => void;
        onHide: () => void;
        /** Carries the trigger: the confirm dialog hands focus back near it once the deleted message is gone */
        onDelete: (trigger?: HTMLElement) => void;
    }

    let { visible, onShow, onHide, onDelete }: DialogueActionMoreProps = $props();

    const locale = useLocale('AIChatDialogue');

    let trigger: HTMLElement | undefined;

    const { PREFIX_ACTION } = cssClasses;
</script>

<Dropdown class="{PREFIX_ACTION}-dropdown" onClickOutSide={onHide} onEscKeyDown={onHide} position="bottomLeft" spacing={12} stopPropagation trigger="custom" {visible}>
    {#snippet child({ props })}
        <Button
            {...props}
            aria-label={locale().locale.more}
            theme="borderless"
            type="tertiary"
            onclick={(event) => {
                trigger = event.currentTarget;
                onShow();
            }}
        >
            {#snippet icon()}
                <IconMoreStroked />
            {/snippet}
        </Button>
    {/snippet}
    {#snippet content()}
        <DropdownMenu>
            <DropdownItem onclick={() => onDelete(trigger)}><IconDeleteStroked /> {locale().locale.delete}</DropdownItem>
        </DropdownMenu>
    {/snippet}
</Dropdown>
