import { createSignal } from 'solid-js';
import { Sidebar } from '@fibrae/semi-ai-solid';
import { Radio, RadioGroup } from '@fibrae/semi-ui-solid';

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

export default function SidebarDemo() {
    const [type, setType] = createSignal('json');

    return (
        <>
            <RadioGroup type="button" buttonSize="middle" value={type()} onChange={(e) => setType(e.target.value)} style={{ 'margin-bottom': '10px' }}>
                <Radio value="json">JSON</Radio>
                <Radio value="css">CSS</Radio>
            </RadioGroup>
            <div style={{ height: '200px', overflow: 'auto' }}>
                <CodeItem {...(type() === 'json' ? jsonProps : codeProps)} />
            </div>
        </>
    );
}
