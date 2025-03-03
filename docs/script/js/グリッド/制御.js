import { v_u_f_u, v_u_u } from "../GPUObject.js";
import { keysDown, activeViewUpdate, toolbar, activeView } from "../main.js";
import { GPU } from "../webGPU.js";
import { Camera } from "../カメラ.js";
import { updateForContextmenu } from "../コンテキストメニュー/制御.js";
import { vec2 } from "../ベクトル計算.js";
import { renderingParameters } from "../レンダリングパラメーター.js";
import { ConvertCoordinate } from "../座標の変換.js";
import { Select } from "../選択.js";
import { ResizerForDOM } from "./resizer.js";
import { DOMsManager } from "./UIの更新管理.js";
import { displayAnimationKey } from "./アニメーションキーの表示.js";
import { displayAnimationManager } from "./アニメーションマネージャーの表示.js";
import { displayInspector } from "./インスペクタの表示.js";
import { displayObjects } from "./オブジェクトの表示.js";
import { displayTimeLine } from "./タイムライン表示.js";
import { displayHierarchy } from "./ヒエラルキーの表示.js";
import { Render } from "./ビューの表示.js";
import { displayProperty } from "./プロパティの表示.js";
import { displayRenderingOrder } from "./表示順番の表示.js";

export const managerForDOMs = new DOMsManager();

const modes = {
    "ビュー": displayHierarchy,
    "オブジェクト": displayObjects,
    "ヒエラルキー": displayHierarchy,
    "アニメーション": displayAnimationKey,
    "アニメーションマネージャー": displayAnimationManager,
    "表示順番": displayRenderingOrder,
    "インスペクタ": displayInspector,
    "プロパティ": displayProperty,
    "タイムライン": displayTimeLine,
};

export const updateDataForUI = {
    "ビュー": false,
    "オブジェクト": false,
    "ヒエラルキー": false,
    "アニメーション": false,
    "アニメーションマネージャー": false,
    "表示順番": false,
    "インスペクタ": false,
    "プロパティ": false,
    "タイムライン": false,
};

const specialTag = {
    "フレーム": {tags: [], updateFn: (tag,object) => {
        tag.checked = object.keyframe.hasKeyFromFrame(renderingParameters.keyfarameCount);
    }},
    "フレーム表示": {
        tags: [],
        updateFn: (tag,config) => {
            tag.style.setProperty("--label", `'${Math.round(renderingParameters.keyfarameCount)}'`);
            tag.style.left = `${(renderingParameters.keyfarameCount + Math.abs(config.startFrame)) * config.gap}px`;
        }
    }
}

const updateDataForSpecialTag = {
    "フレーム": true,
    "フレーム表示": true,
}

const objectDataAndRelateTags = new Map();

const gridInteriorObjects = [];

export class GridInterior {
    constructor(tag, initMode) {
        gridInteriorObjects.push(this);
        this.groupID = createID();
        this.config = {};
        this.targetTag = tag;
        this.targetTag.className = "grid-container";

        this.modeDiv = document.createElement("div");
        this.modeDiv.className = "modeSelect";

        this.modeSelectTag = document.createElement('select');
        setModeSelectOption(this.modeSelectTag, initMode);


        this.mainDiv = document.createElement("div");
        this.mainDiv.className = "grid-main";

        this.modeDiv.append(this.modeSelectTag, this.createModeToolBar(initMode));

        this.targetTag.append(this.modeDiv, this.mainDiv);

        this.tags = new Map();

        this.modeSelectTag.addEventListener('change', () => {
            if (this.modeSelectTag.value == "ビュー") {
                resetTag(this.tags);
                this.targetTag.innerHTML = "";
                gridInteriorObjects.splice(gridInteriorObjects.indexOf(this), 1);
                new View(this.targetTag);
            } else {
                resetTag(this.tags);
                this.modeDiv.innerHTML = "";
                this.modeDiv.append(this.modeSelectTag, this.createModeToolBar(this.modeSelectTag.value));
                this.tags.clear();
                modes[this.modeSelectTag.value](this.mainDiv, true, this.tags,this.config, this.groupID);
            }
        });

        modes[initMode](this.mainDiv,true,this.tags,this.config);

        this.mainDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            updateForContextmenu(this.modeSelectTag.value,[e.clientX,e.clientY]);
        });
    }

    createModeToolBar(mode) {
        if (mode == "オブジェクト") {
            const tagDiv = document.createElement("div");
            const filteringSelectTag = document.createElement('select');
            for (const type of ["すべて","グラフィックメッシュ","モディファイア","ベジェモディファイア","回転モディファイア"]) {
                const filteringSelectOptionTag = document.createElement('option');
                filteringSelectOptionTag.textContent = type;
                filteringSelectOptionTag.value = type;
                filteringSelectTag.appendChild(filteringSelectOptionTag);
            }
            filteringSelectTag.addEventListener('change', () => {
                displayObjects(this.mainDiv,false,filteringSelectTag.value);
            });
            tagDiv.append(filteringSelectTag);
            return tagDiv;
        } else if (mode == "アニメーション") {
            const tagDiv = document.createElement("div");
            return tagDiv;
        } else if (mode == "タイムライン") {
            const tagDiv = document.createElement("div");
            const isReplayCheckbox = document.createElement("input");
            isReplayCheckbox.type = "checkbox";
            isReplayCheckbox.checked = renderingParameters.isReplay;
            isReplayCheckbox.addEventListener("change", () => {
                renderingParameters.isReplay = isReplayCheckbox.checked;
            })
            tagDiv.append(isReplayCheckbox);
            return tagDiv;
        }
        const tagDiv = document.createElement("div");
        return tagDiv;
    }

    update(updateData) {
        if (updateData[this.modeSelectTag.value]) {
            modes[this.modeSelectTag.value](this.mainDiv,false,this.tags,this.config);
        }
    }
}

