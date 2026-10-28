import { createSignal, Show } from 'solid-js';
import { Button, Form, FormInput, Input, TextArea, Typography } from '@fibrae/semi-ui-solid';

// Counts grapheme clusters, so an emoji sequence counts as one character
function getValueLength(str: string) {
    return [...new Intl.Segmenter().segment(str)].length;
}

function getTextAreaStrLength(str: string) {
    return str.replace(/\s/g, '').length;
}

export default function InputDemo() {
    const [value, setValue] = createSignal('');

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
            <Input aria-labelledby="input-value-length-max-length" maxLength={10} getValueLength={getValueLength} onChange={(next) => setValue(next)} style={{ width: '200px', 'margin-top': '12px', 'margin-bottom': '12px' }} />
            <Show when={value()}>
                <div>
                    <div>
                        <Typography.Text type="tertiary">{`getValueLength=${getValueLength(value())}`}</Typography.Text>
                    </div>
                    <div>
                        <Typography.Text type="tertiary">{`length=${value().length}`}</Typography.Text>
                    </div>
                </div>
            </Show>
            <br />
            <br />
            <h4 id="input-value-length-min-length">Form.Input + minLength=4</h4>
            <Form layout="horizontal">
                <FormInput noLabel aria-labelledby="input-value-length-min-length" field="username" minLength={4} getValueLength={getValueLength} style={{ width: '200px' }} />
                <Button type="primary" htmlType="submit">
                    提交
                </Button>
            </Form>
            <h4 id="input-value-length-max-count">maxCount=10</h4>
            <TextArea aria-labelledby="input-value-length-max-count" defaultValue="semi design" rows={2} maxCount={10} getValueLength={getTextAreaStrLength} style={{ width: '200px' }} />
        </div>
    );
}
