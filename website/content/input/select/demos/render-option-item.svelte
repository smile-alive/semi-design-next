<script lang="ts">
    import { Checkbox, Highlight, Select, type SelectOptionItemSnippetProps } from '@fibrae/semi-ui-svelte';

    let inputValue = $state('');

    const optionList = [
        { value: 'douyin', label: '抖音', otherKey: 0 },
        { value: 'ulikecam', label: '轻颜相机', disabled: true, otherKey: 1 },
        { value: 'jianying', label: '剪映', otherKey: 2 },
        { value: 'toutiao', label: '今日头条', otherKey: 3 },
    ];
</script>

<!--
    Put style on the outer DOM or the virtual list breaks; add selected/focused/disabled styles from the snippet
    params; bind onmouseenter and class on the outer DOM or arrow keys display wrongly; put id there so screen
    readers announce the option the arrow keys reach
-->
{#snippet optionItem({ id, disabled, selected, label, focused, class: className, style, onclick, onmouseenter }: SelectOptionItemSnippetProps)}
    <div
        aria-disabled={disabled}
        aria-selected={selected}
        class={[
            'custom-option-render',
            {
                'custom-option-render-focused': focused,
                'custom-option-render-disabled': disabled,
                'custom-option-render-selected': selected,
            },
            className,
        ]}
        {id}
        role="option"
        {style}
        {onclick}
        {onmouseenter}
    >
        <Checkbox checked={selected} />
        <div class="option-right">
            <Highlight searchWords={[inputValue]} sourceString={String(label)} />
        </div>
    </div>
{/snippet}

<Select aria-label="单选" dropdownClassName="components-select-demo-renderOptionItem" filter onSearch={(value) => (inputValue = value)} {optionItem} {optionList} placeholder="单选" style="width: 180px" />
<br />
<br />
<Select aria-label="多选" dropdownClassName="components-select-demo-renderOptionItem" filter multiple onSearch={(value) => (inputValue = value)} {optionItem} {optionList} placeholder="多选" style="width: 320px" />
