import { Form, FormInput, FormRadio, FormRadioGroup, Button } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form style={{ width: 450 }}>
            {(form) => (
                <>
                    <FormInput field="name" label="用户名称:" />
                    <FormRadioGroup field="isAnchor" label="是否已注册主播">
                        <FormRadio value="yes">yes</FormRadio>
                        <FormRadio value="no">no</FormRadio>
                    </FormRadioGroup>
                    {form.formState.values.isAnchor === 'yes' && <FormInput field="liveRoom" label="直播间名称" />}
                    <Button htmlType="submit">提交</Button>
                </>
            )}
        </Form>
    );
}
