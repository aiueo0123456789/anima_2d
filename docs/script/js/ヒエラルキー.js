import { GraphicMesh } from "./グラフィックメッシュ.js";
import { Modifier } from "./モディファイア.js";
import { LineModifier } from "./ベジェモディファイア.js";
import { RotateModifier } from "./回転モディファイア.js";
import { AnimationManager } from "./アニメーションマネージャー.js";
import { updateObject,setParentModifierWeight, searchAnimation } from "./オブジェクトで共通の処理.js";
import { managerForDOMs, updateDataForUI } from "./グリッド/制御.js";
import { VerticesAnimation, RotateAnimation } from "./アニメーション.js";
import { renderingParameters } from "./レンダリングパラメーター.js";
import { BoneModifier } from "./ボーンモディファイア.js";

class Hierarchy {
    constructor() {
        this.animationManagers = [];
        this.modifiers = [];
        this.lineModifiers = [];
        this.rotateModifiers = [];
        this.graphicMeshs = [];
        this.boneModifiers = [];
        this.surface = [];
        this.renderingOrder = [];
        this.allObject = [];
    }

    // 全てのオブジェクトをgc対象にしてメモリ解放
    destroy() {
        this.renderingOrder.length = 0;
        this.allObject.forEach(object => {
            object.destroy();
        });
        this.graphicMeshs.length = 0;
        this.modifiers.length = 0;
        this.lineModifiers.length = 0;
        this.rotateModifiers.length = 0;
        this.animationManagers.length = 0;
        this.allObject.length = 0;
        this.surface.length = 0;
    }

    searchObject(object) {
        if (object.type == "グラフィックメッシュ") {
            return [this.graphicMeshs, this.graphicMeshs.indexOf(object)];
        } else if (object.type == "モディファイア") {
            return [this.modifiers, this.modifiers.indexOf(object)];
        } else if (object.type == "ベジェモディファイア") {
            return [this.lineModifiers, this.lineModifiers.indexOf(object)];
        } else if (object.type == "回転モディファイア") {
            return [this.rotateModifiers, this.rotateModifiers.indexOf(object)];
        } else if (object.type == "アニメーションマネージャー") {
            return [this.animationManagers, this.animationManagers.indexOf(object)];
        }
    }

    deleteObject(object) {
        this.allObject.splice(this.allObject.indexOf(object),1);
        const [array, indexe] = this.searchObject(object);
        array.splice(indexe, 1);
        this.deleteHierarchy(object);
        object.destroy();
    }

    getSaveData() {
        const result = []; // [[親の情報: [name,type], 自分の情報: [name,type]],...]
        this.graphicMeshs.forEach(graphicMesh => {
            if (graphicMesh.parent == "") {
                result.push([["", ""], [graphicMesh.name, graphicMesh.type]]);
            } else {
                result.push([[graphicMesh.parent.name, graphicMesh.parent.type], [graphicMesh.name, graphicMesh.type]]);
            }
        });
        this.modifiers.forEach(modifier => {
            if (modifier.parent == "") {
                result.push([["", ""], [modifier.name, modifier.type]]);
            } else {
                result.push([[modifier.parent.name, modifier.parent.type], [modifier.name, modifier.type]]);
            }
        });
        this.lineModifiers.forEach(modifier => {
            if (modifier.parent == "") {
                result.push([["", ""], [modifier.name, modifier.type]]);
            } else {
                result.push([[modifier.parent.name, modifier.parent.type], [modifier.name, modifier.type]]);
            }
        });
        this.rotateModifiers.forEach(modifier => {
            if (modifier.parent == "") {
                result.push([["", ""], [modifier.name, modifier.type]]);
            } else {
                result.push([[modifier.parent.name, modifier.parent.type], [modifier.name, modifier.type]]);
            }
        });
        return result;
    }

    updateRenderingOrder(fineness) {
        const createEmptyArray = (length) => {
            const result = [];
            for (let i = 0; i < length; i ++) {
                result.push([]);
            }
            return result;
        }
        const supportFn = (graphicMeshs) => {
            const belongChunk = Math.floor(graphicMeshs.zIndex / chunkRate);
            for (let i = 0; i < chunks[belongChunk].length; i ++) {
                if (chunks[belongChunk][i][1] > graphicMeshs.zIndex) {
                    chunks[belongChunk].splice(i,0,[graphicMeshs, graphicMeshs.zIndex]);
                    return ;
                }
            }
            chunks[belongChunk].push([graphicMeshs, graphicMeshs.zIndex]);
            return ;
        }
        const chunkRate = 1000 / fineness;
        const chunks = createEmptyArray(fineness);
        this.graphicMeshs.forEach(graphicMesh => {
            supportFn(graphicMesh);
        });
        this.renderingOrder.length = 0;
        for (const datas of chunks) {
            for (const data of datas) {
                this.renderingOrder.push(data[0]);
            }
        }
    }

    searchObjectFromName(name, type) {
        if (type == "グラフィックメッシュ") {
            for (const graphicMesh of this.graphicMeshs) {
                if (graphicMesh.name == name) return graphicMesh;
            }
            console.warn("グラフィックメッシュが見つかりませんでした")
        } else if (type == "モディファイア") {
            for (const modifier of this.modifiers) {
                if (modifier.name == name) return modifier;
            }
            console.warn("モディファイアが見つかりませんでした")
        } else if (type == "ベジェモディファイア") {
            for (const modifier of this.lineModifiers) {
                if (modifier.name == name) return modifier;
            }
            console.warn("ベジェモディファイアが見つかりませんでした")
        } else if (type == "回転モディファイア") {
            for (const modifier of this.rotateModifiers) {
                if (modifier.name == name) return modifier;
            }
            console.warn("回転モディファイアが見つかりませんでした")
        } else if (type == "ボーンモディファイア") {
            for (const modifier of this.boneModifiers) {
                if (modifier.name == name) return modifier;
            }
            console.warn("ボーンモディファイアが見つかりませんでした")
        } else if (type == "アニメーションマネージャー") {
            for (const anmationManager of this.animationManagers) {
                if (anmationManager.name == name) return anmationManager;
            }
            console.warn("アニメーションマネージャーが見つかりませんでした")
        }
        return null;
    }

