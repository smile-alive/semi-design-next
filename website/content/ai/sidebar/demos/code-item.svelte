<script lang="ts">
    import { Sidebar } from '@fibrae/semi-ai-svelte';
    import { Radio, RadioGroup, type RadioValue } from '@fibrae/semi-ui-svelte';

    const { CodeItem } = Sidebar;

    const code = `.semi-animation-react-demo-auto {
    button {
        height: 50px;
        border: 0;
        cursor: pointer !important;
        background: #777;
        color: white;
        outline: none;
        -webkit-appearance: none;
    }

    button:hover {
        background: #878787;
    }

    .auto-main {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: auto 1fr;
        background: #575757;
    }

    .content {
        grid-column: span 3;
    }

    .item {
        background: indianred;
        width: 100%;
        overflow: hidden;
        color: white;
    }

    .item p {
        margin: 0;
        padding: 10px;
    }
}
`;

    const json = `{
    "axisX": {
        "title": {
            "visible": false,
            "position": "center"
        },
        "label": {
            "visible": true,
            "style": {
                "fontSize": 12,
                "fontWeight": 400,
                "lineHeight": 16,
                "fontFamily": [
                    "Inter"
                ],
                "fill": "rgba(0, 0, 0, 0.47843137254901963)"
            },
            "space": 12
        }
    }
}`;

    const codeProps = {
        content: code,
        language: 'css',
    };

    const jsonProps = {
        isJson: true,
        content: json,
    };

    let type = $state<RadioValue | undefined>('json');
    const itemProps = $derived(type === 'json' ? jsonProps : codeProps);
</script>

<RadioGroup bind:value={type} buttonSize="middle" style="margin-bottom: 10px" type="button">
    <Radio value="json">JSON</Radio>
    <Radio value="css">CSS</Radio>
</RadioGroup>
<div style="height: 200px; overflow: auto">
    <CodeItem {...itemProps} />
</div>
