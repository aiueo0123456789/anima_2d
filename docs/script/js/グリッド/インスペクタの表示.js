import { renderObjectManager } from "../main.js";
import { GPU } from "../webGPU.js";
import { appendAnimationToObject, deleteAnimationToObject, updateCenterPosition } from "../オブジェクトで共通の処理.js";
import { changeObjectName, hierarchy } from "../ヒエラルキー.js";
import { stateMachine } from '../main.js';
import { createMeshFromTexture } from '../画像からメッシュを作る.js';
import { vec2 } from "../ベクトル計算.js";
import { TextureToCVS } from "../キャンバスにテクスチャを表示.js";
import { createCheckbox, createIcon, createLabeledInput, createLabeledSelect, createMinButton, createSection, managerForDOMs, resetTag, updateDataForUI } from "./制御.js";
import { select } from "./ヒエラルキーの表示.js";
import { ResizerForDOM } from "./resizer.js";
import { activeOrClear } from "../コンテキストメニュー/制御.js";

function updateAnimationDOM(object, groupID, DOM) {
    const listItem = DOM;

    // listItem.style.backgroundColor = select(`rgb(70,70,170)`, `rgb(0,0,0,0)`, stateMachine.state.data.animation == object);

    const nameInputTag = listItem.querySelector("input");
    nameInputTag.value = object.name;

    // マネージャーの選択
    const managerSelectTag = listItem.querySelector("select");
    if (true) {
        const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
        sleectElement.value = ""; // h1要素に配列の要素を設定
        sleectElement.textContent = "なし"; // h1要素に配列の要素を設定
        if (!object.belongAnimationManager) {
            sleectElement.selected = true;
        }
        managerSelectTag.append(sleectElement);
    }
    hierarchy.animationManagers.forEach(manager => {
        const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
        sleectElement.value = manager.name; // h1要素に配列の要素を設定
        sleectElement.textContent = manager.name; // h1要素に配列の要素を設定
        if (object.belongAnimationManager == manager) {
            sleectElement.selected = true;
        }
        managerSelectTag.append(sleectElement);
    })
}

function updateAnimationBlockDOM(object, groupID, DOM) {
    // アニメーションデータの更新
    const animationList = DOM;

    // アニメーションが選択されていない状態にするため
    if (!animationList.querySelector("li")) {
        const listItem = document.createElement("li");
        listItem.dataset.objectID = "選択なし";

        const p = document.createElement("input");
        p.type = "text";
        p.value = "選択解除";
        p.setAttribute('readonly', true);

        listItem.append(p);
        listItem.addEventListener("click", () => {
            stateMachine.externalInputs["オブジェクトのアニメーションキー選択"] = null;
        })
        animationList.append(listItem);
    }

    for (const animation of object.animationBlock) { // オブジェクトのアニメーションたちを表示
        let listItem = null;
        for (const dom of animationList.children) {
            if (dom.dataset.objectID == animation.id) {
                listItem = dom;
                break ;
            }
        }
        if (!listItem) {
            listItem = document.createElement("li");
            listItem.dataset.objectID = animation.id;
            listItem.classList.add("flex-gap10px");

            createIcon(listItem, "頂点アニメーション");

            const nameInputTag = document.createElement("input");
            nameInputTag.type = "text";
            nameInputTag.value = animation.name;
            nameInputTag.classList.add("dblClickInput");
            nameInputTag.setAttribute('readonly', true);
            nameInputTag.addEventListener('dblclick', () => {
                nameInputTag.removeAttribute('readonly');
                nameInputTag.focus();
            });

            nameInputTag.addEventListener('blur', () => {
                changeObjectName(animation, nameInputTag.value);
                nameInputTag.setAttribute('readonly', true);
            });

            listItem.addEventListener("click", () => {
                stateMachine.externalInputs["オブジェクトのアニメーションキー選択"] = animation;
            })
            // マネージャーの選択
            const managerSelectTag = document.createElement("select");
            if (true) {
                const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
                sleectElement.value = "none"; // h1要素に配列の要素を設定
                sleectElement.textContent = "なし"; // h1要素に配列の要素を設定
                if (!animation.belongAnimationManager) {
                    sleectElement.selected = true;
                }
                managerSelectTag.append(sleectElement);
            }
            hierarchy.animationManagers.forEach(manager => {
                const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
                sleectElement.value = manager.id; // h1要素に配列の要素を設定
                sleectElement.textContent = manager.name; // h1要素に配列の要素を設定
                if (animation.belongAnimationManager == manager) {
                    sleectElement.selected = true;
                }
                managerSelectTag.append(sleectElement);
            })

            managerSelectTag.addEventListener("change", () => {
                if (managerSelectTag.value == "none") {
                    hierarchy.deleteAnimationManagerLink(animation);
                } else {
                    hierarchy.setAnimationManagerLink(hierarchy.searchObjectFromID(managerSelectTag.value), animation);
                }
                managerForDOMs.update(animation);
            })

            const transformCheck = createCheckbox();
            // transformCheck.type = "checkbox";
            transformCheck.checked = false;

            const weightSliderInputTag = document.createElement("input");
            weightSliderInputTag.type = "range";
            weightSliderInputTag.max = 1;
            weightSliderInputTag.min = 0;
            weightSliderInputTag.step = 0.00001;
            weightSliderInputTag.value = 0;

            listItem.addEventListener("click", () => {
                stateMachine.externalInputs["オブジェクトのアニメーションキー選択"] = animation;
            })
            listItem.append(nameInputTag, weightSliderInputTag, managerSelectTag, transformCheck);

            animationList.appendChild(listItem);

            managerForDOMs.set(animation, groupID, listItem, updateAnimationDOM);
        }
        activeOrClear(listItem, stateMachine.state.data.animation == animation);
    }
}

