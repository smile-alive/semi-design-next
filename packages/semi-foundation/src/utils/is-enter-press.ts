import { ENTER_KEY } from './key-code';

export default function isEnterPress<T extends { key: string }>(e: T) {
    return e?.key === ENTER_KEY;
}
