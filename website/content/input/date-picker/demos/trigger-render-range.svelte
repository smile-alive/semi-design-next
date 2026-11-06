<script lang="ts">
    import * as dateFns from 'date-fns';
    import { IconChevronDown, IconClose } from '@fibrae/semi-icons-svelte';
    import { Button, ButtonGroup, DatePicker, type DatePickerValueType } from '@fibrae/semi-ui-svelte';

    const formatToken = 'yyyy-MM-dd HH:mm:ss';
    let date = $state<DatePickerValueType | null>(null);

    const onChange = (value: Date | Date[] | undefined) => {
        console.log(value);
    };
</script>

<DatePicker bind:value={date} {onChange} type="dateTimeRange">
    {#snippet trigger(triggerProps)}
        <!-- The clear button is a sibling of the trigger button: buttons cannot nest -->
        <ButtonGroup theme="light">
            <Button iconPosition="right">
                {#snippet icon()}<IconChevronDown />{/snippet}
                {triggerProps.value.length ? `${dateFns.format(triggerProps.value[0], formatToken)} ~ ${dateFns.format(triggerProps.value[1], formatToken)}` : '请选择日期时间范围'}
            </Button>
            {#if triggerProps.value.length}
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
