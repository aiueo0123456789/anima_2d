import { hierarchy } from "../ヒエラルキー.js";
import { renderingParameters } from "../レンダリングパラメーター.js";
import { createCheckbox, createKeyframeSetTag, createobjectDataAndRelateTag, deleteTagDisappearedObject, managerForDOMs, updateDataForUI } from "./制御.js";

function updateAnimationManagerWeight(object, groupID, DOM) {
    let slider = DOM.slider;
    let input = DOM.input;

    slider.value = object.weight;
    input.value = object.weight;
}

function updateAnimationManager(object, groupID, DOM) {

}

function updateHasKeyCheckbox(object, groupID, DOM, others) {
    /** @type {HTMLElement} */
    const checkboxs = DOM;
    for (let i = 0; i < hierarchy.animationManagers.length; i ++) {
        checkboxs[i].checked = hierarchy.animationManagers[i].keyframe.hasKeyFromFrame(renderingParameters.keyfarameCount, 1);
    }
    // DOM.checked = true;
}

function updateAnimationManagerList(object, groupID, DOM) {
    /** @type {HTMLElement} */
    const ul = DOM;

    const hasKeyCheckboxs = [];

    for (const animationManager of hierarchy.animationManagers) {
        let listItem = managerForDOMs.getDOMInObject(animationManager, groupID);
        if (!listItem) {
            listItem = document.createElement("ul");
            const main = document.createElement("div");
            main.classList.add("flex");

            const name = document.createElement("input");
            name.type = "text";
            name.value = animationManager.name;

            const weightSlider = document.createElement("input");
            weightSlider.style.width = "100%";
            weightSlider.type = "range";
            weightSlider.max = 1;
            weightSlider.min = 0;
            weightSlider.value = 0;
            weightSlider.step = 0.00001;

            const weightInput = document.createElement("input");
            weightInput.type = "number";
            weightInput.value = 0;
            weightSlider.max = 1;
            weightSlider.min = 0;
            weightSlider.step = 0.00001;

            managerForDOMs.set(animationManager, groupID, {slider: weightSlider, input: weightInput}, updateAnimationManagerWeight);

            const hasKeyCheckbox = createCheckbox();

            main.append(name, weightSlider, weightInput, hasKeyCheckbox);
            const children = document.createElement("ul");
            children.classList.add("scrollable");
            listItem.append(main, children);
            ul.appendChild(listItem);
        }
        hasKeyCheckboxs.push(listItem.querySelector('[name="checkbox"]').querySelector("input"));
    }
    managerForDOMs.set("現在のフレーム", groupID, hasKeyCheckboxs, updateHasKeyCheckbox);
}

export function displayAnimationManager(targetDiv, isInit, tags, config, groupID) {
    targetDiv.replaceChildren();
    const scrollable = document.createElement("ul");
    scrollable.classList.add("scrollable","gap-2px");
    targetDiv.append(scrollable);

    const scrollableTag = targetDiv.querySelector("ul");

    managerForDOMs.set("アニメーションマネージャー", groupID, scrollableTag, updateAnimationManagerList);
    managerForDOMs.update("アニメーションマネージャー");
}