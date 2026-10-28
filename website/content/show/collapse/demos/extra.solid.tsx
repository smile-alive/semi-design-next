import { IconCopy } from '@fibrae/semi-icons-solid';
import { Collapse, Tag } from '@fibrae/semi-ui-solid';

export default function CollapseDemo() {
    return (
        <Collapse>
            <Collapse.Panel header="This is panel header 1" itemKey="1" extra="1234">
                <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
            </Collapse.Panel>
            <Collapse.Panel header="This is panel header 2" itemKey="2" extra={<IconCopy />}>
                <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
            </Collapse.Panel>
            <Collapse.Panel
                header="This is panel header 3"
                itemKey="3"
                extra={
                    <Tag color="violet" style={{ margin: '0' }}>
                        Recommended
                    </Tag>
                }
            >
                <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
            </Collapse.Panel>
        </Collapse>
    );
}