export function deleteTagDisappearedObject(tags) {
    tags.forEach((value,object) => {
        if (object.delete) {
            if (Array.isArray(value)) {
                for (const tag of value) {
                    if (tag instanceof HTMLElement) {
                        tag.remove();
                    }
                }
            } else {
                if (value instanceof HTMLElement) {
                    value.remove();
                }
            }
            tags.delete(object);
        }
    })
}

export function resetTag(tags) {
    tags.forEach((value,object) => {
        const allTag = tags.get(object);
        if (Array.isArray(allTag)) {
            for (const tag of allTag) {
                if (tag instanceof HTMLElement) {
                    tag.remove();
                }
            }
        } else {
            if (allTag instanceof HTMLElement) {
                allTag.remove();
            }
        }
        tags.delete(object);
    })
}

export function createobjectDataAndRelateTag(targetObject,valueName,tag) {
    const value = targetObject[valueName];
    if ("value" in tag) {
        tag.value = value;
    } else {
        tag.textContent = value;
    }
    if (!objectDataAndRelateTags.has(targetObject)) {
        objectDataAndRelateTags.set(targetObject, {lastUpdateData: null, map: new Map()});
    }
    const valueMap = objectDataAndRelateTags.get(targetObject).map;
    if (!valueMap.has(valueName)) {
        valueMap.set(valueName, []);
    }
    const configData = {
        tag: tag,
        writeTarget: "value"
    };
    valueMap.get(valueName).push(configData);
    return tag;
}

export function updateForUI() {
    for (const [key, value] of objectDataAndRelateTags) {
        if (key.delete) {
            // 削除
        }
        for (const [key2, value2] of value.map) {
            for (const value3 of value2) {
                value3.tag[value3.writeTarget] = key[key2];
            }
        }
    }
    for (const key in specialTag) {
        if (updateDataForSpecialTag[key]) {
            const data = specialTag[key];
            for (const tag of data.tags) {
                data.updateFn(...tag);
            }
        }
    }
    for (const gridInteriorObject of gridInteriorObjects) {
        if (gridInteriorObject instanceof View) {
            gridInteriorObject.update();
        } else {
            gridInteriorObject.update(updateDataForUI);
        }
    }
    for (const keyName in updateDataForUI) {
        updateDataForUI[keyName] = false;
    }
}

export function createID() {
    var S="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var N=16;
    return Array.from(Array(N)).map(()=>S[Math.floor(Math.random()*S.length)]).join('');
}

export function createLabeledInput(target, labelText, inputType, name, isCoordinate = false, inputId) {
    const label = document.createElement("label");
    label.textContent = labelText;
    if (!inputId) inputId = createID();

    const div = document.createElement("div");
    if (name) {
        div.setAttribute("name", name); // name を設定
    }
    if (isCoordinate) {
        div.className = "coordinate-input";
    } else {
        div.className = "label-input";
    }
    let input;
    if (inputType == "checkbox") {
        input = createCheckbox();
    } else {
        input = document.createElement("input");
    }
    input.type = inputType;
    input.id = inputId;
    label.setAttribute("for", inputId); // for属性を設定
    div.append(label,input);
    target.append(div);

    if (inputType == "checkbox") {
        return input.querySelector("input");
    } else {
        return input;
    }
}

