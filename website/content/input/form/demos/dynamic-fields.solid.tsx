import { Show } from 'solid-js';
import { Button, Form, FormInput, FormRadio, FormRadioGroup } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    return (
        <Form style={{ width: '450px' }}>
            {(form) => (
                <>
                    <FormInput field="name" label="用户名称:" />
                    <FormRadioGroup field="isAnchor" label="是否已注册主播">
                        <FormRadio value="yes">yes</FormRadio>
                        <FormRadio value="no">no</FormRadio>
                    </FormRadioGroup>
                    <Show when={form.formState.values.isAnchor === 'yes'}>
                        <FormInput field="liveRoom" label="直播间名称" />
                    </Show>
                    <Button htmlType="submit">提交</Button>
                </>
            )}
        </Form>
    );
}
