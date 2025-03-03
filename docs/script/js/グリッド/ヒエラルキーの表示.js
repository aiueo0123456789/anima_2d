import { hierarchy } from '../ヒエラルキー.js';
import { stateMachine } from '../main.js';
import { createCheckbox, deleteTagDisappearedObject } from './制御.js';
import { activeOrClear } from '../コンテキストメニュー/制御.js';

export function select(a,b,bool) {
    return bool ? a : b;
}

export function displayHierarchy(targetTag, isInit = false, tags) {
    console.log("displayHierarchy")
    if (isInit) {
        targetTag.className = 'grid-main'; // クラスを全て消す
        targetTag.replaceChildren();
        const scrollable = document.createElement("ul");
        // scrollable.classList.add("scrollable","gap-2px","color2");
        scrollable.classList.add("scrollable","color2");
        targetTag.append(scrollable);
    }

    const scrollableTag = targetTag.querySelector("ul");

    let offset = 0;
    const childrenRoop = (children, depth) => {
        children.forEach((object) => {
            if (tags.has(object)) {
                const allTag = tags.get(object);
                const tagsGroup = allTag.querySelector("div");
                activeOrClear(tagsGroup, stateMachine.state.data.object == object);

                const nameInputTag = tagsGroup.querySelector("input[type=text]");
                if (nameInputTag.value != object.name) nameInputTag.value = object.name;
                if (object.type == "グラフィックメッシュ") {
                    const zIndexInputTag = tagsGroup.querySelector("input[type=number]");
                    if (zIndexInputTag.value != object.zIndex) zIndexInputTag.value = object.zIndex;
                }
                if (!(object.parent == allTag.dataset.parentName || object.parent.name == allTag.dataset.parentName)) {
                    if (object.parent) {
                        tags.get(object.parent).querySelector("ul").append(allTag);
                        allTag.dataset.parentName = object.parent.name;
                    } else {
                        scrollableTag.append(allTag);
                        allTag.dataset.parentName = "";
                    }
                }
            } else {
                console.log("タグの生成")
                const allTag = document.createElement("li");
                const tagsGroup = document.createElement("div");
                tagsGroup.className = "hierarchy";
                activeOrClear(tagsGroup, stateMachine.state.data.object == object);

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
                    const zIindexInputTag = document.createElement("input");
                    zIindexInputTag.className = "hierarchy-zIndex";
                    zIindexInputTag.type = "number";
                    zIindexInputTag.min = 0;
                    zIindexInputTag.max = 1000;
                    zIindexInputTag.step = 1;
                    zIindexInputTag.value = object.zIndex;

                    const hideCheckTag = createCheckbox();
                    hideCheckTag.classList.add("hierarchy-hide");
                    hideCheckTag.checked = object.isHide;

                    tagsGroup.append(childrenHidBtn,depthAndNameDiv, zIindexInputTag, hideCheckTag);

                    zIindexInputTag.addEventListener('change', () => {
                        object.zIndex = Number(zIindexInputTag.value);
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
                    hierarchy.changeObjectName(object, nameInputTag.value);
                    nameInputTag.setAttribute('readonly', true);
                });

                allTag.append(tagsGroup, childrenTag);
                tags.set(object, allTag);

                if (object.parent) {
                    tags.get(object.parent).querySelector("ul").append(allTag);
                    allTag.dataset.parentName = object.parent.name;
                } else {
                    scrollableTag.append(allTag);
                    allTag.dataset.parentName = "";
                }
            }
            offset++;
            if (Array.isArray(object.children?.objects)) {
                childrenRoop(object.children.objects, depth + 1);
            }
        });
    };

    childrenRoop(hierarchy.surface, 0);

    deleteTagDisappearedObject(tags);
}