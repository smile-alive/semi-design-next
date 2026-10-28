import { useState } from 'react';
import { SideSheet, TextArea, Button } from '@fibrae/semi-ui-react';

export default function SideSheetDemo() {
    const [visible, setVisible] = useState(false);
    const [value, setValue] = useState('');
    return (
        <>
            <Button onClick={() => setVisible(true)}>Open SideSheet</Button>
            <TextArea placeholder="Please enter something" onChange={(value) => setValue(value)} style={{ marginTop: 12 }} />
            <SideSheet title="可操作外部的侧边栏" visible={visible} onCancel={() => setVisible(false)} mask={false} disableScroll={false}>
                <p>这里是输入的内容：</p>
                <p>{value}</p>
            </SideSheet>
        </>
    );
}
