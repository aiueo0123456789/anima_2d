import { hierarchy } from "../ヒエラルキー.js";
import { stateMachine } from '../main.js';
import { appendAnimationToObject } from "../オブジェクトで共通の処理.js";

function deleteA() {
    console.log("アニメーションの削除")
}

function deleteObject() {
    hierarchy.deleteObject(stateMachine.state.data.object);
    stateMachine.externalInputs["ヒエラルキーのオブジェクト選択"] = "選択解除";
}

function addObject(type) {
    hierarchy.addEmptyObject(type);
}

function addAnimation() {
    appendAnimationToObject(stateMachine.state.data.object,"名称未設定");
}

export function activeOrClear(t, bool) {
    t.classList.remove(bool ? "clearColor" : "activeColor");
    t.classList.add(bool ? "activeColor" : "clearColor");
}

class Contextmenu {
    constructor(struct) {
        this.struct = struct;
        this.tag = document.createElement("ul");
        this.tag.className = "facemenu";

        const createMenu = (target,data) => {
            const li = document.createElement("li");
            li.className = "menu";
            const button = document.createElement("button");
            button.textContent = data.id;
            if (data.targetFn) {
                button.addEventListener("click", () => {
                    data.targetFn();
                })
            }
            const children = document.createElement("ul");
            children.className = "submenu"
            li.append(button, children);
            target.append(li);
            for (const child of data.children) {
                createMenu(children, child);
            }
        }

        for (const data of struct) {
            createMenu(this.tag, data);
        }

        console.log(this.tag)
    }
}

const data = {
    "グリッド": new Contextmenu(
        [
            {id: "オブジェクト", children: [
                {id: "グラフィックメッシュ", children: [], targetFn: null},
                {id: "モディファイア", children: [], targetFn: null},
            ], targetFn: null},
            {id: "アニメーション追加", children: [], targetFn: null},
            {id: "アニメーション削除", children: [], targetFn: deleteA},
            {id: "アニメーション", children: [], targetFn: null},
        ]
    ),
    "ヒエラルキー": new Contextmenu(
        [
            {id: "オブジェクトの追加", children: [
                {id: "グラフィックメッシュ", children: [], targetFn: addObject.bind(null, "グラフィックメッシュ")},
                {id: "モディファイア", children: [], targetFn: addObject.bind(null, "モディファイア")},
                {id: "ベジェモディファイア", children: [], targetFn: addObject.bind(null, "ベジェモディファイア")},
                {id: "回転モディファイア", children: [], targetFn: addObject.bind(null, "回転モディファイア")},
                {id: "ボーンモディファイア", children: [], targetFn: addObject.bind(null, "ボーンモディファイア")},
            ], targetFn: null},
            {id: "オブジェクトの削除", children: [], targetFn: deleteObject},
        ]
    ),
    "オブジェクト": new Contextmenu(
        [
            {id: "オブジェクトの追加", children: [
                {id: "グラフィックメッシュ", children: [], targetFn: addObject.bind(null, "グラフィックメッシュ")},
                {id: "モディファイア", children: [], targetFn: addObject.bind(null, "モディファイア")},
                {id: "ベジェモディファイア", children: [], targetFn: addObject.bind(null, "ベジェモディファイア")},
                {id: "回転モディファイア", children: [], targetFn: addObject.bind(null, "回転モディファイア")},
                {id: "ボーンモディファイア", children: [], targetFn: addObject.bind(null, "ボーンモディファイア")},
            ], targetFn: null},
            {id: "オブジェクトの削除", children: [], targetFn: deleteObject},
        ]
    ),
    "アニメーション": new Contextmenu(
        [
            {id: "アニメーション追加", children: [], targetFn: addAnimation},
            {id: "アニメーション削除", children: [], targetFn: deleteA},
            {id: "アニメーション", children: [], targetFn: null},
        ]
    ),
    "アニメーションマネージャー": new Contextmenu(
        [
            {id: "マネージャー追加", children: [], targetFn: addObject.bind(null, "アニメーションマネージャー")},
            {id: "マネージャー削除", children: [], targetFn: deleteA},
        ]
    ),
    "タイムライン": new Contextmenu(
        [
            {id: "キーの削除", children: [], targetFn: null}
        ]
    ),
};

export function updateForContextmenu(type,position) {
    if (data[type]) {
        contextmenuContainer.innerHTML = "";
        contextmenuContainer.append(data[type].tag)
        contextmenuContainer.classList.remove('hidden');
        contextmenuContainer.style.left = `${position[0]}px`;
        contextmenuContainer.style.top = `${position[1]}px`;
    }
}

const contextmenuContainer = document.getElementById("contextmenu-container");

document.addEventListener('click', (event) => {
    // コンテナ内がクリックされた場合は何もしない
    if (!contextmenuContainer.contains(event.target)) {
        contextmenuContainer.classList.add('hidden');
    }
});