import { CodeHighlight } from '@fibrae/semi-ui-react';

export default function CodeHighlightDemo() {
    return (
        <CodeHighlight
            language="css"
            code={`.grid {
    .semi-row,
    .semi-row-flex {
        text-align: center;
        .semi-col {
            min-height: 30px;
            line-height: 30px;
            background: var(--semi-color-primary-light-default);
            outline: 1px solid var(--semi-color-primary-light-active);
        }
    }
}
`}
        />
    );
}
