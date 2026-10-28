import { Highlight } from '@fibrae/semi-ui-solid';

const sourceString = '从 Semi Design 到 Any Design  快速定义你的设计系统，并应用在设计稿和代码中';

const searchWords = [
    {
        text: 'Semi',
        style: { 'background-color': 'var(--semi-teal-7)', color: 'var(--semi-white)', padding: '4px' },
        class: 'keyword1',
    },
    {
        text: '设计系统',
        style: { 'background-color': 'var(--semi-color-primary)', color: 'var(--semi-white)', padding: '4px' },
        class: 'keyword2',
    },
    {
        text: '设计稿和代码',
        style: { 'background-color': 'var(--semi-violet-5)', color: 'var(--semi-white)', padding: '4px' },
        class: 'keyword3',
    },
];

const highlightStyle = { 'border-radius': '4px' };

export default function HighlightDemo() {
    return (
        <h2>
            <Highlight component="span" sourceString={sourceString} searchWords={searchWords} highlightStyle={highlightStyle} />
        </h2>
    );
}
