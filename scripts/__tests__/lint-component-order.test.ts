import { describe, expect, it } from 'vitest';
import { reactComponentOrder } from '../../lint/react/component-order.ts';
import { fixComponents } from '../lint-component-order.ts';

const fix = (source: string) => fixComponents('demo.tsx', source, reactComponentOrder.calls);

describe('lint-component-order --fix', () => {
    it('moves statements into group order with a blank line between groups', () => {
        const source = `export function Demo(props) {
    useEffect(() => {}, []);
    const [open, setOpen] = useState(false);
    const label = useMemo(() => String(open), [open]);
    return <div>{label}</div>;
}
`;
        expect(fix(source)).toBe(`export function Demo(props) {
    const [open, setOpen] = useState(false);

    const label = useMemo(() => String(open), [open]);

    useEffect(() => {}, []);

    return <div>{label}</div>;
}
`);
    });

    it('keeps a statement below a binding it reads even when its group comes first', () => {
        const source = `export function Demo(props) {
    const [key] = useState('a');

    const theme = useContext(contexts[key]);

    return <div>{theme}</div>;
}
`;
        expect(fix(source)).toBe(source);
    });

    it('does not move statements across a barrier', () => {
        const source = `export function Demo(props) {
    useEffect(() => {}, []);

    if (!props.visible) return null;

    const [open] = useState(false);

    return <div>{open}</div>;
}
`;
        expect(fix(source)).toBe(source);
    });

    it('leaves functions that are not components alone', () => {
        const source = `export function helper() {
    useEffect(() => {}, []);
    const [open] = useState(false);
    return open;
}
`;
        expect(fix(source)).toBe(source);
    });
});