    setAnimationManagerLink(animationManager, animationKey) { // アニメーションマネージャーとアニメーションを関係付ける
        this.deleteAnimationManagerLink(animationKey); // 前に関連付けられていたアニメーションマネージャーとの関係を切る
        animationManager.containedAnimations.push(animationKey);
        animationKey.belongAnimationManager = animationManager;
    }

    deleteAnimationManagerLink(deleteAnimationKey) { // 関連付けられていたアニメーションマネージャーとの関係を切る
        if (!deleteAnimationKey.belongAnimationManager) return ;
        const resource = deleteAnimationKey.belongAnimationManager.containedAnimations;
        resource.splice(resource.indexOf(deleteAnimationKey), 1);
        deleteAnimationKey.belongAnimationManager = null;
    }

    findUnusedName(name) {
        if (name in this.modifiers || name in this.graphicMeshs) {
            let run = true;
            let count = 0;
            while (run) {
                count ++;
                if (name + count in this.modifiers) {
                } else if (name + count in this.graphicMeshs) {
                } else {
                    run = false;
                }
            }
            return name + count;
        } else {
            return name;
        }
    }

    async setSaveObject(data) { // オブジェクトの追加
        let object;
        if (!data.type || data.type == "グラフィックメッシュ") {
            object = new GraphicMesh(data.name);
            await object.init(data);
            this.graphicMeshs.push(object);
            this.renderingOrder.push(object);
        } else if (data.type == "モディファイア") {
            object = new Modifier(data.name);
            object.init(data);
            this.modifiers.push(object);
        } else if (data.type == "回転モディファイア") {
            object = new RotateModifier(data.name);
            object.init(data);
            this.rotateModifiers.push(object);
        } else if (data.type == "ベジェモディファイア") {
            object = new LineModifier(data.name);
            object.init(data);
            this.lineModifiers.push(object);
        } else if (data.type == "アニメーションマネージャー" || data.type == "am") {
            object = new AnimationManager(data.name);
            object.init(data);
            this.animationManagers.push(object);
        }
        this.allObject.push(object);
        return object;
    }

    addEmptyObject(type) {
        let object;
        if (type == "アニメーションマネージャー") {
            updateDataForUI["アニメーションマネージャー"] = true;
            object = new AnimationManager("名称未設定");
            this.animationManagers.push(object);
        } else {
            updateDataForUI["オブジェクト"] = true;
            if (type == "グラフィックメッシュ") {
                object = new GraphicMesh("名称未設定");
                this.graphicMeshs.push(object);
            } else if (type == "モディファイア") {
                object = new Modifier("名称未設定");
                this.modifiers.push(object);
            } else if (type == "回転モディファイア") {
                object = new RotateModifier("名称未設定");
                this.rotateModifiers.push(object);
            } else if (type == "ベジェモディファイア") {
                object = new LineModifier("名称未設定");
                this.lineModifiers.push(object);
            } else if (type == "ボーンモディファイア") {
                object = new BoneModifier("名称未設定");
                this.boneModifiers.push(object);
            }
            this.addHierarchy("", object);
        }
        this.allObject.push(object);
    }

    changeObjectName(object, newName) {
        object.name = newName;
        if (object.type == "アニメーションマネージャー") {
            updateDataForUI["アニメーションマネージャー"] = true;
        } else {
            updateDataForUI["ヒエラルキー"] = true;
            updateDataForUI["オブジェクト"] = true;
            updateDataForUI["インスペクタ"] = true;
        }
    }

    setHierarchy(setData) {
        for (const [[parentName, parentType], [name, type]] of setData) {
            const parent = parentName == "" ? "" : this.searchObjectFromName(parentName, parentType);
            const child = this.searchObjectFromName(name, type);
            this.addHierarchy(parent, child);
        }
        setData = null;
    }

    addHierarchy(parentObject, addObject) { // ヒエラルキーに追加
        updateDataForUI["ヒエラルキー"] = true;
        if (parentObject == "") {
            this.surface.push(addObject);
            addObject.parent = "";
        } else {
            parentObject.children.addChild(addObject);
            addObject.parent = parentObject;
            setParentModifierWeight(addObject); // モディファイアの適応
        }
    }

    sortHierarchy(targetObject, object) { // ヒエラルキーの並び替え
        this.deleteHierarchy(object);
        if (targetObject == "") {
            this.surface.push(object);
            object.parent = "";
        } else {
            targetObject.children.addChild(object);
            object.parent = targetObject;
            setParentModifierWeight(object); // モディファイアの適応
        }
    }

    deleteHierarchy(object) { // ヒエラルキーから削除
        updateDataForUI["ヒエラルキー"] = true;
        if (object.parent) {
            object.parent.children.deleteChild(object);
        } else {
            this.surface.splice(this.surface.indexOf(object), 1);
        }
    }

    runHierarchy(useAnimationManager = true) { // 伝播の実行
        this.surface.forEach(x => {
            updateObject(x);
            x.children?.run();
        })
    }
}

// export const hierarchy = new Hierarchy();
export var hierarchy = new Hierarchy();