import { useRef } from 'react';
import { Form, Button, Space, Toast, type FormApi } from '@fibrae/semi-ui-react';

const allFields = ['a', 'b', 'c', 'd', 'b.name'];
const options = allFields.map((item) => ({ label: item, value: item }));

function validate(val?: string) {
    if (!val) {
        return "can't be empty";
    } else if (val.length <= 5) {
        return <span>我是传入的节点</span>;
    }
    return;
}

export default function FormDemo() {
    const formApiRef = useRef<FormApi | null>(null);

    const validatePartial = (type?: 'all') => {
        const scope = type === 'all' ? allFields : (formApiRef.current?.getValue('validateScope') ?? []);
        formApiRef.current
            ?.validate(scope)
            .then((values) => {
                console.log(values);
                Toast.success('pass');
            })
            .catch((error) => {
                Toast.error('error');
                console.log(error);
            });
    };

    const resetPartial = () => {
        formApiRef.current?.reset(formApiRef.current.getValue('resetScope'));
    };

    return (
        <Form
            getFormApi={(api) => {
                formApiRef.current = api;
            }}
            autoScrollToError
            layout="horizontal"
        >
            {({ values }) => (
                <>
                    <div>
                        <Form.Input field="a[1]" validator={validate} trigger="blur" />
                        <Form.Input field="a[0]" validator={validate} trigger="blur" />
                        <Form.Input field="b.name[0]" validator={validate} trigger="blur" />
                        <Form.Input field="b.name[1]" validator={validate} trigger="blur" />
                        <Form.Input field="b.type" validator={validate} trigger="blur" />
                        <Form.Input field="c" validator={validate} trigger="blur" />
                        <Form.Input field="d" validator={validate} trigger="blur" />
                    </div>
                    <div>
                        <Form.CheckboxGroup options={options} field="validateScope" label="当前希望校验的Field" initValue={['a', 'b']} direction="horizontal" />
                        <Form.CheckboxGroup options={options} field="resetScope" label="当前需要Reset的Field" direction="horizontal" />
                        <Space>
                            <Button htmlType="reset">reset</Button>
                            <Button onClick={() => validatePartial('all')}>all validate</Button>
                            <Button onClick={() => validatePartial()}>partial validate {JSON.stringify(values.validateScope)}</Button>
                            <Button onClick={resetPartial}>partial reset</Button>
                        </Space>
                    </div>
                </>
            )}
        </Form>
    );
}
