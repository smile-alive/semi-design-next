import { Button, JsonViewer, type JsonViewerElement } from '@fibrae/semi-ui-solid';

const data = `{
  "name": "Semi",
  "version": "0.0.0"
}`;

export default function JsonViewerDemo() {
    let jsonViewer: JsonViewerElement | undefined;

    return (
        <div>
            <Button onClick={() => console.log(jsonViewer?.format())}>格式化</Button>
            <div style={{ 'margin-bottom': '16px', 'margin-top': '16px' }}>
                <JsonViewer ref={(node) => (jsonViewer = node)} height={100} width={700} value={data} options={{ formatOptions: { tabSize: 4, insertSpaces: true, eol: '\n' } }} />
            </div>
        </div>
    );
}
