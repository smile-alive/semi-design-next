import { Form, Input, Select, useFormState, withField } from '@fibrae/semi-ui-solid';

interface BaseInfo {
    name?: string;
    role?: string;
}

interface MyComponentProps {
    id?: string;
    value?: BaseInfo;
    onChange?: (value: BaseInfo) => void;
    'aria-labelledby'?: string;
    'aria-required'?: boolean;
}

const roles = [
    { value: 'rd', label: '开发' },
    { value: 'UED', label: '设计师' },
];

// id and aria-labelledby go on the fieldset (named by the field label); aria-required goes to each control
function MyComponent(props: MyComponentProps) {
    const handleChange = (patch: BaseInfo) => props.onChange?.({ ...props.value, ...patch });
    return (
        <fieldset class="customField" id={props.id} aria-labelledby={props['aria-labelledby']} style={{ border: '0', margin: '0', padding: '0' }}>
            <Input aria-label="名称" aria-required={props['aria-required']} prefix="名称" value={props.value?.name} onChange={(name) => handleChange({ name })} style={{ width: '180px', 'margin-right': '12px' }} />
            <Select aria-label="角色" aria-required={props['aria-required']} prefix="角色" value={props.value?.role} onChange={(role) => handleChange({ role: role as string | undefined })} style={{ width: '200px' }} optionList={roles} />
        </fieldset>
    );
}

const CustomField = withField(MyComponent, { valueKey: 'value', onKeyChangeFnName: 'onChange' });

function ComponentUsingFormState() {
    const formState = useFormState();
    return (
        <pre>
            <code>{JSON.stringify(formState())}</code>
        </pre>
    );
}

export default function FormDemo() {
    return (
        <Form>
            <CustomField field="baseInfo" label={{ text: '基本信息', required: true }} />
            <ComponentUsingFormState />
        </Form>
    );
}
