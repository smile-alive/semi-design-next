import { CheckboxGroup, type CheckboxValue } from '@fibrae/semi-ui-solid';

const plainOptions = ['Semi UI', 'Semi DSM', 'Semi D2C'];

const optionsWithExtra = [
    {
        extra: '从 Semi Design，到 Any Design 快速定制你的设计系统，并应用在设计稿和代码中',
        label: 'Semi DSM',
        value: 'dsm',
    },
    { extra: '高效的 Design To Code 设计稿转代码', label: 'Semi D2C', value: 'd2c' },
];

const optionsWithDisabled = [
    { label: 'Photography', value: 'Photography' },
    { label: 'Movies', value: 'Movies' },
    { label: 'Running', value: 'Running', disabled: false },
];

function onChange(checkedValues: CheckboxValue[]) {
    console.log('checked = ', checkedValues);
}

export default function CheckboxDemo() {
    return (
        <div>
            <CheckboxGroup options={plainOptions} defaultValue={['Semi D2C']} onChange={onChange} aria-label="CheckboxGroup 示例" />
            <br />
            <br />
            <CheckboxGroup options={optionsWithExtra} defaultValue={[]} onChange={onChange} aria-label="带 extra 示例" />
            <br />
            <br />
            <CheckboxGroup options={optionsWithDisabled} disabled defaultValue={['Photography']} onChange={onChange} aria-label="Checkbox 示例" />
        </div>
    );
}
