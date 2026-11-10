import { CheckboxGroup, type CheckboxValue } from '@fibrae/semi-ui-react';

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

export default function CheckboxDemo() {
    return (
        <div>
            <CheckboxGroup options={plainOptions} defaultValue={['Semi Core']} onChange={onChange} aria-label="CheckboxGroup 示例" />
            <br />
            <br />
            <CheckboxGroup options={optionsWithExtra} defaultValue={[]} onChange={onChange} aria-label="带 extra 示例" />
            <br />
            <br />
            <CheckboxGroup options={optionsWithDisabled} disabled defaultValue={['Photography']} onChange={onChange} aria-label="Checkbox 示例" />
        </div>
    );
}
