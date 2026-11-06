import { useState } from 'react';
import { Input, Typography, Form, FormInput, TextArea, Button } from '@fibrae/semi-ui-react';

// Counts grapheme clusters, so an emoji sequence counts as one character
const getValueLength = (str: string) => [...new Intl.Segmenter().segment(str)].length;

const getTextAreaStrLength = (str: string) => str.replace(/\s/g, '').length;

export default function InputDemo() {
    const [value, setValue] = useState('');

    return (
        <div>
            <h4 id="input-value-length-max-length">maxLength=10</h4>
            <div>
                <Typography.Text>尝试输入以下字符</Typography.Text>
                <div>
                    <Typography.Text copyable>💖</Typography.Text>
                </div>
                <div>
                    <Typography.Text copyable>👨‍👩‍👧‍👦</Typography.Text>
                </div>
            </div>
            <Input aria-labelledby="input-value-length-max-length" maxLength={10} getValueLength={getValueLength} onChange={setValue} style={{ width: 200, marginBlock: 12 }} />
            {value && (
                <div>
                    <div>
                        <Typography.Text type="tertiary">{`getValueLength=${getValueLength(value)}`}</Typography.Text>
                    </div>
                    <div>
                        <Typography.Text type="tertiary">{`length=${value.length}`}</Typography.Text>
                    </div>
                </div>
            )}
            <br />
            <br />
            <h4 id="input-value-length-min-length">FormInput + minLength=4</h4>
            <Form layout="horizontal">
                <FormInput noLabel aria-labelledby="input-value-length-min-length" field="username" minLength={4} getValueLength={getValueLength} style={{ width: 200 }} />
                <Button type="primary" htmlType="submit">
                    提交
                </Button>
            </Form>
            <h4 id="input-value-length-max-count">maxCount=10</h4>
            <TextArea aria-labelledby="input-value-length-max-count" defaultValue="semi design" rows={2} maxCount={10} getValueLength={getTextAreaStrLength} style={{ width: 200 }} />
        </div>
    );
}
