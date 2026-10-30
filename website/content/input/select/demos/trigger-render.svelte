<script lang="ts">
    import { IconAppCenter, IconChevronDown } from '@fibrae/semi-icons-svelte';
    import { Select, Tag, type SelectValue } from '@fibrae/semi-ui-svelte';

    let valList = $state<SelectValue>(['douyin', 'ulikecam']);

    const list = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'toutiao', label: '今日头条' },
    ];
</script>

<div>
    <h4>不同背景色的触发器</h4>
    <Select aria-label="不同背景色的触发器" bind:value={valList} filter multiple optionList={list} searchPosition="dropdown" style="width: 240px">
        {#snippet trigger({ value })}
            <div style="min-width: 112px; background-color: var(--semi-color-primary-light-default); height: 32px; display: flex; align-items: center; padding-left: 12px; border-radius: 3px; color: var(--semi-color-primary)">
                <div style="font-weight: 600; flex-shrink: 0; font-size: 14px">业务线</div>
                <div style="margin: 4px; white-space: nowrap; text-overflow: ellipsis; flex-grow: 1; overflow: hidden">
                    {value.map((item) => item.label).join(' , ')}
                </div>
                <IconAppCenter style="margin-right: 8px; flex-shrink: 0" />
            </div>
        {/snippet}
    </Select>
    <br />
    <br />
    <h4>使用 circle Tag 作为触发器</h4>
    <Select aria-label="circle Tag 触发器" bind:value={valList} filter multiple optionList={list} searchPosition="dropdown" style="width: 240px; margin-top: 20px; outline: 0">
        {#snippet trigger({ value })}
            <div style="margin: 4px; white-space: nowrap; text-overflow: ellipsis; flex-grow: 1; overflow: hidden; display: flex; align-items: center">
                <Tag color="cyan" shape="circle" size="large">
                    {value.map((item) => item.label).join(' / ')}
                    {#snippet suffixIcon()}
                        <IconChevronDown />
                    {/snippet}
                </Tag>
            </div>
        {/snippet}
    </Select>
</div>
