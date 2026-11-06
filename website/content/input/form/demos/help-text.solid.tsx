import { createSignal } from 'solid-js';
import { Form, FormInput, type FormElement, type InputValidateStatus as ValidateStatus } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    const [helpText, setHelpText] = createSignal('');
    const [validateStatus, setValidateStatus] = createSignal<ValidateStatus>('default');
    let form: FormElement | undefined;

    const validator = (val?: string) => {
        if (!val) {
            setValidateStatus('error');
            return '密码不能为空';
        } else if (val.length <= 3) {
            setValidateStatus('warning');
            setHelpText('密码强度：弱'); // 展示 helpText
            return ''; // 校验通过
        }
        setHelpText('');
        setValidateStatus('success');
        return '';
    };

    const random = () => {
        const pw = (Math.random() * 100000).toString().slice(0, 5);
        form?.formApi.setValue('Password', pw);
        form?.formApi.setError('Password', '');
        setHelpText('');
        setValidateStatus('success');
    };

    return (
        <Form showValidateIcon ref={(node) => (form = node)} onSubmit={() => console.log('submit success')} onSubmitFail={(errors) => console.log(errors)}>
            <FormInput
                validator={validator}
                field="Password"
                validateStatus={validateStatus()}
                helpText={helpText() ? <span style={{ color: 'var(--semi-color-warning)' }}>{helpText()}</span> : ''}
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
