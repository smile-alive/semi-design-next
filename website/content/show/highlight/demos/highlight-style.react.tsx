import { Highlight } from '@fibrae/semi-ui-react';

export default function HighlightDemo() {
    const sourceString = '从 Semi Design 到 Any Design 快速定义你的设计系统，并应用在设计稿和代码中';
    const searchWords = ['设计系统', 'Semi Design'];

    return (
        <>
            <h2>
                <Highlight
                    sourceString={sourceString}
                    searchWords={searchWords}
                    highlightStyle={{
                        borderRadius: 6,
                        marginLeft: 4,
                        marginRight: 4,
                        paddingLeft: 4,
                        paddingRight: 4,
                        backgroundColor: 'var(--semi-teal-7)',
                        color: 'var(--semi-white)',
                    }}
                />
            </h2>
            <h2>
                <Highlight
                    sourceString={sourceString}
                    searchWords={searchWords}
                    highlightStyle={{
                        borderRadius: 6,
                        marginLeft: 4,
                        marginRight: 4,
                        paddingLeft: 4,
                        paddingRight: 4,
                        backgroundColor: 'var(--semi-color-primary)',
                        color: 'var(--semi-white)',
                    }}
                />
            </h2>
        </>
    );
}
