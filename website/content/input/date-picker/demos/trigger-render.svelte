<script lang="ts">
    import * as dateFns from 'date-fns';
    import { IconChevronDown, IconClose } from '@fibrae/semi-icons-svelte';
    import { Button, ButtonGroup, DatePicker, type DatePickerValueType } from '@fibrae/semi-ui-svelte';

    const formatToken = 'yyyy-MM-dd';
    let date = $state<DatePickerValueType | null>(new Date(2024, 4, 6, 10, 30, 0));
</script>

<DatePicker bind:value={date} format={formatToken}>
    {#snippet trigger({ value, placeholder })}
        <!-- The clear button is a sibling of the trigger button: buttons cannot nest -->
        <ButtonGroup theme="light">
            <Button iconPosition="right">
                {#snippet icon()}<IconChevronDown />{/snippet}
                {value.length ? dateFns.format(value[0], formatToken) : placeholder}
            </Button>
            {#if date}
                <Button
                    aria-label="清除"
                    onclick={(event) => {
                        event.stopPropagation();
                        date = null;
                    }}
                >
                    {#snippet icon()}<IconClose />{/snippet}
                </Button>
            {/if}
        </ButtonGroup>
    {/snippet}
</DatePicker>
