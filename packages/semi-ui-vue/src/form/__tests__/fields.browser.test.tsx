/** @jsxImportSource vue */
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconPlus } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import { Form, FormUpload } from '..';

const prefixCls = `${BASE_CLASS_PREFIX}-upload`;

describe('Form 字段（浏览器）', () => {
    // fix #2448: inside Form.Upload the error outline of a failed picture card was hidden, so the card also draws
    // the error color as a border, kept inside its 96px box
    it('修复 #2448：FormUpload 中上传失败的图片卡片在卡片内显示错误边框', () => {
        const { container } = render(() => (
            <Form>
                {() => (
                    <FormUpload multiple accept="image/*" action="https://semi.design/upload" field="files" initValue={[{ uid: '1', name: 'dy.png', status: 'uploadFail', url: '' }]} listType="picture">
                        {() => <IconPlus size="extra-large" />}
                    </FormUpload>
                )}
            </Form>
        ));
        const card = container.querySelector(`.${prefixCls}-picture-file-card-error`) as HTMLElement;
        expect(card).not.toBeNull();
        const style = getComputedStyle(card);
        expect(style.borderTopStyle).toBe('solid');
        expect(style.borderTopWidth).toBe('1px');
        expect(style.borderTopColor).toBe(style.outlineColor);
        expect(style.borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
        const { width, height } = card.getBoundingClientRect();
        expect(width).toBe(96);
        expect(height).toBe(96);
    });
});
