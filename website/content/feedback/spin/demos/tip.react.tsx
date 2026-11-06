import { Spin } from '@fibrae/semi-ui-react';

export default function SpinDemo() {
    return (
        <div>
            <Spin tip="加载中...">
                <div
                    style={{
                        border: '1px solid var(--semi-color-primary)',
                        borderRadius: '4px',
                        paddingInlineStart: '8px',
                    }}
                >
                    <p>这里是一些文字。</p>
                    <p>还有更多文字正在路上。</p>
                </div>
            </Spin>
        </div>
    );
}
