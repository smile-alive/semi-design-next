import { JsonViewer } from '@fibrae/semi-ui-solid';

const data = `{
    "name": "Semi",
    "version": "0.0.0",
    "description": "Semi Design is a design system that defines a set of mid_back design and front_end basic components."
}`;

export default function JsonViewerDemo() {
    return (
        <div style={{ 'margin-bottom': '16px' }}>
            <JsonViewer height={120} width={700} value={data} options={{ autoWrap: true }} />
        </div>
    );
}
