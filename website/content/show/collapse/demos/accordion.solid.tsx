import { Collapse } from '@fibrae/semi-ui-solid';

export default function CollapseDemo() {
    return (
        <Collapse accordion>
            <Collapse.Panel header="This is panel header 1" itemKey="1">
                <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
            </Collapse.Panel>
            <Collapse.Panel header="This is panel header 2" itemKey="2">
                <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
            </Collapse.Panel>
            <Collapse.Panel header="This is panel header 3" itemKey="3">
                <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
            </Collapse.Panel>
        </Collapse>
    );
}
