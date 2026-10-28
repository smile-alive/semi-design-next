import isObject from './is-object';

export default function isPromise(value: any) {
    return isObject(value) && 'then' in value && typeof value.then === 'function';
}
