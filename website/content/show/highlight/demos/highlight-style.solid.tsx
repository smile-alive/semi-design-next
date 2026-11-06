import { Highlight } from '@fibrae/semi-ui-solid';

const sourceString = '从 Semi Design 到 Any Design 快速定义你的设计系统，并应用在设计稿和代码中';
const searchWords = ['设计系统', 'Semi Design'];

const baseStyle = {
    'border-radius': '6px',
    'margin-inline': '4px',
    'padding-inline': '4px',
    color: 'var(--semi-white)',
};
const tealStyle = { ...baseStyle, 'background-color': 'var(--semi-teal-7)' };
const primaryStyle = { ...baseStyle, 'background-color': 'var(--semi-color-primary)' };

export default function HighlightDemo() {
    return (
        <>
            <h2>
                <Highlight sourceString={sourceString} searchWords={searchWords} highlightStyle={tealStyle} />
            </h2>
            <h2>
                <Highlight sourceString={sourceString} searchWords={searchWords} highlightStyle={primaryStyle} />
            </h2>
        </>
    );
}
