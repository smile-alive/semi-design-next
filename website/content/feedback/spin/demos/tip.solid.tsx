import { Spin } from '@fibrae/semi-ui-solid';

export default function SpinDemo() {
    return (
        <div>
            <Spin tip="I am loading...">
                <div
                    style={{
                        border: '1px solid var(--semi-color-primary)',
                        'border-radius': '4px',
                        'padding-left': '8px',
                    }}
                >
                    <p>Here are some texts.</p>
                    <p>And more texts on the way.</p>
                </div>
            </Spin>
        </div>
    );
}
