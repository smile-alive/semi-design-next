export default function shallowEqualObjects(objA: { [key: string]: any }, objB: { [key: string]: any }) {
    if (objA === objB) {
        return true;
    }

    if (!objA || !objB) {
        return false;
    }

    const aKeys = Object.keys(objA);
    return aKeys.length === Object.keys(objB).length && aKeys.every((key) => Object.hasOwn(objB, key) && Object.is(objA[key], objB[key]));
}
