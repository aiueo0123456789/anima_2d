import { hierarchy } from '../ヒエラルキー.js';

let isInit = true;

export function displayRenderingOrder(targetTag) {
    if (isInit) {
        isInit = false;
    }
    targetTag.innerHTML = "";

    const scrollableDiv = document.createElement("div");
    scrollableDiv.classList.add("scrollable","gap-2px");

    let offset = 0;
    for (const object of hierarchy.renderingOrder) {
        const tagsGrou = document.createElement("div");
        tagsGrou.className = "hierarchy";
        tagsGrou.style.backgroundColor = `rgb(0,0,0,${offset % 2 / 10})`;

        const nameInputTag = document.createElement("input");
        nameInputTag.type = "text";
        nameInputTag.value = object.name;
        nameInputTag.className = "hierarchy-name";

        const zIindexInputTag = document.createElement("input");
        zIindexInputTag.className = "hierarchy-zIndex";
        zIindexInputTag.type = "number";
        zIindexInputTag.min = 0;
        zIindexInputTag.max = 1000;
        zIindexInputTag.step = 1;
        zIindexInputTag.value = object.zIndex;
        tagsGrou.append(nameInputTag, zIindexInputTag);
        scrollableDiv.append(tagsGrou);
        offset ++;
    }
    targetTag.append(scrollableDiv)
}