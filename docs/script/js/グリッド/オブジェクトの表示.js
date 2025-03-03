import { hierarchy } from '../ヒエラルキー.js';
import { stateMachine } from '../main.js';
import { select } from './ヒエラルキーの表示.js';
import { deleteTagDisappearedObject } from './制御.js';

export function displayObjects(targetTag, isInit = false, tags, option = {filterType: false}) {
    console.log("displayObjects")
    if (isInit) {
        targetTag.replaceChildren();
        const scrollable = document.createElement("ul");
        scrollable.classList.add("scrollable","gap-2px");
        targetTag.append(scrollable);
    }

    const scrollableTag = targetTag.querySelector("ul");

    let offset = 0;
    const createOrUpdateTag = (object) => {
        console.log(object)
        if (tags.has(object)) {
            const allTag = tags.get(object);
            const tagsGroup = allTag.querySelector("div");
            tagsGroup.style.backgroundColor = select(`rgb(70,70,170)`, `rgb(0,0,0,${offset % 2 / 10})`, stateMachine.state.data.object == object);

            const nameInputTag = tagsGroup.querySelector("input[type=text]");
            if (nameInputTag.value != object.name) nameInputTag.value = object.name;
            if (object.type == "グラフィックメッシュ") {
                const zIndexInputTag = tagsGroup.querySelector("input[type=number]");
                if (zIndexInputTag.value != object.zIndex) zIndexInputTag.value = object.zIndex;
            }
            if (option.filterType[object.type]) {
                // allTag.classList.add("hidden");
            }
        } else {
            const allTag = document.createElement("li");
            const tagsGroup = document.createElement("div");
            tagsGroup.className = "hierarchy";
            tagsGroup.style.backgroundColor = select(`rgb(70,70,170)`, `rgb(0,0,0,${offset % 2 / 10})`, stateMachine.state.data.object == object);

            const nameInputTag = document.createElement("input");
            nameInputTag.type = "text";
            nameInputTag.value = object.name;
            nameInputTag.setAttribute('readonly', true);

            const typeImgTag = document.createElement("img");
            if (object.type === "グラフィックメッシュ") {
                typeImgTag.src = "config/画像データ/グラフィックメッシュ.png";
            } else if (object.type == "モディファイア") {
                typeImgTag.src = "config/画像データ/モディファイア.png";
            } else if (object.type == "ベジェモディファイア") {
                typeImgTag.src = "config/画像データ/ベジェモディファイア.png";
            } else if (object.type == "回転モディファイア") {
                typeImgTag.src = "config/画像データ/ベジェモディファイア.png";
            }

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

                const hideCheckTag = document.createElement("input");
                hideCheckTag.className = "hierarchy-hide";
                hideCheckTag.type = "checkbox";
                hideCheckTag.checked = object.isHide;

                tagsGroup.append(depthAndNameDiv, zIindexInputTag, hideCheckTag);

                zIindexInputTag.addEventListener('change', () => {
                    object.zIndex = Number(zIindexInputTag.value);
                });

                hideCheckTag.addEventListener('change', () => {
                    object.isHide = hideCheckTag.checked;
                });
            } else {
                tagsGroup.append(depthAndNameDiv);
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

            allTag.append(tagsGroup);
            tags.set(object, allTag);

            scrollableTag.append(allTag);
        }
    }
    for (const object of hierarchy.allObject) {
        createOrUpdateTag(object);
        offset++;
    }

    deleteTagDisappearedObject(tags);
}