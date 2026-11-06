import { CodeHighlight } from '@fibrae/semi-ui-react';

const code = `.grid {
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
`;

export default function CodeHighlightDemo() {
    return <CodeHighlight code={code} language="css" />;
}
