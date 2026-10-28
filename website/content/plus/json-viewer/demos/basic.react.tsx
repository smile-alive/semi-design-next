import { JsonViewer } from '@fibrae/semi-ui-react';
const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;
export default function JsonViewerDemo() {
    return (
        <div style={{ marginBottom: 16 }}>
            <JsonViewer height={100} width={700} value={data} />
        </div>
    );
}