function updateBasicDOM(object, groupID, DOM) {
    // ベースデータの更新
    const basicContainer = DOM.querySelector('[name="基本情報"]');
    const basicSection = basicContainer.querySelector('[name="basicSection"]');

    const nameInput = basicSection.querySelector('[name="nameInput"]').querySelector("input");
    nameInput.value = object.name;

    const parentSelect = basicSection.querySelector('[name="親要素の選択"]').querySelector("select");
    if (true) {
        const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
        sleectElement.value = ""; // h1要素に配列の要素を設定
        sleectElement.textContent = "なし"; // h1要素に配列の要素を設定
        if (!object.parent) {
            sleectElement.selected = true;
        }
        parentSelect.append(sleectElement);
    }
    const createModifierOptionTag = (modifier,type) => {
        const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
        sleectElement.value = `${type}${modifier.name}`; // h1要素に配列の要素を設定
        sleectElement.textContent = `${modifier.name}`; // h1要素に配列の要素を設定
        if (object.parent == modifier) {
            sleectElement.selected = true;
        }
        parentSelect.append(sleectElement);
    }
    hierarchy.modifiers.forEach(modifier => {
        createModifierOptionTag(modifier,"_m");
    })
    hierarchy.lineModifiers.forEach(modifier => {
        createModifierOptionTag(modifier,"lm");
    })
    hierarchy.rotateModifiers.forEach(modifier => {
        createModifierOptionTag(modifier,"rm");
    })
    hierarchy.boneModifiers.forEach(modifier => {
        createModifierOptionTag(modifier,"bm");
    })
    parentSelect.addEventListener('change', () => {
        if (parentSelect.value == "") {
            hierarchy.sortHierarchy("", object);
        } else {
            let type;
            if (parentSelect.value.slice(0,2) == "_m") type = "モディファイア";
            if (parentSelect.value.slice(0,2) == "lm") type = "ベジェモディファイア";
            if (parentSelect.value.slice(0,2) == "rm") type = "回転モディファイア";
            if (parentSelect.value.slice(0,2) == "bm") type = "ボーンモディファイア";
            hierarchy.sortHierarchy(hierarchy.searchObjectFromName(parentSelect.value.slice(2), type), object);
        }
    });

    const sizeContainer = basicSection.querySelector('[name="大きさ入力"]');
    sizeContainer.querySelector('[name="横幅"]').querySelector("input").value = object.BBoxArray[2] - object.BBoxArray[0];
    sizeContainer.querySelector('[name="縦幅"]').querySelector("input").value = object.BBoxArray[3] - object.BBoxArray[1];

    const positionContainer = basicSection.querySelector('[name="中心入力"]');
    positionContainer.querySelector('[name="中心入力-x"]').querySelector("input").value = (object.BBoxArray[0] + object.BBoxArray[2]) / 2;
    positionContainer.querySelector('[name="中心入力-y"]').querySelector("input").value = (object.BBoxArray[1] + object.BBoxArray[3]) / 2;

    basicSection.querySelector('[name="変形の許可"]').querySelector("input").checked = object.baseTransformIsLock;
}

