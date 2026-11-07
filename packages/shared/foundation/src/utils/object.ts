// compat values tolerates a null/undefined input (Object.values throws), and errors may be null from user validator
import { get as lodashGet, set as lodashSet, has as lodashHas, toPath as lodashToPath, unset as lodashUnset, values } from 'es-toolkit/compat';

type Many<T> = T | ReadonlyArray<T>;
type PropertyName = string | number | symbol;
type PropertyPath = Many<PropertyName>;

type ObjectType = Record<string, any>;

function pathToArrayElem(path: PropertyPath) {
    const pathArray = lodashToPath(path);
    const justNumber = typeof path === 'number' && pathArray.length === 1;
    return justNumber ? false : Number.isInteger(+pathArray.at(-1));
}

function isEmptyObject(target: ObjectType) {
    // Mimics JSON.stringify(target) === '{}' without calling it: form values may hold a fiberNode, which makes it
    // throw on circular structures. Functions count as objects, so they are empty like JSON.stringify dropping them.
    if (!(target !== null && (typeof target === 'object' || typeof target === 'function'))) {
        return false;
    } else {
        const valuesOfTarget = Object.values(target);
        if (!valuesOfTarget.length) {
            return true;
        } else {
            return valuesOfTarget.every((item) => typeof item === 'undefined');
        }
    }
}

function cleanup(obj: ObjectType, path: string[]) {
    if (path.length === 0) {
        return;
    }

    const target = lodashGet(obj, path);

    if (Array.isArray(target) && target.length > 0 && target.every((e) => e == null)) {
        lodashUnset(obj, path);
    } else if (isEmptyObject(target)) {
        lodashUnset(obj, path);
    }

    cleanup(obj, path.slice(0, path.length - 1));
}

export function isEmpty(object: ObjectType) {
    return values(object).length === 0;
}

export function get(object: ObjectType, path: PropertyPath) {
    return lodashGet(object, path);
}

function shallowCopy(target: any) {
    // slice keeps the holes lodash set leaves in sparse arrays
    return Array.isArray(target) ? target.slice() : { ...target };
}

// untouched subtrees keep their references; the in-place writes that follow only touch the copies
function copyPath(object: any, path: PropertyPath) {
    const root = shallowCopy(object);
    let source = object;
    let target = root;
    for (const key of lodashToPath(path).slice(0, -1)) {
        source = source?.[key];
        if (source === null || typeof source !== 'object') {
            break;
        }
        target[key] = shallowCopy(source);
        target = target[key];
    }
    return root;
}

function removeInPlace(object: any, path: PropertyPath) {
    lodashUnset(object, path);
    cleanup(object, lodashToPath(path).slice(0, -1));
}

// The writers below return a new object and leave the input untouched: form state is handed to consumers that
// compare references (memo, React Compiler)
export function remove(object: ObjectType, path: PropertyPath): ObjectType {
    const result = copyPath(object, path);
    removeInPlace(result, path);
    return result;
}

export function set(object: any, path: PropertyPath, value: any, allowEmpty?: boolean) {
    const result = copyPath(object, path);
    if (allowEmpty || value !== undefined) {
        lodashSet(result, path, value);
    } else if (get(result, path) !== undefined) {
        if (pathToArrayElem(path)) {
            // keep an array leaf as undefined so sibling indexes do not shift
            lodashSet(result, path, undefined);
            cleanup(result, lodashToPath(path).slice(0, -1));
        } else {
            removeInPlace(result, path);
        }
    }
    return result;
}

export function has(object: ObjectType, path: PropertyPath) {
    return lodashHas(object, path);
}
