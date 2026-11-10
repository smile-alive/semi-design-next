<script lang="ts">
    import { Select, TextArea, type SelectValue } from '@fibrae/semi-ui-svelte';

    interface Item {
        value: string;
        label: string;
        type: number;
    }

    const list: Item[] = [
        { value: 'video', label: '短视频', type: 1 },
        { value: 'camera', label: '相机', type: 2 },
        { value: 'editing', label: '剪辑', type: 3 },
        { value: 'news', label: '资讯', type: 4 },
    ];

    let cbValue = $state<SelectValue>();
    let multipleCbValue = $state<SelectValue>();

    const onChange = (value: SelectValue) => {
        cbValue = value;
        console.log(value);
    };

    const onMultipleChange = (value: SelectValue) => {
        multipleCbValue = value;
        console.log(value);
    };
</script>

<div>
    <div>
        <Select aria-label="单选" {onChange} onChangeWithObject optionList={list} placeholder="单选" style="width: 150px" value={{ ...list[0] }} />
        <h4 id="select-on-change-with-object-single">onChange回调:</h4>
        <TextArea aria-labelledby="select-on-change-with-object-single" autosize rows={2} style="width: 320px; margin-bottom: 48px" value={JSON.stringify(cbValue)} />
    </div>
    <div>
        <Select aria-label="多选" multiple onChange={onMultipleChange} onChangeWithObject optionList={list} placeholder="多选" style="width: 320px" value={[]} />
        <h4 id="select-on-change-with-object-multiple">onChange回调:</h4>
        <TextArea aria-labelledby="select-on-change-with-object-multiple" autosize style="width: 320px" value={JSON.stringify(multipleCbValue)} />
    </div>
</div>
