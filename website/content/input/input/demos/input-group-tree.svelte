<script lang="ts">
    import { Cascader, InputGroup, Select, TreeSelect } from '@fibrae/semi-ui-svelte';

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
    const optionList = [
        { value: 'from', label: 'From: ' },
        { value: 'to', label: 'To: ' },
    ];
    const selectStyle = 'width: 100px';
    const treeStyle = 'width: 220px';
</script>

<InputGroup>
    <Select aria-label="From or to" {optionList} style={selectStyle} value="from" />
    <TreeSelect placeholder="Please select" style={treeStyle} {treeData} />
</InputGroup>
<br />
<br />
<InputGroup>
    <Select aria-label="From or to" {optionList} style={selectStyle} value="from" />
    <Cascader placeholder="Please select" style={treeStyle} {treeData} />
</InputGroup>
