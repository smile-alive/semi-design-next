import { withField, Input, Select, Form, useFormState } from '@fibrae/semi-ui-react';

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

// id and aria-labelledby go on the fieldset (named by the field label); aria-required goes to each control
function MyComponent({ id, onChange, value, 'aria-labelledby': labelledBy, 'aria-required': required }: MyComponentProps) {
    const { name, role } = value || {};
    const handleChange = (v: string | undefined, type: 'name' | 'role') => {
        const newValue = { ...value, [type === 'name' ? 'name' : 'role']: v };
        onChange?.(newValue);
    };
    return (
        <fieldset className="customField" id={id} aria-labelledby={labelledBy} style={{ border: 0, margin: 0, padding: 0 }}>
            <Input aria-label="名称" aria-required={required} prefix="名称" value={name} onChange={(v) => handleChange(v, 'name')} style={{ width: 180, marginRight: 12 }} />
            <Select
                aria-label="角色"
                aria-required={required}
                prefix="角色"
                value={role}
                onChange={(v) => handleChange(v, 'role')}
                style={{ width: 200 }}
                optionList={[
                    { value: 'rd', label: '开发' },
                    { value: 'UED', label: '设计师' },
                ]}
            />
        </fieldset>
    );
}
const CustomField = withField(MyComponent, { valueKey: 'value', onKeyChangeFnName: 'onChange' });

function ComponentUsingFormState() {
    const formState = useFormState();
    return (
        <pre>
            <code>{JSON.stringify(formState)}</code>
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
