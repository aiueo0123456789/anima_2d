export class DOMsManager {
    constructor() {
        this.objectsMap = new Map();
    }

    set(object, groupID, DOM, updateFn) {
        if (!this.objectsMap.has(object)) {
            this.objectsMap.set(object, new Map());
        }
        const targetMap = this.objectsMap.get(object);
        targetMap.set(groupID, [DOM, updateFn]);
    }

    deleteGroupForDOM(group) {
        this.objectsMap.forEach((data, object) => {
            data.forEach((DOM_Fn, groupID) => {
                if (groupID == group) {
                    DOM_Fn[0].remove();
                }
            })
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
        targetMap.forEach((DOM_Fn, groupID) => {
            DOM_Fn[1](object, groupID, DOM_Fn[0]);
        });
    }
}