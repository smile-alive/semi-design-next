import { type JSX, createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Form, FormInput } from '..';

const Section = Form.Section;
const textSelector = `.${BASE_CLASS_PREFIX}-form-section-text`;

describe('Form.Section', () => {
    it('class 与 style', () => {
        const { container } = render(() => <Section class="sec-test" style={{ color: 'red' }} />);
        const section = container.querySelector('section.sec-test');
        expect(section).not.toBeNull();
        expect(section).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('children', () => {
        const { container } = render(() => (
            <Form>
                <Section>
                    <FormInput class="test" field="test" />
                </Section>
            </Form>
        ));
        expect(container.querySelector('section .test')).not.toBeNull();
    });

    it('text', () => {
        const [text, setText] = createSignal<JSX.Element>('semi');
        const { container } = render(() => <Section text={text()} />);
        expect(container.querySelector(textSelector)).toHaveTextContent(/^semi$/);

        setText(0);
        expect(container.querySelector(textSelector)).toHaveTextContent(/^0$/);

        setText(<div data-testid="node-text">semi</div>);
        expect(container.querySelector(textSelector)).toContainElement(screen.getByTestId('node-text'));
    });

    it('没有 text 时不渲染空标题', () => {
        const { container } = render(() => <Section />);
        expect(container.querySelector('h5')).toBeNull();
    });

    it('其他属性与 ref 透传到 section 元素', () => {
        let ref: HTMLElement | undefined;
        const { container } = render(() => <Section ref={(el) => (ref = el)} data-testid="sec" />);
        expect(ref).toBe(container.querySelector('section'));
        expect(ref).toHaveAttribute('data-testid', 'sec');
    });
});
