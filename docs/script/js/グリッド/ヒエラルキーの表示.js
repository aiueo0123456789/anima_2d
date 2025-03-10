import { changeObjectName, hierarchy } from '../ヒエラルキー.js';
import { stateMachine } from '../main.js';
import { createCheckbox, deleteTagDisappearedObject, managerForDOMs } from './制御.js';
import { activeOrClear } from '../コンテキストメニュー/制御.js';

export function select(a,b,bool) {
    return bool ? a : b;
}

function updateObject(object, groupID, DOM) {
    /** @type {HTMLElement} */
    const container = DOM.querySelector("div");

    const nameInputTag = container.querySelector("input[type=text]");
    if (nameInputTag.value != object.name) nameInputTag.value = object.name;
    if (object.type == "グラフィックメッシュ") {
        const zIndexInputTag = container.querySelector("input[type=number]");
        if (zIndexInputTag.value != object.zIndex) zIndexInputTag.value = object.zIndex;
    }
}

function updateHierarchy(objects, groupID, DOM) {
    /** @type {HTMLElement} */
    const ul = DOM;

    const pairData = new Map();

    // タグがないオブジェクトにタグを作る
    for (const object of hierarchy.allObject) {
        if (object.type != "アニメーションマネージャー") {
            let listItem = managerForDOMs.getDOMInObject(object, groupID);

            if (!listItem) {
                listItem = document.createElement("li");
                const tagsGroup = document.createElement("div");
                tagsGroup.className = "hierarchy";

                const childrenTag = document.createElement("ul");
                childrenTag.className = "children";

                const childrenHidBtn = createCheckbox("hidden-checkbox");
                childrenHidBtn.querySelector("input").checked = true;
                tagsGroup.append(childrenHidBtn);

                childrenHidBtn.addEventListener("change", () => {
                    childrenTag.classList.toggle('hidden');
                })

                const nameInputTag = document.createElement("input");
                nameInputTag.type = "text";
                nameInputTag.value = object.name;
                nameInputTag.setAttribute('readonly', true);
                nameInputTag.classList.add("dblClickInput");

                const typeImgTag = document.createElement("img");
                typeImgTag.src = `config/画像データ/${object.type}.png`;

                const depthAndNameDiv = document.createElement("div");
                depthAndNameDiv.className = "hierarchy-name";
                depthAndNameDiv.append(nameInputTag, typeImgTag);

                if (object.type == "グラフィックメッシュ") {
                    const zIndexInput = document.createElement("input");
                    zIndexInput.className = "hierarchy-zIndex";
                    zIndexInput.type = "number";
                    zIndexInput.min = 0;
                    zIndexInput.max = 1000;
                    zIndexInput.step = 1;
                    zIndexInput.value = object.zIndex;

                    const hideCheckTag = createCheckbox();
                    hideCheckTag.classList.add("hierarchy-hide");
                    hideCheckTag.checked = object.isHide;

                    tagsGroup.append(childrenHidBtn,depthAndNameDiv, zIndexInput, hideCheckTag);

                    zIndexInput.addEventListener('change', () => {
                        hierarchy.updateZindex(object, Number(zIndexInput.value));
                    });

                    hideCheckTag.addEventListener('change', () => {
                        object.isHide = hideCheckTag.checked;
                    });
                } else {
                    tagsGroup.append(childrenHidBtn,depthAndNameDiv);
                }

                tagsGroup.addEventListener('click', () => {
                    stateMachine.externalInputs["ヒエラルキーのオブジェクト選択"] = object;
                });

                nameInputTag.addEventListener('dblclick', () => {
                    nameInputTag.removeAttribute('readonly');
                    nameInputTag.focus();
                });

                nameInputTag.addEventListener('blur', () => {
                    changeObjectName(object, nameInputTag.value);
                    nameInputTag.setAttribute('readonly', true);
                });

                listItem.append(tagsGroup, childrenTag);

                listItem.dataset.parentName = "none";

                ul.append(listItem)

                managerForDOMs.set(object, groupID, listItem, updateObject);
            }
            activeOrClear(listItem.querySelector("div"), stateMachine.state.data.object == object);
            activeOrClear(listItem.querySelector("ul"), stateMachine.state.data.object == object, true);
            pairData.set(object, listItem);
        }
    }

    const fn = (targetID, target, objects) => {
        for (const child of objects) {
            /** @type {HTMLElement} */
            const childTag = pairData.get(child);
            if (childTag.dataset.parentName != targetID) {
                childTag.dataset.parentName = targetID;
                target.append(childTag);
            }
            if (child.children) {
                objectChildrenRoop(child);
            }
        }
    }

    const objectChildrenRoop = (object = "") => {
        if (object == "") {
            fn("hierarchySurface", ul, hierarchy.surface);
        } else {
            fn(object.id, pairData.get(object).querySelector("ul"), object.children.objects);
        }
    }

    objectChildrenRoop();
}

export function displayHierarchy(targetTag, isInit, tags, config, groupID) {
    console.log("displayHierarchy")
    targetTag.className = 'grid-main'; // クラスを全て消す
    targetTag.replaceChildren();
    const scrollable = document.createElement("ul");
    scrollable.classList.add("scrollable","color2");
    targetTag.append(scrollable);

    const scrollableTag = targetTag.querySelector("ul");

    managerForDOMs.set("ヒエラルキー",groupID,scrollableTag,updateHierarchy);
    managerForDOMs.update("ヒエラルキー");
}