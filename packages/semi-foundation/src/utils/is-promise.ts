import isObject from './is-object';

export default function isPromise(value: unknown): value is PromiseLike<unknown> {
    return isObject(value) && 'then' in value && typeof value.then === 'function';
}