export function createLabeledSelect(target, labelText, name, ID) {
    const label = document.createElement("label");
    label.textContent = labelText;
    if (!ID) ID = createID();

    console.log(ID)
    const select = document.createElement("select");
    const div = document.createElement("div");
    div.className = "label-input";
    if (name) {
        div.setAttribute("name", name); // name を設定
    }
    div.append(label,select);
    target.append(div);
    select.id = ID;
    label.setAttribute("for", ID); // for属性を設定

    return select;
}

export function createKeyframeSetTag(object, valueTarget) {
    const tag = document.createElement("input");
    tag.type = "checkbox";
    tag.checked = object.keyframe.hasKeyFromFrame(renderingParameters.keyfarameCount, 0.1);
    // スライダーのイベントリスナーを追加
    tag.addEventListener("change", () => {
        if (tag.checked) { // チェンジ後の値なのでtrueが追加falseが削除
            object.keyframe.addKeyframe(renderingParameters.keyfarameCount, Number(valueTarget.value));
        } else {
            object.keyframe.deleteKeyframe(object.keyframe.getKeyFromFrame(renderingParameters.keyfarameCount, 0.1));
        }
    });
    specialTag["フレーム"].tags.push([tag,object]);
    return tag;
}

export function createKeyframeTag(config) {
    const tag = document.createElement("div");
    tag.classList.add("time-nowframes");
    tag.style.setProperty("--label", `'${renderingParameters.keyfarameCount}'`);
    tag.style.left = `${(renderingParameters.keyfarameCount + Math.abs(config.startFrame)) * config.gap}px`;
    specialTag["フレーム表示"].tags.push([tag,config]);
    return tag;
}

export function createCheckbox(type = "custom-checkbox") {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const label = document.createElement("label");
    const span = document.createElement("span");
    span.classList.add(type);
    label.append(checkbox,span);
    return label;
}

export function createMinButton(target, text) {
    const button = document.createElement("button");
    button.classList.add("button-min");
    button.textContent = text;
    target.append(button)
    return button;
}

export function createList(target, listName) {
    const listNameTag = document.createElement("p");
    listNameTag.textContent = listName;
    const container = document.createElement("div");
    container.classList.add("flex-gap10px");

    const actionButtons = document.createElement("div");
    actionButtons.style.width = "20px";

    const appendButton = createMinButton(actionButtons, "+");
    const deleteButton = createMinButton(actionButtons, "-");
    const listContainer = document.createElement("ul");
    listContainer.classList.add("animationListContainer");
    listContainer.style.height = "200px";
    new ResizerForDOM(listContainer, "h", 100, 600);
    const list = document.createElement("ul");
    list.classList.add("scrollable","gap-2px");
    listContainer.append(list);

    container.append(listContainer, actionButtons)
    target.append(listNameTag);
    target.append(container);
    return {container: container, listContainer: listContainer, list: list, appendButton: appendButton, deleteButton: deleteButton};
}

export function createSection(target, sectionName, section) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    const label = document.createElement("label");
    const span = document.createElement("span");
    span.classList.add("hidden-checkbox");
    label.append(checkbox,span);

    const headerDiv = document.createElement("div");
    headerDiv.classList.add("flex")

    const sectionNameP = document.createElement("p");
    sectionNameP.textContent = sectionName;

    headerDiv.append(label, sectionNameP);

    const containerDiv = document.createElement("div");
    containerDiv.classList.add("inspector-container");
    containerDiv.setAttribute("name", sectionName);

    containerDiv.append(headerDiv, section);

    checkbox.addEventListener("change", () => {
        // checkbox.checked = !checkbox.checked;
        section.classList.toggle('hidden');
    });

    target.append(containerDiv);

    return containerDiv;
}

function createDoubleClickInput(fn) {
    const inputTag = document.createElement("input");
    inputTag.classList.add("dblClickInput");
    inputTag.setAttribute('readonly', true);
    inputTag.addEventListener('dblclick', () => {
        inputTag.removeAttribute('readonly');
        inputTag.focus();
    });

    inputTag.addEventListener('blur', () => {
        fn();
        inputTag.setAttribute('readonly', true);
    });
    return inputTag;
}

function setModeSelectOption(target, selectMode) {
    for (const mode in modes) {
        const modeSelectOptionTag = document.createElement('option');
        modeSelectOptionTag.textContent = mode;
        // modeSelectOptionTag.style.width = "10px";
        // modeSelectOptionTag.style.height = "10px";
        // modeSelectOptionTag.style.backgroundImage = `url(config/画像データ/ui_icon/${mode}.png)`;
        modeSelectOptionTag.value = mode;
        if (mode == selectMode) {
            modeSelectOptionTag.selected = true;
        }
        target.appendChild(modeSelectOptionTag);
    }
}

