import { keysDown, renderObjectManager } from "../main.js";
import { activeOrClear } from "../コンテキストメニュー/制御.js";
import { changeObjectName } from "../ヒエラルキー.js";
import { createIcon, createLabeledInput, createList, createSection, managerForDOMs } from "./制御.js";

function hexToRgba(hex, alpha = 1) {
    // #を取り除く
    hex = hex.replace(/^#/, '');
    // R, G, Bを取り出して整数に変換
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    // RGBA形式で返す0
    return { r, g, b, a: alpha };
}

function updateMaskTexture(object, groupID, DOM) {
}

function updateMaskTextureList(object, groupID, DOM) {
    const maskTextureList = DOM;

    for (const maskTexture of object) { // オブジェクトのアニメーションたちを表示
        let listItem = null;
        for (const dom of maskTextureList.children) {
            if (dom.dataset.objectID == maskTexture.id) {
                listItem = dom;
                break ;
            }
        }
        if (!listItem) {
            listItem = document.createElement("li");
            listItem.dataset.objectID = maskTexture.id;
            listItem.dataset.selected = "false";
            listItem.classList.add("flex-gap10px");

            createIcon(listItem, "マスク");

            const nameInputTag = document.createElement("input");
            nameInputTag.type = "text";
            nameInputTag.value = maskTexture.name;
            nameInputTag.classList.add("dblClickInput");
            nameInputTag.setAttribute('readonly', true);
            nameInputTag.addEventListener('dblclick', () => {
                nameInputTag.removeAttribute('readonly');
                nameInputTag.focus();
            });

            nameInputTag.addEventListener('blur', () => {
                changeObjectName(maskTexture, nameInputTag.value);
                nameInputTag.setAttribute('readonly', true);
            });

            listItem.addEventListener("click", () => {
                if (keysDown["Shift"]) {
                    listItem.dataset.selected = "true";
                } else {
                    for (const dom of maskTextureList.children) {
                        if (dom.dataset.objectID == maskTexture.id) {
                            dom.dataset.selected = "true";
                        } else {
                            dom.dataset.selected = "false";
                        }
                    }
                }
                managerForDOMs.update(object);
            })
            listItem.append(nameInputTag);

            maskTextureList.appendChild(listItem);

            managerForDOMs.set(maskTexture, groupID, listItem, updateMaskTexture);
        }
        activeOrClear(listItem, listItem.dataset.selected === "true");
    }
}

export function displayProperty(scrollableDiv, isInit, tags, config, groupID) {
    scrollableDiv.innerHTML = "";
    scrollableDiv.className = "";
    scrollableDiv.classList.add("grid-main","scrollable","gap-2px","color3","pa-10px","pa-r-0px");

    if (true) {
        const worldSection = document.createElement("div");
        worldSection.classList.add("section");

        const backgroundColorInput = createLabeledInput(worldSection, "背景色", "color");
        backgroundColorInput.value = "#FFFFFF";

        backgroundColorInput.addEventListener("change", () => {
            renderObjectManager.backgroundColor = hexToRgba(backgroundColorInput.value, 1);
        });

        const maskTextureDataSection = document.createElement("div");
        maskTextureDataSection.classList.add("section");

        const maskTextureListObject = createList(maskTextureDataSection, "マスクテクスチャ");
        maskTextureListObject.appendButton.addEventListener("click", () => {
            renderObjectManager.appendMaskTexture("名称未設定");
        });

        maskTextureListObject.deleteButton.addEventListener("click", () => {
            for (let i = maskTextureListObject.list.children.length - 1; i >= 0; i --) {
                const dom = maskTextureListObject.list.children[i];
                if (dom.dataset.selected === "true") {
                    renderObjectManager.deleteMaskTextureFromID(dom.dataset.objectID);
                }
            }
        });

        managerForDOMs.set(renderObjectManager.maskTextures, groupID, maskTextureListObject.list, updateMaskTextureList);
        managerForDOMs.update(renderObjectManager.maskTextures);

        createLabeledInput(maskTextureDataSection, "名前", "text");
        createLabeledInput(maskTextureDataSection, "テスト", "number");
        createSection(worldSection, "テクスチャ", maskTextureDataSection);

        createSection(scrollableDiv, "ワールド", worldSection);
    }
}