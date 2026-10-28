import { useState, useRef, type ReactNode } from 'react';
import { Form, type CommonFieldProps, type FormHandle, type InputValidateStatus as ValidateStatus } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    const [helpText, setHelpText] = useState<ReactNode>('');
    const [validateStatus, setValidateStatus] = useState<ValidateStatus>('default');
    const formRef = useRef<FormHandle>(null);

    const validator: CommonFieldProps['validator'] = (val) => {
        if (!val) {
            setValidateStatus('error');
            return <span>密码不能为空</span>;
        } else if (val.length <= 3) {
            setValidateStatus('warning');
            setHelpText(<span style={{ color: 'var(--semi-color-warning)' }}>密码强度：弱</span>); // 展示 helpText
            return ''; // 校验通过
        } else {
            setHelpText('');
            setValidateStatus('success');
            return '';
        }
    };

    const random = () => {
        let pw = (Math.random() * 100000).toString().slice(0, 5);
        formRef.current?.formApi.setValue('Password', pw);
        formRef.current?.formApi.setError('Password', '');
        setHelpText('');
        setValidateStatus('success');
    };

    return (
        <Form showValidateIcon ref={formRef} onSubmit={() => console.log('submit success')} onSubmitFail={(errors) => console.log(errors)}>
            <Form.Input
                validator={validator}
                field="Password"
                validateStatus={validateStatus}
                helpText={helpText}
                extraText={
                    <button
                        type="button"
                        style={{
                            padding: 0,
                            border: 'none',
                            background: 'none',
                            font: 'inherit',
                            color: 'var(--semi-color-link)',
                            fontSize: 14,
                            userSelect: 'none',
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
