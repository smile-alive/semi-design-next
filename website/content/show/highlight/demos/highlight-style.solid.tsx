import { Highlight } from '@fibrae/semi-ui-solid';

const sourceString = '从 Semi Design 到 Any Design 快速定义你的设计系统，并应用在设计稿和代码中';
const searchWords = ['设计系统', 'Semi Design'];

const tealStyle = {
    'border-radius': '6px',
    'margin-left': '4px',
    'margin-right': '4px',
    'padding-left': '4px',
    'padding-right': '4px',
    'background-color': 'var(--semi-teal-7)',
    color: 'var(--semi-white)',
};

const primaryStyle = {
    'border-radius': '6px',
    'margin-left': '4px',
    'margin-right': '4px',
    'padding-left': '4px',
    'padding-right': '4px',
    'background-color': 'var(--semi-color-primary)',
    color: 'var(--semi-white)',
};

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
