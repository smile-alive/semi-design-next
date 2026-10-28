import { useRef } from 'react';
import { Form, Button, TextArea, type FormApi } from '@fibrae/semi-ui-react';

interface Effect {
    name: string;
    type: string;
    key: number;
}

interface FormValues {
    effects: Effect[];
}

const initValues: FormValues = {
    effects: [
        { name: '脸部贴纸', type: '2D', key: 1 },
        { name: '背景贴纸', type: '3D', key: 2 },
    ],
};

export default function FormDemo() {
    const formApiRef = useRef<FormApi<FormValues> | null>(null);
    const idRef = useRef(3);

    const add = () => {
        const effects = formApiRef.current?.getValue('effects') ?? [];
        formApiRef.current?.setValue('effects', [...effects, { name: '', type: '', key: idRef.current++ }]);
    };

    const remove = (key: number) => {
        const effects = (formApiRef.current?.getValue('effects') ?? []).filter((effect) => key !== effect.key);
        formApiRef.current?.setValue('effects', effects.length ? effects : undefined);
    };

    return (
        <Form
            getFormApi={(api) => {
                formApiRef.current = api;
            }}
            initValues={initValues}
            style={{ width: 500 }}
            labelPosition="left"
            labelWidth="180px"
        >
            {({ formState, values }) => (
                <>
                    <Button onClick={add}>添加</Button>
                    {values.effects &&
                        values.effects.map((effect, i) => (
                            <div key={effect.key} style={{ width: 1000, display: 'flex' }}>
                                <Form.Input field={`effects[${i}].name`} aria-label={`特效 ${i + 1} 名称`} style={{ width: 200, marginRight: 12 }} />
                                <Form.Select field={`effects[${i}].type`} style={{ width: 90 }}>
                                    <Form.Select.Option value="2D">2D</Form.Select.Option>
                                    <Form.Select.Option value="3D">3D</Form.Select.Option>
                                </Form.Select>
                                <Button type="danger" onClick={() => remove(effect.key)} style={{ margin: 12 }}>
                                    删除
                                </Button>
                            </div>
                        ))}
                    <TextArea aria-label="表单值" style={{ marginTop: 10 }} value={JSON.stringify(formState.values)} />
                </>
            )}
        </Form>
    );
}
