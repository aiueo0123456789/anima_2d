import { setParentModifierWeight, updateObject } from "./オブジェクトで共通の処理.js";

export class Children {
    constructor() {
        this.objects = [];
    }

    addChild(object) {
        this.objects.push(object);
    }

    deleteChild(object) {
        this.objects.splice(this.objects.indexOf(object), 1);
    }

    weightReset() {
        this.objects.forEach(x => {
            setParentModifierWeight(x);
        })
    }

    run() {
        this.objects.forEach(x => {
            updateObject(x);
            if (x.type == "グラフィックメッシュ") {
            } else {
                x.children.run();
            }
        })
    }
}