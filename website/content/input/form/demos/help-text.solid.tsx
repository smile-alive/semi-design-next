import { createSignal } from 'solid-js';
import { Form, FormInput, type CommonFieldProps, type FormElement, type InputValidateStatus as ValidateStatus } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    const [weak, setWeak] = createSignal(false);
    const [validateStatus, setValidateStatus] = createSignal<ValidateStatus>('default');
    let form: FormElement | undefined;

    const validator: CommonFieldProps['validator'] = (val) => {
        if (!val) {
            setValidateStatus('error');
            return <span>密码不能为空</span>;
        } else if (val.length <= 3) {
            setValidateStatus('warning');
            setWeak(true); // 展示 helpText
            return ''; // 校验通过
        }
        setWeak(false);
        setValidateStatus('success');
        return '';
    };

    const random = () => {
        const pw = (Math.random() * 100000).toString().slice(0, 5);
        form?.formApi.setValue('Password', pw);
        form?.formApi.setError('Password', '');
        setWeak(false);
        setValidateStatus('success');
    };

    return (
        <Form showValidateIcon ref={(node) => (form = node)} onSubmit={() => console.log('submit success')} onSubmitFail={(errors) => console.log(errors)}>
            <FormInput
                validator={validator}
                field="Password"
                validateStatus={validateStatus()}
                helpText={weak() ? <span style={{ color: 'var(--semi-color-warning)' }}>密码强度：弱</span> : ''}
                extraText={
                    <button
                        type="button"
                        style={{
                            padding: 0,
                            border: 'none',
                            background: 'none',
                            font: 'inherit',
                            color: 'var(--semi-color-link)',
                            'font-size': '14px',
                            'user-select': 'none',
                            cursor: 'pointer',
                        }}
                        onClick={random}
                    >
                        没有想到合适的密码？点击随机生成一个
                    </button>
                }
            />
        </Form>
    );
}
