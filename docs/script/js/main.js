import { hierarchy } from './ヒエラルキー.js';
import { RenderObjectManager } from './レンダー.js';

import { createGridsObject,gridUpdate  } from "./グリッド/grid.js";
import { GridInterior, EditorPreference, updateDataForUI, updateForUI, View } from "./グリッド/制御.js";
import { StateMachine } from './状態遷移.js';
import { renderingParameters } from './レンダリングパラメーター.js';
import { logAccess } from './参照管理.js';
import { updateObjectFromAnimation } from './オブジェクトで共通の処理.js';

// 構造の作成
const layout =
    {id: "main", type: "w", widthOrHeight: 900, children: [
        {id: "c1", type: "h", widthOrHeight: 500, children: [
            {id: "render-toolbar", type: "", children: []},
            {id: "ui2", type: "w", widthOrHeight: 600, children: [
                {id: "ui2_0", type: "", children: []},
                {id: "ui2_1", type: "", children: []},
            ]},
        ]},
        {id: "ui1", type: "h", widthOrHeight: 400, children: [
            {id: "ui1_0", type: "", children: []},
            {id: "ui1_1", type: "", children: []},
        ]},
    ]}
;

// 構造からグリッドオブジェクトを作成
createGridsObject(null, layout);

// appをリセットしてグリッドオブジェクトを表示
const appDiv = document.getElementById("app");
appDiv.innerHTML = "";
gridUpdate("app");

const renderAndToolbar = document.getElementById("render-toolbar");

const ui1_0 = document.getElementById("ui1_0");

const ui1_1 = document.getElementById("ui1_1");

const ui2_0 = document.getElementById("ui2_0");
const ui2_1 = document.getElementById("ui2_1");

export const toolbar = new EditorPreference();
export const stateMachine = new StateMachine();
export const renderObjectManager = new RenderObjectManager();
new GridInterior(ui1_0, "ヒエラルキー");
new GridInterior(ui1_1, "プロパティ");
new GridInterior(ui2_0, "タイムライン");
new GridInterior(ui2_1, "インスペクタ");

export const keysDown = {};
let projectName = "名称未設定";
const projectNameInputTag = document.getElementById("projectName-input");
let loadData = null;

export let activeView = new View(renderAndToolbar);;
export function activeViewUpdate(view) {
    activeView = view;
}

async function init() {
    hierarchy.destroy();
    for (const data of loadData.modifiers) {
        await hierarchy.setSaveObject(data,"");
    }
    for (const data of loadData.lineModifiers) {
        await hierarchy.setSaveObject(data,"");
    }
    for (const data of loadData.rotateModifiers) {
        await hierarchy.setSaveObject(data,"");
    }
    for (const data of loadData.graphicMeshs) {
        await hierarchy.setSaveObject(data,"");
    }
    for (const data of loadData.animationManager) {
        hierarchy.setSaveObject(data,"");
    }
    hierarchy.addEmptyObject("ボーンモディファイア");
    hierarchy.setHierarchy(loadData.hierarchy);
    loadData = null;
    Object.keys(updateDataForUI).forEach(key => {
        updateDataForUI[key] = true;
    });
    logAccess(hierarchy.graphicMeshs[1]);
    update();
}

function update() {
    if (loadData) {
        init();
    } else {
        stateMachine.stateUpdate();
        // 表示順番の再計算
        hierarchy.updateRenderingOrder(100);
        if (renderingParameters.isReplay) {
            // 今のタイムラインのフレームを適応
            for (const object of hierarchy.animationManagers) {
                object.keyframe.update(renderingParameters.keyfarameCount);
            }
        }
        // アニメーションマネージャーの適応
        for (const animtionManager of hierarchy.animationManagers) {
            animtionManager.update();
        }
        hierarchy.runHierarchy();
        // 編集中のobjectを特別処理
        if (stateMachine.state.data.animation) {
            // console.log("特別処理")
            updateObjectFromAnimation(stateMachine.state.data.object, stateMachine.state.data.animation);
        }
        for (const object of hierarchy.allObject) {
            object.isChange = false;
        }
        updateForUI();
        renderingParameters.updateKeyfarameCount();
        requestAnimationFrame(update);
    }
}

update();

// キーのダウンを検知
document.addEventListener('keydown',function(event) {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    console.log(event.key,"down")
    if (isCtrlOrCmd && event.key === 'z') {
        if (event.shiftKey) {
            keysDown["redo"] = true;
        } else {
            keysDown["undo"] = true;
        }
        event.preventDefault(); // デフォルトの動作を防ぐ場合
    } else if (event.key == "s") {
        save();
        event.preventDefault(); // デフォルトの動作を防ぐ場合
    } else {
        keysDown[event.key] = true;
        if (event.key === "Tab" || event.key === "Shift" || event.key === "Meta") {
            // デフォルト動作を無効化
            event.preventDefault();
            console.log(event.key,"のデフォルト動作を無効化しました");
        }
    }
});

// キーのアップを検知
document.addEventListener('keyup',function(event) {
    keysDown[event.key] = false;
    console.log(event.key,"up")
});

async function save() {
    // JSONデータを作成
    const data = {
        hierarchy: hierarchy.getSaveData(),
        graphicMeshs: await Promise.all(
            hierarchy.graphicMeshs.map(graphicMeshs => {
                return graphicMeshs.getSaveData(); // Promise を返す
            })
        ),
        modifiers: await Promise.all(
            hierarchy.modifiers.map(modifier => {
                return modifier.getSaveData(); // Promise を返す
            })
        ),
        lineModifiers: await Promise.all(
            hierarchy.lineModifiers.map(modifier => {
                return modifier.getSaveData(); // Promise を返す
            })
        ),
        rotateModifiers: await Promise.all(
            hierarchy.rotateModifiers.map(modifier => {
                return modifier.getSaveData(); // Promise を返す
            })
        ),
        boneModifiers: await Promise.all(
            hierarchy.boneModifiers.map(modifier => {
                return modifier.getSaveData(); // Promise を返す
            })
        ),
        animationManager: await Promise.all(
            hierarchy.animationManagers.map(animationManager => {
                return animationManager.getSaveData(); // Promise を返す
            })
        ),
    };

    // JSONデータを文字列化
    const jsonString = JSON.stringify(data, null, 2);

    // Blobを作成
    const blob = new Blob([jsonString], { type: "application/json" });

    // ダウンロード用のリンクを作成
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${projectName}.json`;

    // リンクをクリックしてダウンロードを開始
    a.click();

    // メモリ解放
    URL.revokeObjectURL(a.href);
}

// セーブ
document.getElementById("save-btn").addEventListener("click", () => {
    save();
});

document.getElementById("open-btn").addEventListener("change", async (event) => {
    const file = event.target.files[0]; // 選択したファイルを取得
    if (file && file.type === "application/json") {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                // JSONの内容をパースする
                projectName = file.name.split(".")[0];
                projectNameInputTag.value = projectName;
                loadData = JSON.parse(e.target.result);
            } catch (error) {
                console.error("JSONの解析に失敗しました:", error);
            }
        };

    reader.onerror = function() {
        console.error("ファイルの読み込みに失敗しました");
    };

      // ファイルをテキストとして読み込む
    reader.readAsText(file);
    } else {
        console.error("選択したファイルはJSONではありません");
    }
});

projectNameInputTag.addEventListener("change", async (event) => {
    projectName = event.target.value;
});