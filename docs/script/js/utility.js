export function isPlainObject(obj) {
    return obj instanceof Object && Object.getPrototypeOf(obj) === Object.prototype;
}

export function indexOfSplice(array, deleteTarget) {
    array.splice(array.indexOf(deleteTarget), 1);
}