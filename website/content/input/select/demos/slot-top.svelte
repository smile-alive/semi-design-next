<script lang="ts">
    import { RadioGroup, Select, type RadioChangeEvent, type SelectValue } from '@fibrae/semi-ui-svelte';

    interface Item {
        value: string;
        label: string;
    }

    const list: Record<string, Item[]> = {
        component: [
            { value: 'select', label: '选择器' },
            { value: 'tabs', label: '标签' },
            { value: 'avatar', label: '头像' },
            { value: 'button', label: '按钮' },
        ],
        design: [
            { value: 'color', label: '颜色' },
            { value: 'dark', label: '暗色模式' },
            { value: 'icon', label: '图标' },
            { value: 'font', label: '字体' },
        ],
        feedback: [
            { value: 'faq', label: '常见问题' },
            { value: 'join', label: '加入用户群' },
            { value: 'hornbill', label: '犀鸟反馈问题' },
        ],
    };
    const categoryOptions = [
        { value: 'component', label: '组件' },
        { value: 'design', label: '设计' },
        { value: 'feedback', label: '反馈' },
    ];

    let key = $state('component');
    let value = $state<SelectValue>({ value: 'faq', label: '常见问题' });

    const changeCategory = (event: RadioChangeEvent) => {
        key = String(event.target.value);
    };
</script>

<Select aria-label="选项" autoAdjustOverflow={false} bind:value defaultOpen onChangeWithObject optionList={list[key]} style="width: 200px">
    {#snippet outerTopSlot()}
        <!-- The radio group switches with arrow keys, so categories need no tabpanel association -->
        <div style="padding: 8px 12px; border-bottom: 0.5px solid var(--semi-color-border)">
            <RadioGroup aria-label="选项分类" buttonSize="small" onChange={changeCategory} options={categoryOptions} type="button" value={key} />
        </div>
    {/snippet}
</Select>