export class View {
    constructor(tag) {
        gridInteriorObjects.push(this)
        this.targetTag = tag;
        this.targetTag.className = "grid-container";

        this.modeDiv = document.createElement("div");
        this.modeDiv.className = "modeSelect";

        this.modeSelectTag = document.createElement('select');
        setModeSelectOption(this.modeSelectTag, "ビュー");

        this.modeDiv.append(this.modeSelectTag);
        const circleRadiusInput = createLabeledInput(this.modeDiv, "選択半径", "number");
        circleRadiusInput.value = toolbar.selectCircleRadius;
        circleRadiusInput.addEventListener("change", () => {
            GPU.writeBuffer(toolbar.circleRadiusInput, new Float32Array([circleRadiusInput.value]));
        })
        const smoothTypeSelect = createLabeledSelect(this.modeDiv, "スムーズタイプ");
        for (const type of [["通常", 0],["線形", 1],["逆2乗",2]]) {
            const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
            sleectElement.value = type[1]; // h1要素に配列の要素を設定
            sleectElement.textContent = type[0]; // h1要素に配列の要素を設定
            smoothTypeSelect.append(sleectElement);
            if (sleectElement[1] == toolbar.smoothType) sleectElement.selected = true;
        }

        smoothTypeSelect.addEventListener("change", () => {
            toolbar.smoothType = smoothTypeSelect.value;
        })
        const smoothRadiusInput = createLabeledInput(this.modeDiv, "スムーズ半径", "number");
        smoothRadiusInput.value = toolbar.smoothRadius;
        smoothRadiusInput.addEventListener("change", () => {
            toolbar.smoothRadius = smoothRadiusInput.value;
            GPU.writeBuffer(toolbar.smoothRadiusBuffer, new Float32Array([toolbar.smoothRadius]));
        })

        this.modeSelectTag.addEventListener('change', () => {
            this.targetTag.innerHTML = "";
            this.render = null;
            this.camera = null;
            this.convertCoordinate = null;
            this.select = null;
            resizeObserver.unobserve(this.cvs);
            if (activeView == this) {
                for (const grid of gridInteriorObjects) {
                    if (grid instanceof View) {
                        activeViewUpdate(grid);
                    }
                }
            }
            gridInteriorObjects.splice(gridInteriorObjects.indexOf(this), 1);
            new GridInterior(this.targetTag, this.modeSelectTag.value);
        });

        this.gridMainTag = document.createElement("div");
        this.gridMainTag.className = "grid-main";

        this.cvs = document.createElement("canvas");
        this.cvs.className = "renderingTarget";
        this.gridMainTag.append(this.cvs)
        this.targetTag.append(this.modeDiv,this.gridMainTag);
        this.cvsRect = this.cvs.getBoundingClientRect();
        this.cvs.width = this.cvsRect.width * 2;
        this.cvs.height = this.cvsRect.height * 2;
        this.cvsK = this.cvs.height / this.cvsRect.height;
        this.camera = new Camera();
        this.render = new Render(this.cvs, this.camera);

        this.convertCoordinate = new ConvertCoordinate(this.cvs,this.camera);
        this.select = new Select(this.convertCoordinate);

        this.mouseState = {click: false, rightClick: false, hold: false, holdFrameCount: 0, clickPosition: [0,0], clickPositionForGPU:[0,0], position: [0,0], lastPosition: [0,0], positionForGPU: [0,0], lastPositionForGPU: [0,0], movementForGPU: [0,0]};

        // ホイール操作
        this.cvs.addEventListener('wheel', (event) => {
            if (keysDown["Alt"]) {
                this.camera.zoom += event.deltaY / 200;
                this.camera.zoom = Math.max(Math.min(this.camera.zoom,this.camera.zoomMax),this.camera.zoomMin);
            } else {
                this.camera.position = vec2.addR(this.camera.position, vec2.scaleR([-event.deltaX, event.deltaY], 1 / this.camera.zoom));
            }

            event.preventDefault();
        }, { passive: false });

        this.cvs.addEventListener('mousemove', (event) => {
            const mouseX = (event.clientX - this.cvsRect.left) * this.cvsK; // Calculate mouse X relative to canvas
            const mouseY = this.cvs.height - ((event.clientY - this.cvsRect.top) * this.cvsK); // Calculate mouse Y relative to canvas
            this.mouseState.position = [mouseX,mouseY];
            this.mouseState.positionForGPU = this.convertCoordinate.screenPosFromGPUPos(this.mouseState.position);
        });

        this.cvs.addEventListener('mousedown', (event) => {
            if (event.button == 0) {
                activeViewUpdate(this);
                const mouseX = (event.clientX - this.cvsRect.left) * this.cvsK; // Calculate mouse X relative to canvas
                const mouseY = this.cvs.height - ((event.clientY - this.cvsRect.top) * this.cvsK); // Calculate mouse Y relative to
                this.mouseState.clickPosition = [mouseX,mouseY];
                this.mouseState.clickPositionForGPU = this.convertCoordinate.screenPosFromGPUPos(this.mouseState.position);
                this.mouseState.position = [mouseX,mouseY];
                this.mouseState.positionForGPU = this.convertCoordinate.screenPosFromGPUPos(this.mouseState.position);
                this.mouseState.hold = true;
                this.mouseState.holdFrameCount = 0;
                this.mouseState.click = true;
            }
        });

        this.cvs.addEventListener('mouseup', () => {
            this.mouseState.hold = false;
            this.mouseState.holdFrameCount = 0;
        });

        this.cvs.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            this.mouseState.rightClick = true;
        });

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                // 要素の新しいサイズを取得
                this.cvsRect = this.cvs.getBoundingClientRect();
                this.cvs.width = this.cvsRect.width * 3;
                this.cvs.height = this.cvsRect.height * 3;
                this.cvsK = this.cvs.height / this.cvsRect.height;
                this.render.resizeCVS();
            }
        });

        // 要素のリサイズを監視
        resizeObserver.observe(this.cvs);
    }

    update() {
        this.camera.updateCamera();
        this.render.renderObjects();
        this.render.renderGUI();
    }
}

