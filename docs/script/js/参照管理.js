import { hierarchy } from "./ヒエラルキー.js";

function isPlainObject(obj) {
    return obj instanceof Object && Object.getPrototypeOf(obj) === Object.prototype;
}

export function logAccess(obj) {
    console.log("参照:", obj);
    console.log(window.hierarchy)

    function ReferencesRoop(obj, target, root, visitedSet) {
        // console.log(obj, target, root, visitedSet)
        if (obj === null || obj === undefined) return;

        // 循環参照防止
        if (visitedSet.has(obj)) return;
        visitedSet.add(obj);

        // 配列の場合
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                const newRoot = `${root}/配列-${i}`;
                if (obj[i] === target) {
                    console.log(newRoot);
                } else {
                    ReferencesRoop(obj[i], target, newRoot, visitedSet);
                }
            }
            return;
        }

        // Mapの場合
        if (obj instanceof Map) {
            for (const [key, value] of obj.entries()) {
                const newRoot = `${root}/Map-${key}`;
                if (value === target || key === target) {
                    console.log(newRoot);
                } else {
                    ReferencesRoop(value, target, newRoot, visitedSet);
                }
            }
            return;
        }

        // オブジェクト（連想配列）の場合
        if (typeof obj === "object") {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const newRoot = `${root}/連想配列-${key}`;
                    if (obj[key] === target) {
                        console.log(newRoot);
                    } else {
                        ReferencesRoop(obj[key], target, newRoot, visitedSet);
                    }
                }
            }
        }
    }

    // ReferencesRoop(window, obj, "window", new Set());
    ReferencesRoop(hierarchy, obj, "hierarchy", new Set());
}

export class ReferenceManager {
    constructor(object) {
        this.referenceSource = []; // 自分を参照する
        this.referenceTarget = []; // 自分が参照する
        this.object = object; // 自分
    }

    addTarget(target) {
        if ("referenceManager" in target) {
            this.referenceTarget.push(target.referenceManager);
        } else {
            console.warn("参照先はReferenceManagerがありません",target);
        }
    }

    addSource(source) {
        if ("referenceManager" in source) {
            this.referenceSource.push(source.referenceManager);
        } else {
            console.warn("参照先はReferenceManagerがありません",source);
        }
    }

    clearReferences(obj, target) {
        if (obj === null || obj === undefined) return;

        // 配列の場合
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                if (obj[i] === target) {
                    obj[i] = null;
                } else {
                    clearReferences(obj[i], target);
                }
            }
            return;
        }

        // Mapの場合
        if (obj instanceof Map) {
            for (const [key, value] of obj.entries()) {
                if (value === target) {
                    obj.set(key, null);
                } else {
                    clearReferences(value, target);
                }
            }
            return;
        }

        // オブジェクト（連想配列）の場合
        if (typeof obj === "object") {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (obj[key] === target) {
                        obj[key] = null;
                    } else {
                        if (typeof obj[key] === "fu" ) {
                            clearReferences(obj[key], target);
                        }
                    }
                }
            }
        }
    }

    deleteTarget(target) {
        let object = this.referenceTarget.splice(this.referenceTarget.indexOf(target),1);
        // objectの全ての変数などを確認して参照があったらnullに置き換える処理
        clearReferences(this.object, object);
    }

    deleteSource(source) {
        let object = this.referenceSource.splice(this.referenceSource.indexOf(source),1);
        // objectの全ての変数などを確認して参照があったらnullに置き換える処理
        clearReferences(object, this.object);
    }

    delete() {
        this.referenceTarget.forEach(target => {
            target.deleteSource(this.object);
        });
        this.referenceSource.forEach(source => {
            source.deleteTarget(this.object);
        });
        this.object = null;
    }
}