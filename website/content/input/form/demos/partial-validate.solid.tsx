import { Button, Form, FormCheckboxGroup, FormInput, Space, Toast, type FormApi } from '@fibrae/semi-ui-solid';

const allFields = ['a', 'b', 'c', 'd', 'b.name'];
const options = allFields.map((item) => ({ label: item, value: item }));

const validate = (val?: string) => {
    if (!val) {
        return "can't be empty";
    } else if (val.length <= 5) {
        return <span>我是传入的节点</span>;
    }
    return;
};

export default function FormDemo() {
    let formApi: FormApi | undefined;

    const validatePartial = (type?: 'all') => {
        const scope = type === 'all' ? allFields : (formApi?.getValue('validateScope') ?? []);
        formApi
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
        formApi?.reset(formApi.getValue('resetScope'));
    };

    return (
        <Form getFormApi={(api) => (formApi = api)} autoScrollToError layout="horizontal">
            {(form) => (
                <>
                    <div>
                        <FormInput field="a[1]" validator={validate} trigger="blur" />
                        <FormInput field="a[0]" validator={validate} trigger="blur" />
                        <FormInput field="b.name[0]" validator={validate} trigger="blur" />
                        <FormInput field="b.name[1]" validator={validate} trigger="blur" />
                        <FormInput field="b.type" validator={validate} trigger="blur" />
                        <FormInput field="c" validator={validate} trigger="blur" />
                        <FormInput field="d" validator={validate} trigger="blur" />
                    </div>
                    <div>
                        <FormCheckboxGroup options={options} field="validateScope" label="当前希望校验的Field" initValue={['a', 'b']} direction="horizontal" />
                        <FormCheckboxGroup options={options} field="resetScope" label="当前需要Reset的Field" direction="horizontal" />
                        <Space>
                            <Button htmlType="reset">reset</Button>
                            <Button onClick={() => validatePartial('all')}>all validate</Button>
                            <Button onClick={() => validatePartial()}>partial validate {JSON.stringify(form.values.validateScope)}</Button>
                            <Button onClick={resetPartial}>partial reset</Button>
                        </Space>
                    </div>
                </>
            )}
        </Form>
    );
}
