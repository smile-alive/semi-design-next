import { IconPlusCircle, IconMinusCircle } from '@fibrae/semi-icons-react';
import { ArrayField, TextArea, Form, FormInput, FormSelect, Button } from '@fibrae/semi-ui-react';

const data = [
    { name: 'Semi Core', role: 'Engineer' },
    { name: 'Semi C2D', role: 'Designer' },
];

const roleOptions = [
    { label: 'Engineer', value: 'Engineer' },
    { label: 'Designer', value: 'Designer' },
];

export default function FormDemo() {
    return (
        <Form style={{ width: 800 }} labelPosition="left" labelWidth="100px" allowEmpty>
            {(form) => (
                <>
                    <ArrayField field="rules" initValue={data}>
                        {(arrayField) => (
                            <>
                                <Button onClick={arrayField.add} icon={<IconPlusCircle />} theme="light">
                                    Add new line
                                </Button>
                                <Button icon={<IconPlusCircle />} onClick={() => arrayField.addWithInitValue({ name: 'Semi Theme', role: 'Designer' })} style={{ marginInlineStart: 8 }}>
                                    Add new line with init value
                                </Button>
                                {arrayField.arrayFields.map((item) => (
                                    <div key={item.key} style={{ width: 1000, display: 'flex' }}>
                                        <FormInput field={`${item.field}[name]`} label={`${item.field}.name`} style={{ width: 200, marginInlineEnd: 16 }} />
                                        <FormSelect field={`${item.field}[role]`} label={`${item.field}.role`} style={{ width: 120 }} optionList={roleOptions} />
                                        <Button type="danger" theme="borderless" aria-label="Delete" icon={<IconMinusCircle />} onClick={item.remove} style={{ margin: 12 }} />
                                    </div>
                                ))}
                            </>
                        )}
                    </ArrayField>
                    <TextArea aria-label="Form state" style={{ marginBlockStart: 10 }} value={JSON.stringify(form.formState)} />
                </>
            )}
        </Form>
    );
}
