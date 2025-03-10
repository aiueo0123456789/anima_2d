import { isPlainObject } from "../utility.js";

export class DOMsManager {
    constructor() {
        this.objectsMap = new Map();
    }

    set(object, groupID, DOM, updateFn, others = null) {
        if (!this.objectsMap.has(object)) {
            this.objectsMap.set(object, new Map());
        }
        const targetMap = this.objectsMap.get(object);
        targetMap.set(groupID, [DOM, updateFn, others]);
    }

    getGroupInObject(object, groupID) {
        const targetMap = this.objectsMap.get(object);
        if (targetMap.has(groupID)) {
            return targetMap.get(groupID);
        }
        return null;
    }

    getDOMInObject(object, groupID) {
        const targetMap = this.objectsMap.get(object);
        if (targetMap && targetMap.has(groupID)) {
            return targetMap.get(groupID)[0];
        }
        return null;
    }

    deleteGroup(groupID) {
        this.objectsMap.forEach((data, object) => {
            const deleteData = data.get(groupID);
            if (deleteData) {
                const fn = (data) => {
                    if (data instanceof HTMLElement) {
                        data.remove();
                    } else if (isPlainObject(data)) {
                        for (const key in data) {
                            fn(data[key]);
                        }
                    } else if (Array.isArray(data)) {
                        for (const value of data) {
                            fn(value);
                        }
                    }
                }
                fn(deleteData);
                data.delete(groupID);
            }
        });
    }

    deleteObject(object) {
        if (this.objectsMap.has(object)) {
            const targetMap = this.objectsMap.get(object);
            targetMap.forEach((DOM_Fn, groupID) => {
                DOM_Fn[0].remove();
            });
            targetMap.clear();
            this.objectsMap.delete(object);
        }
    }

    update(object) {
        const targetMap = this.objectsMap.get(object);
        if (targetMap) {
            targetMap.forEach((DOM_Fn, groupID) => {
                DOM_Fn[1](object, groupID, DOM_Fn[0], DOM_Fn[2]);
            });
        }
    }

    updateGroupInObject(object, groupID) {
        const targetMap = this.objectsMap.get(object);
        if (targetMap) {
            const DOM_Fn = targetMap.get(groupID);
            if (DOM_Fn) {
                DOM_Fn[1](object, groupID, DOM_Fn[0], DOM_Fn[2]);
            }
        }
    }

    allUpdate() {
        this.objectsMap.forEach((targetMap, object) => {
            targetMap.forEach((DOM_Fn, groupID) => {
                DOM_Fn[1](object, groupID, DOM_Fn[0], DOM_Fn[2]);
            });
        });
    }
}