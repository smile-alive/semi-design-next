<script lang="ts">
    import { IconBulb } from '@fibrae/semi-icons-svelte';
    import { DatePicker, Space, Tabs, TypographyText, type DatePickerValueType, type PlainTab } from '@fibrae/semi-ui-svelte';

    const uedDisabledDate = (currentDate?: Date) => !!currentDate && currentDate.getDate() > 10 && currentDate.getDate() < 15;
    const testDisabledDate = (currentDate?: Date) => !!currentDate && currentDate.getDate() > 15 && currentDate.getDate() < 25;

    const tabList: PlainTab[] = [
        { itemKey: '1', tab: 'UED 排期' },
        { itemKey: '2', tab: '测试排期' },
    ];

    let activeTab = $state('1');
    let date = $state<DatePickerValueType | null>();
    const disabledDate = $derived(activeTab === '1' ? uedDisabledDate : testDisabledDate);
</script>

{#snippet tabs(padding: string)}
    <Tabs bind:activeKey={activeTab} onChange={() => (date = null)} size="small" style={`padding: ${padding}`} {tabList} />
{/snippet}

{#snippet notice(padding: string, text: string, linkText: string)}
    <Space style={`padding: ${padding}`}>
        <IconBulb style="color: var(--semi-amber-5)" />
        <TypographyText strong style="color: var(--semi-color-text-2)">{text}</TypographyText>
        <TypographyText link={{ href: 'https://semi.design/', target: '_blank' }}>{linkText}</TypographyText>
    </Space>
{/snippet}

<div>
    <DatePicker bind:value={date} {disabledDate} dropdownClassName="components-datepicker-demo-slot" placeholder="请选择排期">
        {#snippet topSlot()}{@render tabs('12px 20px 0')}{/snippet}
    </DatePicker>
    <br />
    <br />
    <DatePicker placeholder="请选择发版时间">
        {#snippet bottomSlot()}{@render notice('12px 20px', '定版前请阅读', '发版须知')}{/snippet}
    </DatePicker>
    <br />
    <br />
    <DatePicker placeholder="请选择年月" type="month">
        {#snippet bottomSlot()}{@render notice('12px 20px', '请阅读', '须知')}{/snippet}
    </DatePicker>
    <br />
    <br />
    <DatePicker density="compact" dropdownClassName="components-datepicker-demo-slot" placeholder="小尺寸">
        {#snippet topSlot()}{@render tabs('8px 12px 0')}{/snippet}
        {#snippet bottomSlot()}{@render notice('8px 12px', '定版前请阅读', '发版须知')}{/snippet}
    </DatePicker>
    <br />
    <br />
    <DatePicker placeholder="请选择时间范围" style="width: 400px" type="dateTimeRange">
        {#snippet bottomSlot()}{@render notice('12px 20px', '定版前请阅读', '发版须知')}{/snippet}
    </DatePicker>
    <br />
    <br />
</div>
