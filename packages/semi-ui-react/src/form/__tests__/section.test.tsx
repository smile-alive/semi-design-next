import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Form } from '@fibrae/semi-ui-react';

const Section = Form.Section;
const textSelector = `.${BASE_CLASS_PREFIX}-form-section-text`;

describe('Form.Label', () => {
    it('className 与 style', () => {
        const { container } = render(<Section className="sec-test" style={{ color: 'red' }} />);
        const section = container.querySelector('section.sec-test');
        expect(section).not.toBeNull();
        expect(section).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('children', () => {
        const { container } = render(
            <Form>
                <Section>
                    <Form.Input className="test" field="test" />
                </Section>
            </Form>
        );
        expect(container.querySelector('section .test')).not.toBeNull();
    });

    it('text', () => {
        const { container, rerender } = render(<Section text="semi" />);
        expect(container.querySelector(textSelector)).toHaveTextContent(/^semi$/);

        rerender(<Section text={0} />);
        expect(container.querySelector(textSelector)).toHaveTextContent(/^0$/);

        rerender(<Section text={<div data-testid="node-text">semi</div>} />);
        expect(container.querySelector(textSelector)).toContainElement(screen.getByTestId('node-text'));
    });

    it('没有 text 时不渲染空标题', () => {
        const { container } = render(<Section />);
        expect(container.querySelector('h5')).toBeNull();
    });

    it('其他属性与 ref 透传到 section 元素', () => {
        const ref = createRef<HTMLElement>();
        const { container } = render(<Section ref={ref} data-testid="sec" />);
        expect(ref.current).toBe(container.querySelector('section'));
        expect(ref.current).toHaveAttribute('data-testid', 'sec');
    });
});
