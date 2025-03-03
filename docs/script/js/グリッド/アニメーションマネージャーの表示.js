import { hierarchy } from "../ヒエラルキー.js";
import { createKeyframeSetTag, createobjectDataAndRelateTag, deleteTagDisappearedObject, updateDataForUI } from "./制御.js";

export function displayAnimationManager(targetTag, isInit, tags) {
    if (isInit) {
        targetTag.replaceChildren();
        const scrollable = document.createElement("ul");
        scrollable.classList.add("scrollable","gap-2px");
        targetTag.append(scrollable);
    }

    const scrollableTag = targetTag.querySelector("ul");

    let offset = 0;

    for (const animationManager of hierarchy.animationManagers) {
        if (tags.has(animationManager)) {
        } else {
            const tagsGrou = document.createElement("div");
            tagsGrou.className = "flex-gap10px";
            tagsGrou.style.backgroundColor = `rgb(0,0,0,${offset % 2 / 10})`;
            const nameInputTag = document.createElement("input");
            nameInputTag.style.width = "150px";
            nameInputTag.type = "text";
            nameInputTag.value = animationManager.name;
            nameInputTag.addEventListener("change", () => {
                hierarchy.changeObjectName(animationManager, nameInputTag.value);
            })
            const weightSliderInputTag = document.createElement("input");
            weightSliderInputTag.style.width = "100%";
            weightSliderInputTag.type = "range";
            weightSliderInputTag.max = 1;
            weightSliderInputTag.min = 0;
            weightSliderInputTag.step = 0.00001;
            createobjectDataAndRelateTag(animationManager, "weight", weightSliderInputTag);

            const weightInputTag = document.createElement("input");
            weightInputTag.type = "number";
            weightInputTag.style.width = "60px";
            weightInputTag.max = 1;
            weightInputTag.min = 0;
            weightInputTag.step = 0.00001;
            createobjectDataAndRelateTag(animationManager, "weight", weightInputTag);
            // スライダーのイベントリスナーを追加
            weightSliderInputTag.addEventListener('input', () => {
                animationManager.weight = Number(weightSliderInputTag.value);
                weightInputTag.value = Number(weightSliderInputTag.value);
            });
            const weightKeyFrameSetTag = createKeyframeSetTag(animationManager, weightInputTag);

            const containedAnimationsDiv = document.createElement("ul");
            containedAnimationsDiv.classList.add("scrollable","gap-2px");
            containedAnimationsDiv.style.height = "fit-content";
            containedAnimationsDiv.style.maxHeight = "200px";
            for (const animation of animationManager.containedAnimations) {
                const nameTag = document.createElement("p");
                nameTag.textContent = animation.name;
                containedAnimationsDiv.append(nameTag);
            }
            tagsGrou.append(nameInputTag, weightSliderInputTag, weightInputTag, weightKeyFrameSetTag);
            tags.set(animationManager, tagsGrou);
            scrollableTag.append(tagsGrou, containedAnimationsDiv);
        }
        offset ++;
    }

        deleteTagDisappearedObject(tags);

}