function eventFnChangeObjectName(target, object) {
    object.name = target.value;
    managerForDOMs.update(object);
}

export function displayInspector(targetDiv, isInit, tags, config, groupID) {
    const object = stateMachine.state.data.object;
    if (!object) return;
    const scrollableDiv = document.createElement("ul");
    managerForDOMs.set(object, groupID, scrollableDiv, updateBasicDOM);

    targetDiv.append(scrollableDiv);

    scrollableDiv.className = "";
    scrollableDiv.classList.add("grid-main","scrollable","gap-2px","color3","pa-10px","pa-r-0px");

    // Basic Section
    if (true) {
        const basicSection = document.createElement("div");
        basicSection.setAttribute("name", "basicSection")

        const nameInput = createLabeledInput(basicSection, "オブジェクトの名前:", "text", "nameInput");
        nameInput.value = object.name;

        nameInput.addEventListener("change", eventFnChangeObjectName.bind(null, nameInput, object));

        const parentSelect = createLabeledSelect(basicSection, "親要素:", "親要素の選択");
        if (true) {
            const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
            sleectElement.value = ""; // h1要素に配列の要素を設定
            sleectElement.textContent = "なし"; // h1要素に配列の要素を設定
            if (!object.parent) {
                sleectElement.selected = true;
            }
            parentSelect.append(sleectElement);
        }
        const createModifierOptionTag = (modifier,type) => {
            const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
            sleectElement.value = `${type}${modifier.name}`; // h1要素に配列の要素を設定
            sleectElement.textContent = `${modifier.name}`; // h1要素に配列の要素を設定
            if (object.parent == modifier) {
                sleectElement.selected = true;
            }
            parentSelect.append(sleectElement);
        }
        hierarchy.modifiers.forEach(modifier => {
            createModifierOptionTag(modifier,"_m");
        })
        hierarchy.lineModifiers.forEach(modifier => {
            createModifierOptionTag(modifier,"lm");
        })
        hierarchy.rotateModifiers.forEach(modifier => {
            createModifierOptionTag(modifier,"rm");
        })
        hierarchy.boneModifiers.forEach(modifier => {
            createModifierOptionTag(modifier,"bm");
        })
        parentSelect.addEventListener('change', () => {
            if (parentSelect.value == "") {
                hierarchy.sortHierarchy("", object);
            } else {
                let type;
                if (parentSelect.value.slice(0,2) == "_m") type = "モディファイア";
                if (parentSelect.value.slice(0,2) == "lm") type = "ベジェモディファイア";
                if (parentSelect.value.slice(0,2) == "rm") type = "回転モディファイア";
                if (parentSelect.value.slice(0,2) == "bm") type = "ボーンモディファイア";
                hierarchy.sortHierarchy(hierarchy.searchObjectFromName(parentSelect.value.slice(2), type), object);
            }
            managerForDOMs.update(object);
        });
    
        basicSection.appendChild(document.createElement("p")).textContent = "大きさ";
    
        const sizeContainer = document.createElement("div");
        sizeContainer.setAttribute("name", "大きさ入力");
        sizeContainer.classList.add("flex-0");
        basicSection.appendChild(sizeContainer);
    
        createLabeledInput(sizeContainer,"w:", "number", "横幅", true).value = object.BBoxArray[2] - object.BBoxArray[0];
        createLabeledInput(sizeContainer,"h:", "number", "縦幅",true).value = object.BBoxArray[3] - object.BBoxArray[1];
    
        basicSection.appendChild(document.createElement("p")).textContent = "位置";

        const changeCenterPositionFn = () => {
            updateCenterPosition(object, [Number(positionInputForX.value), Number(positionInputForY.value)])
        }

        const positionContainer = document.createElement("div");
        positionContainer.classList.add("flex-0");
        positionContainer.setAttribute("name", "中心入力");
        basicSection.appendChild(positionContainer);

        const positionInputForX = createLabeledInput(positionContainer,"x:", "number", "中心入力-x", true);
        const positionInputForY = createLabeledInput(positionContainer,"y:", "number", "中心入力-y", true);
        positionInputForX.step = 0.0001;
        positionInputForX.value = (object.BBoxArray[0] + object.BBoxArray[2]) / 2;
        positionInputForY.step = 0.0001;
        positionInputForY.value = (object.BBoxArray[1] + object.BBoxArray[3]) / 2;
        positionInputForX.addEventListener("change", changeCenterPositionFn);
        positionInputForY.addEventListener("change", changeCenterPositionFn);

        const baseTransformCheck = createLabeledInput(basicSection,"ベース状態の変形:", "checkbox", "変形の許可");
        baseTransformCheck.checked = object.baseTransformIsLock;
        baseTransformCheck.addEventListener("change", () => {
            object.baseTransformIsLock = baseTransformCheck.checked;
            managerForDOMs.update(object)
        })

        createSection(scrollableDiv, "基本情報", basicSection);
    }

    // Mesh Section
    if (object.type == "グラフィックメッシュ") {
        const meshSection = document.createElement("div");
        meshSection.id = "mesh-section";
        meshSection.classList.add("section");

        const zIndexInput = createLabeledInput(meshSection,"表示順番:", "number");
        zIndexInput.step = 1;
        zIndexInput.value = object.zIndex;
        zIndexInput.addEventListener("change", () => {
            hierarchy.updateZindex(object, Number(zIndexInput.value));
        })

        const textureInput = createLabeledInput(meshSection,"画像を選択", "file");
        textureInput.addEventListener("change", async () => {
            const file = textureInput.files[0]; // 選択されたファイル
            if (file) {
                const fileName = file.name.split(".")[0];
                changeObjectName(object, fileName);
                // ファイルのプレビュー表示例
                object.texture = await GPU.imageToTexture2D(URL.createObjectURL(file));
                object.textureView = object.texture.createView();
                object.setGroup();

                textureToCVS.setTexture(object.texture,object.textureView);
                textureToCVS.update();
            }
        });

        const textureRenderingCVS = document.createElement("canvas");
        textureRenderingCVS.classList.add("texture-preview");
        meshSection.appendChild(textureRenderingCVS);

        const textureToCVS = new TextureToCVS(textureRenderingCVS);
        if (object.texture) {
            textureToCVS.setTexture(object.texture,object.textureView);
            textureToCVS.update();
        }

        const generateMeshValue1Input = createLabeledInput(meshSection, "ピクセルの密度", "number");
        generateMeshValue1Input.step = 1;
        generateMeshValue1Input.min = 1;
        generateMeshValue1Input.max = 10;
        generateMeshValue1Input.value = 6;
        const generateMeshValue2InputForX = createLabeledInput(meshSection, "細かさX", "number");
        generateMeshValue2InputForX.step = 1;
        generateMeshValue2InputForX.min = 1;
        generateMeshValue2InputForX.max = 100;
        generateMeshValue2InputForX.value = 100;
        const generateMeshValue2InputForY = createLabeledInput(meshSection, "細かさY", "number");
        generateMeshValue2InputForY.step = 1;
        generateMeshValue2InputForY.min = 1;
        generateMeshValue2InputForY.max = 100;
        generateMeshValue2InputForY.value = 100;

        const generateMeshButton = document.createElement("button");
        generateMeshButton.textContent = "メッシュの自動生成";
        meshSection.appendChild(generateMeshButton);

        generateMeshButton.addEventListener("click", async () => {
            const meshData = await createMeshFromTexture(object.texture, Number(generateMeshValue1Input.value), [Number(generateMeshValue2InputForX.value),Number(generateMeshValue2InputForY.value)], 0, 5);
            for (let i = 0; i < meshData[0].length; i ++) {
                vec2.add(meshData[0][i], meshData[0][i], [(object.BBoxArray[0] + object.BBoxArray[2]) / 2, (object.BBoxArray[1] + object.BBoxArray[3]) / 2]);
            }
            object.setMeshData(...meshData);
        })

        const renderingTargetTextureSelectTag = createLabeledSelect(meshSection,"レンダリングターゲット:");
        const maskTexturesSelectTag = createLabeledSelect(meshSection,"マスク:");

        renderObjectManager.maskTextures.forEach(textureData => {
            const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
            sleectElement.value = textureData.name; // h1要素に配列の要素を設定
            sleectElement.textContent = textureData.name; // h1要素に配列の要素を設定
            if (object.maskTargetTexture == textureData) {
                sleectElement.selected = true;
            }
            maskTexturesSelectTag.append(sleectElement);
        })

        renderObjectManager.maskTextures.forEach(textureData => {
            const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
            sleectElement.value = textureData.name; // h1要素に配列の要素を設定
            sleectElement.textContent = textureData.name; // h1要素に配列の要素を設定
            if (object.renderingTargetTexture == textureData) {
                sleectElement.selected = true;
            }
            renderingTargetTextureSelectTag.append(sleectElement);
        })

        renderingTargetTextureSelectTag.addEventListener('change', () => {
            object.changeRenderingTarget(renderObjectManager.searchMaskTextureFromName(renderingTargetTextureSelectTag.value));
        });

        maskTexturesSelectTag.addEventListener('change', () => {
            object.changeMaskTexture(renderObjectManager.searchMaskTextureFromName(maskTexturesSelectTag.value));
        });

        createSection(scrollableDiv, "グラフィックメッシュ", meshSection);
    }

    // Modifier Section
    if (object.type == "モディファイア") {
        const modifierSection = document.createElement("div");
        modifierSection.id = "modifier-section";
        modifierSection.classList.add("section");

        const boundingBoxButton = document.createElement("button");
        boundingBoxButton.textContent = "子要素からバウンディングボックスを計算";
        modifierSection.appendChild(boundingBoxButton);

        boundingBoxButton.addEventListener("click", () => {
            object.setChildrenBBox();
        })

        const finenessContainer = document.createElement("div");
        finenessContainer.classList.add("flex-0");
        modifierSection.appendChild(finenessContainer);

        const changeFinenessFn = () => {
            object.updateFineness([Number(finenessInputForX.value) ,Number(finenessInputForY.value)]);
        }

        const finenessInputForX = createLabeledInput(finenessContainer,"細かさy:", "number");
        const finenessInputForY =  createLabeledInput(finenessContainer,"細かさx:", "number");
        finenessInputForX.step = 1;
        finenessInputForX.step = 1;
        finenessInputForX.value = object.fineness[0];
        finenessInputForY.value = object.fineness[1];
        finenessInputForX.addEventListener("change", changeFinenessFn);
        finenessInputForY.addEventListener("change", changeFinenessFn);

        createSection(scrollableDiv, "モディファイア", modifierSection);
    }

    // Line Modifier Section
    if (object.type == "ベジェモディファイア") {
        const lineModifierSection = document.createElement("div");
        lineModifierSection.id = "lineModifier-section";
        lineModifierSection.classList.add("section");

        createSection(scrollableDiv, "ベジェモディファイア", lineModifierSection);

    }

    // Animation Section
    if (true) {
        const animationSection = document.createElement("div");
        animationSection.setAttribute("name","animationSection");
        animationSection.id = "animtions-section";
        animationSection.classList.add("section");

        animationSection.appendChild(document.createElement("p")).textContent = "アニメーションブロック";

        const animationsBox = document.createElement("div");
        animationsBox.classList.add("flex-gap10px");
        const animationActionButtons = document.createElement("div");
        animationActionButtons.style.width = "20px";

        const animationAppendButton = createMinButton(animationActionButtons, "+");
        animationAppendButton.addEventListener("click", () => {
            appendAnimationToObject(object, "名称未設定");
        })
        const animationDeleteButton = createMinButton(animationActionButtons, "-");
        animationDeleteButton.addEventListener("click", () => {
            if (stateMachine.state.data.animation) {
                deleteAnimationToObject(object, stateMachine.state.data.animation);
                managerForDOMs.deleteObject(stateMachine.state.data.animation);
                stateMachine.externalInputs["オブジェクトのアニメーションキー選択"] = null;
                stateMachine.state.data.animation = null;
            }
        })
        const animationListContainer = document.createElement("ul");
        animationListContainer.classList.add("animationListContainer");
        animationListContainer.style.height = "200px";
        new ResizerForDOM(animationListContainer, "h", 100, 600);
        const animationList = document.createElement("ul");
        animationList.classList.add("scrollable","gap-2px");
        animationListContainer.append(animationList);

        animationsBox.append(animationListContainer, animationActionButtons);

        managerForDOMs.set(object.animationBlock, groupID, animationList, updateAnimationBlockDOM);
        updateAnimationBlockDOM(object.animationBlock, groupID, animationList); // 初期化

        animationSection.appendChild(animationsBox);
        const test = createLabeledInput(animationSection, "テスト", "text");
        const test1 = createLabeledInput(animationSection, "テスト", "text");
        const test2 = createLabeledInput(animationSection, "テスト", "text");
        const test3 = createLabeledInput(animationSection, "テスト", "text");
        const test4 = createLabeledInput(animationSection, "テスト", "text");
        const test5 = createLabeledInput(animationSection, "テスト", "text");

        createSection(scrollableDiv, "アニメーション", animationSection);
    }
}