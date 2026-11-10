<script lang="ts">
    import { CheckboxGroup, type CheckboxValue } from '@fibrae/semi-ui-svelte';

    const onChange = (checkedValues: CheckboxValue[]) => console.log('checked = ', checkedValues);

    const plainOptions = ['Semi UI', 'Semi Theme', 'Semi Core'];

    const optionsWithExtra = [
        {
            extra: '通过 --semi-* 变量快速定制你的主题，并应用在设计稿和代码中',
            label: 'Semi Theme',
            value: 'theme',
        },
        { extra: '一套组件，四个框架原生可用', label: 'Semi Core', value: 'core' },
    ];

    const optionsWithDisabled = [
        { label: 'Photography', value: 'Photography' },
        { label: 'Movies', value: 'Movies' },
        { label: 'Running', value: 'Running', disabled: false },
    ];
</script>

<div>
    <CheckboxGroup aria-label="CheckboxGroup 示例" {onChange} options={plainOptions} value={['Semi Core']} />
    <br />
    <br />
    <CheckboxGroup aria-label="带 extra 示例" {onChange} options={optionsWithExtra} value={[]} />
    <br />
    <br />
    <CheckboxGroup aria-label="Checkbox 示例" disabled {onChange} options={optionsWithDisabled} value={['Photography']} />
</div>
