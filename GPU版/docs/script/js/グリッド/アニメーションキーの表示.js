import { stateMachine } from '../main.js';
import { hierarchy } from '../ヒエラルキー.js';
import { select } from './ヒエラルキーの表示.js';
import { createobjectDataAndRelateTag, deleteTagDisappearedObject, resetTag, updateDataForUI } from "./制御.js";

export function displayAnimationKey(targetTag, isInit, tags, config) {
    console.log("displayAnimationKey")
    if (isInit) {
        resetTag(tags);
        targetTag.replaceChildren();
        const scrollable = document.createElement("ul");
        scrollable.classList.add("scrollable","gap-2px");
        targetTag.append(scrollable);
    }

    const scrollableTag = targetTag.querySelector("ul");

    let offset = 0;

    if (config.lastReferenceObject == stateMachine.state.data.object) {
        if (stateMachine.state.data.object) {
            const animationKey = stateMachine.state.data.object.animationBlock.animationBlock;
            for (const animation of animationKey) {
                if (tags.has(animation)) {
                    const tagsGrou = tags.get(animation);
                    tagsGrou.style.backgroundColor = select(`rgb(70,70,170)`, `rgb(0,0,0,${offset % 2 / 10})`, stateMachine.state.data.animation == animation);
                } else {
                    console.log("タグの生成")
                    const tagsGrou = document.createElement("div");
                    tagsGrou.className = "flex-gap10px";
                    tagsGrou.style.backgroundColor = select(`rgb(70,70,170)`, `rgb(0,0,0,${offset % 2 / 10})`, stateMachine.state.data.animation == animation);
                    const nameInputTag = document.createElement("input");
                    nameInputTag.style.width = "150px";
                    nameInputTag.type = "text";
                    nameInputTag.value = animation.name;
                    nameInputTag.addEventListener("change", () => {
                        animation.name = nameInputTag.value;
                        updateDataForUI["アニメーション"] = true;
                    })
                    const weightSliderInputTag = document.createElement("input");
                    weightSliderInputTag.style.width = "100%";
                    weightSliderInputTag.type = "range";
                    weightSliderInputTag.max = 1;
                    weightSliderInputTag.min = 0;
                    weightSliderInputTag.step = 0.00001;
                    createobjectDataAndRelateTag(animation, "weight", weightSliderInputTag);
    
                    const weightInputTag = document.createElement("input");
                    weightInputTag.type = "number";
                    weightInputTag.style.width = "60px";
                    weightInputTag.max = 1;
                    weightInputTag.min = 0;
                    weightInputTag.step = 0.00001;
                    createobjectDataAndRelateTag(animation, "weight", weightInputTag);
                    // スライダーのイベントリスナーを追加
                    weightSliderInputTag.addEventListener('input', () => {
                        animation.weight = Number(weightSliderInputTag.value);
                        weightInputTag.value = Number(weightSliderInputTag.value);
                    });
    
                    // マネージャーの選択
                    const managerSelectTag = document.createElement("select");
                    if (true) {
                        const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
                        sleectElement.value = ""; // h1要素に配列の要素を設定
                        sleectElement.textContent = "なし"; // h1要素に配列の要素を設定
                        if (!animation.belongAnimationManager) {
                            sleectElement.selected = true;
                        }
                        managerSelectTag.append(sleectElement);
                    }
                    hierarchy.animationManagers.forEach(manager => {
                        const sleectElement = document.createElement('option'); // h1要素に配列の要素を設定
                        sleectElement.value = `${manager.name}`; // h1要素に配列の要素を設定
                        sleectElement.textContent = `${manager.name}`; // h1要素に配列の要素を設定
                        if (animation.belongAnimationManager == manager) {
                            sleectElement.selected = true;
                        }
                        managerSelectTag.append(sleectElement);
                    })
    
                    // スライダーのイベントリスナーを追加
                    weightSliderInputTag.addEventListener('input', () => {
                        animation.weight = Number(weightSliderInputTag.value);
                        weightInputTag.value = Number(weightSliderInputTag.value);
                    });
    
                    tagsGrou.addEventListener("click", () => {
                        stateMachine.externalInputs["オブジェクトのアニメーションキー選択"] = animation;
                    })
                    tagsGrou.append(nameInputTag, weightSliderInputTag, weightInputTag, managerSelectTag);
                    tags.set(animation, tagsGrou);
                    scrollableTag.append(tagsGrou);
                }
                offset ++;
            }
        }
    } else {
        config.lastReferenceObject = stateMachine.state.data.object;
        displayAnimationKey(targetTag, true, tags, config)
    }
}