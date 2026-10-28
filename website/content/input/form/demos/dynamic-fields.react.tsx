import React from 'react';
import { Form, Button } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form style={{ width: 450 }}>
            {({ formState }) => (
                <React.Fragment>
                    <Form.Input field="name" label="用户名称:" />
                    <Form.RadioGroup field="isAnchor" label="是否已注册主播">
                        <Form.Radio value="yes">yes</Form.Radio>
                        <Form.Radio value="no">no</Form.Radio>
                    </Form.RadioGroup>
                    {formState.values.isAnchor === 'yes' && <Form.Input field="liveRoom" label="直播间名称" />}
                    <Button htmlType="submit">提交</Button>
                </React.Fragment>
            )}
        </Form>
    );
}
