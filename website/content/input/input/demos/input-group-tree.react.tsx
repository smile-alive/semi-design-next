import { InputGroup, Select, Cascader, TreeSelect } from '@fibrae/semi-ui-react';

export default function InputDemo() {
    const treeData = [
        {
            label: 'Asia',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: 'China',
                    value: 'China',
                    key: '0-0',
                    children: [
                        { label: 'Beijing', value: 'Beijing', key: '0-0-0' },
                        { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
                    ],
                },
            ],
        },
        { label: 'North America', value: 'North America', key: '1' },
    ];
    return (
        <>
            <InputGroup>
                <Select aria-label="From or to" style={{ width: 100 }} defaultValue="from">
                    <Select.Option value="from">From: </Select.Option>
                    <Select.Option value="to">To: </Select.Option>
                </Select>
                <TreeSelect style={{ width: 220 }} treeData={treeData} placeholder="Please select" />
            </InputGroup>
            <br />
            <br />
            <InputGroup>
                <Select aria-label="From or to" style={{ width: 100 }} defaultValue="from">
                    <Select.Option value="from">From: </Select.Option>
                    <Select.Option value="to">To: </Select.Option>
                </Select>
                <Cascader style={{ width: 220 }} treeData={treeData} placeholder="Please select" />
            </InputGroup>
        </>
    );
}
