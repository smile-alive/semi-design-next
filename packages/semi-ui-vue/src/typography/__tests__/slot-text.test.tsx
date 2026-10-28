/** @jsxImportSource vue */
import { createCommentVNode, createTextVNode, defineComponent } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import slotNodes from '../../_base/slot-nodes';
import slotText from '../slot-text';

const Box = defineComponent({
    setup:
        (_, { slots }) =>
        () => <div>{slots.default?.()}</div>,
});

describe('slotText', () => {
    it('拼接文本节点与元素内的字符串、数组子节点，跳过注释', () => {
        const nodes = slotNodes([
            createTextVNode('a'),
            <b>b</b>,
            <p>
                {createTextVNode('c')}
                <i>d</i>
            </p>,
            createCommentVNode('v-if'),
            <br />,
        ]);
        expect(slotText(nodes)).toEqual({ text: 'abcd', pure: true });
    });

    it('组件节点不计入文本，pure 为 false', () => {
        expect(slotText(slotNodes([createTextVNode('a'), <Box>{() => 'inner'}</Box>]))).toEqual({
            text: 'a',
            pure: false,
        });
    });

    it('去掉首尾空白，保留中间空白', () => {
        expect(slotText(slotNodes([createTextVNode(' only  text ')])).text).toBe('only  text');
    });

    it('h() 子节点中的字符串、数字与嵌套数组计入文本', () => {
        const nodes = slotNodes([
            <p>
                a{1}
                {null}
                {[<b>2</b>]}
            </p>,
        ]);
        expect(slotText(nodes)).toEqual({ text: 'a12', pure: true });
    });

    it('带 format 时逐段格式化', () => {
        const format = (value: string) => `[${value}]`;
        expect(slotText(slotNodes([createTextVNode('1'), <b>2</b>, <p>{createTextVNode('3')}</p>]), format).text).toBe('[1][2][3]');
    });
});
