import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { Button } from '@fibrae/semi-ui-react';

const SEMI = `@layer semi {
    .probe-declared { --probe-declared: rgb(1, 1, 1); color: var(--probe-declared); }
    .probe-fallback { color: var(--probe-fallback, rgb(1, 1, 1)); }
    :where(.probe-where) { --probe-where: rgb(1, 1, 1); }
    .probe-where { color: var(--probe-where); }
}`;
const VARIANTS = ['declared', 'fallback', 'where'] as const;
const declarations = VARIANTS.map((variant) => `--probe-${variant}: rgb(2, 2, 2);`).join(' ');
const SCENARIOS = {
    body: `body { ${declarations} }`,
    subtree: `.app-subtree { ${declarations} }`,
    component: VARIANTS.map((variant) => `.probe-${variant} { --probe-${variant}: rgb(2, 2, 2); }`).join('\n'),
};

const styles: HTMLStyleElement[] = [];
function addStyle(css: string) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
    styles.push(style);
}

describe('组件级 CSS 变量的三种写法（CSS-051）', () => {
    afterEach(() => {
        styles.splice(0).forEach((style) => style.remove());
    });

    it.each(Object.entries(SCENARIOS))('%s 覆盖', (scenario, override) => {
        addStyle(SEMI);
        addStyle(override);
        const { container } = render(
            <div className="app-subtree">
                {VARIANTS.map((variant) => (
                    <span key={variant} className={`probe-${variant}`} />
                ))}
            </div>
        );
        const overridden = Object.fromEntries(VARIANTS.map((variant) => [variant, getComputedStyle(container.querySelector(`.probe-${variant}`)).color === 'rgb(2, 2, 2)']));
        // an own declaration beats any inherited value, so only the read-only fallback lets an ancestor win
        const fromAncestor = scenario !== 'component';
        expect(overridden).toEqual({ declared: !fromAncestor, fallback: true, where: !fromAncestor });
    });

    const ColorProbe = ({ fill }: { fill?: string[] }) => <span style={{ color: fill?.[0] }} data-testid="probe" />;
    const readPrimaryFill = () => {
        render(<Button type="tertiary" colorful theme="outline" icon={<ColorProbe />} />);
        return getComputedStyle(screen.getByTestId('probe')).color;
    };

    it('Button colorful 变量不覆盖时取默认值', () => {
        addStyle('body { --semi-color-ai-purple: rgb(3, 3, 3); }');
        expect(readPrimaryFill()).toBe('rgb(3, 3, 3)');
    });

    it.each([
        ['body', 'body { --semi-button-colorful-fill-primary: rgb(2, 2, 2); }'],
        ['组件类', '.semi-button { --semi-button-colorful-fill-primary: rgb(2, 2, 2); }'],
    ])('Button colorful 变量在 %s 上覆盖生效', (_, css) => {
        addStyle('body { --semi-color-ai-purple: rgb(3, 3, 3); }');
        addStyle(css);
        expect(readPrimaryFill()).toBe('rgb(2, 2, 2)');
    });

    it('Button 组件类不再声明 colorful 变量', () => {
        render(
            <Button type="tertiary" colorful>
                go
            </Button>
        );
        expect(getComputedStyle(screen.getByRole('button')).getPropertyValue('--semi-button-colorful-fill-primary')).toBe('');
    });
});