export class EditorPreference {
    constructor() {
        this.smoothRadius = 100;
        this.smoothType = 0;

        this.smoothRadiusBuffer = GPU.createUniformBuffer(4, undefined, ["f32"]);
        GPU.writeBuffer(this.smoothRadiusBuffer, new Float32Array([this.smoothRadius]));

        this.selectCircleRadius = 20;

        this.animtionEndFrame = 50;

        this.activeActionKeyframe = [];

        this.meshHoveredColor = GPU.createUniformBuffer(16, [0,0.5,0.8, 0.5], ["f32"]);
        this.meshHoveredWidth = GPU.createUniformBuffer(8, [1,1], ["f32"]);
        this.meshHoveredGroup = GPU.createGroup(v_u_f_u, [[this.meshHoveredWidth, "b"],[this.meshHoveredColor, "b"]]);
        this.meshActiveColor = GPU.createUniformBuffer(16, [1,1,0, 0.5], ["f32"]);
        this.meshActiveWidth = GPU.createUniformBuffer(8, [1,1], ["f32"]);
        this.meshActiveGroup = GPU.createGroup(v_u_f_u, [[this.meshActiveWidth, "b"],[this.meshActiveColor, "b"]]);

        this.bezierColor = GPU.createUniformBuffer(16, [0,0,0, 0.8], ["f32"]);
        this.bezierWidth = GPU.createUniformBuffer(8, [4,1], ["f32"]);
        this.bezierGroup = GPU.createGroup(v_u_f_u, [[this.bezierWidth, "b"],[this.bezierColor, "b"]]);

        this.referenceCoordinatesColorBuffer = GPU.createUniformBuffer(16, [1, 0.7, 0, 0.8], ["f32"]);
        this.referenceCoordinatesSizeBuffer = GPU.createUniformBuffer(4, [20], ["f32"]);
        this.referenceCoordinatesGroup = GPU.createGroup(v_u_f_u,[{item: this.referenceCoordinatesSizeBuffer, type: "b"},{item: this.referenceCoordinatesColorBuffer, type: "b"}]);

        this.verticesColorBuffer = GPU.createUniformBuffer(16, [0, 0, 1, 0.8], ["f32"]);
        this.verticesSizeBuffer = GPU.createUniformBuffer(4, [10], ["f32"]);
        this.verticesGroup = GPU.createGroup(v_u_f_u,[{item: this.verticesSizeBuffer, type: "b"},{item: this.verticesColorBuffer, type: "b"}]);

        this.activeVerticesColorBuffer = GPU.createUniformBuffer(16, [1, 0.5, 0, 0.8], ["f32"]);
        this.activeVerticesGroup = GPU.createGroup(v_u_f_u,[{item: this.verticesSizeBuffer, type: "b"},{item: this.activeVerticesColorBuffer, type: "b"}]);
    }
}