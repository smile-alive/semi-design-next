<script lang="ts">
    import { RadioGroup, Space, type RadioChangeEvent, type RadioValue } from '@fibrae/semi-ui-svelte';

    let value1 = $state<RadioValue | undefined>('Guest');
    let value2 = $state<RadioValue | undefined>('Developer');
    let value3 = $state<RadioValue | undefined>('Maintainer');
    const plainOptions = ['Guest', 'Developer', 'Maintainer'];
    const options = [
        { label: 'Guest', value: 'Guest', extra: 'Semi Design', style: 'width: 120px' },
        { label: 'Developer', value: 'Developer', extra: 'Semi Design', style: 'width: 120px' },
        { label: 'Maintainer', value: 'Maintainer', extra: 'Semi Design', style: 'width: 120px' },
    ];
    const optionsWithDisabled = [
        { label: 'Guest', value: 'Guest' },
        { label: 'Developer', value: 'Developer' },
        { label: 'Maintainer', value: 'Maintainer', disabled: true },
    ];

    const log = (name: string, e: RadioChangeEvent) => console.log(`${name} checked`, e.target.value);
</script>

<Space align="start" spacing="loose" vertical>
    <RadioGroup aria-label="单选组合示例" bind:value={value1} name="demo-radio-group-1" onChange={(e) => log('radio1', e)} options={plainOptions} />
    <RadioGroup aria-label="单选组合示例" bind:value={value2} name="demo-radio-group-2" onChange={(e) => log('radio2', e)} options={optionsWithDisabled} />
    <RadioGroup aria-label="单选组合示例" bind:value={value3} name="demo-radio-group-3" onChange={(e) => log('radio3', e)} {options} />
</Space>
