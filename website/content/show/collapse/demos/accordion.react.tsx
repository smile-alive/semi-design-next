import { Collapse } from '@fibrae/semi-ui-react';

export default function CollapseDemo() {
    return (
        <Collapse accordion>
            <Collapse.Panel header="This is panel header 1" itemKey="1">
                <p>Hi, this is the docsite of Semi Design Next. </p>
            </Collapse.Panel>
            <Collapse.Panel header="This is panel header 2" itemKey="2">
                <p>Hi, this is the docsite of Semi Design Next. </p>
            </Collapse.Panel>
            <Collapse.Panel header="This is panel header 3" itemKey="3">
                <p>Hi, this is the docsite of Semi Design Next. </p>
            </Collapse.Panel>
        </Collapse>
    );
}
