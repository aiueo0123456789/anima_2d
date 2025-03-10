import { keysDown, stateMachine, toolbar } from "../main.js";
import { activeOrClear } from "../コンテキストメニュー/制御.js";
import { hierarchy } from "../ヒエラルキー.js";
import { renderingParameters } from "../レンダリングパラメーター.js";
import { select } from "./ヒエラルキーの表示.js";
import { createCheckbox, createKeyframeTag, deleteTagDisappearedObject, managerForDOMs, updateDataForUI } from "./制御.js";

const gap = 20;
const startFrame = -10;
const endFrame = 200;

function updateNowFrame(object, groupID, DOM) {
    /** @type {HTMLElement} */
    const nowframe = DOM;
    nowframe.style.left = `${(-startFrame + renderingParameters.keyfarameCount) * gap}px`;
}

function updateTimeline(object, groupID, DOM) {
    /** @type {HTMLElement} */
    const timeSegments = DOM.s;
    if (timeSegments.querySelector("ul")) {
        timeSegments.querySelector("ul").replaceChildren();
        timeSegments.querySelector("ul").remove();
    }
    timeSegments.style.gap = `${gap}px`;
    for (let i = startFrame; i < endFrame; i ++) {
        const timeSegment = document.createElement("div");
        timeSegments.append(timeSegment);
    }
    /** @type {HTMLElement} */
    const timelineHeader = DOM.h;
    if (timelineHeader.querySelector("ul")) {
        timelineHeader.querySelector("ul").replaceChildren();
        timelineHeader.querySelector("ul").remove();
    }
    const frames = document.createElement("ul");
    frames.classList.add("time-frames");
    frames.style.gap = `${gap}px`;
    for (let i = startFrame; i < endFrame; i ++) {
        const timeFrame = document.createElement("div");
        timeFrame.style.setProperty("--label", `'${i}'`);
        frames.append(timeFrame);
    }
    timelineHeader.append(frames)
}

function updateKeyFrame(object, groupID, DOM) {
    DOM.style.left = `${object.frame * gap}px`;
}

function updateKeys(object, groupID, DOM) {
    /** @type {HTMLElement} */
    const ul = DOM;

    for (const key of object.keyframe.keys) {
        let listItem = managerForDOMs.getDOMInObject(key, groupID);

        if (!listItem) {
            listItem = document.createElement("span");
            listItem.classList.add("timeline-animtionKey");
            listItem.style.left = `${key.frame * gap}px`;
            listItem.addEventListener("click", (event) => {
                event.stopPropagation();
                if (keysDown["Shift"]) {
                } else {
                    toolbar.activeActionKeyframe.length = 0;
                }
                if (!toolbar.activeActionKeyframe.includes(key)) {
                    toolbar.activeActionKeyframe.push(key);
                }
                managerForDOMs.update("キーブロック全て")
            })
            managerForDOMs.set(key, groupID, listItem, updateKeyFrame);
            ul.append(listItem);
        }
        listItem.style.backgroundColor = select("rgb(255, 204, 0)","rgb(255, 255, 255)",toolbar.activeActionKeyframe.includes(key));
    }
}

function updateKeyBlocks(object, groupID, DOM) {
    for (const object of hierarchy.animationManagers) {
        managerForDOMs.update(object);
    }
}

function updateKeyBlocksAppendDelete(object, groupID, DOM) {
    /** @type {HTMLElement} */
    const timelineMain = DOM;
    for (const object of hierarchy.animationManagers) {
        let listItem = managerForDOMs.getDOMInObject(object, groupID);
        if (!listItem) {
            listItem = document.createElement("ul");
            listItem.style.height = "20px";
            listItem.style.width = `${toolbar.animtionEndFrame * gap}px`;
            listItem.classList.add("color2");
            managerForDOMs.set(object, groupID, listItem, updateKeys);
            managerForDOMs.update(object);
        }
        timelineMain.append(listItem);
    }
}

function updateChannel(object, groupID, DOM) {
    /** @type {HTMLElement} */
    const channelDiv = DOM;
    const channelHeader = channelDiv.querySelector('[name="h"]');
    const channelMain = channelDiv.querySelector('[name="m"]');
    for (const object of hierarchy.animationManagers) {
        let listItem = managerForDOMs.getDOMInObject(object, groupID);
        if (!listItem) {
            listItem = document.createElement("li");
            const name = document.createElement("input");
            name.type = "text";
            name.value = object.name;
            listItem.append(name);
        }
        channelMain.append(listItem);
    }
}

function header(target) {
    const button = createCheckbox("replay");
    const checkbox = button.querySelector("input");
    checkbox.checked = renderingParameters.isReplay;
    checkbox.addEventListener("change", () => {
        renderingParameters.isReplay = checkbox.checked;
    })
    target.append(button);
}

function updateAppendAnimationManager() {
    managerForDOMs.update("タイムライン-チャンネル");
    managerForDOMs.update("タイムライン-タイムライン-オブジェクト");
}

export function displayTimeLine(targetTag, isInit, tags, config, groupID) {
    targetTag.replaceChildren();
    console.log("displayTimeLine")
    const containerDiv = document.createElement("div");
    containerDiv.classList.add("timeline-grid-w");

    const nowframe = document.createElement("span");
    nowframe.classList.add("time-nowframes");
    nowframe.style.setProperty("--label", `'${20}'`);

    managerForDOMs.set("現在のフレーム", groupID, nowframe, updateNowFrame);

    const channelDiv = document.createElement("div");
    const channelHeader = document.createElement("ul");
    header(channelHeader);
    channelHeader.setAttribute("name","h")
    channelHeader.classList.add("channel-header");
    const channelMain = document.createElement("ul");
    channelMain.setAttribute("name","m")
    channelMain.classList.add("channel-main");
    channelDiv.append(channelHeader, channelMain);

    const timelineDiv = document.createElement("div");
    timelineDiv.classList.add("timeline-container");

    const timelineHeader = document.createElement("ul");
    timelineHeader.setAttribute("name","h")
    timelineHeader.classList.add("timeline-header");

    timelineHeader.append(nowframe);

    const timelineMain = document.createElement("ul");
    timelineMain.classList.add("timeline-main");
    timelineMain.setAttribute("name","m")

    const timeSegments = document.createElement("div");
    timeSegments.classList.add("time-segments");

    const timelineStartToEnd = document.createElement("div");
    timelineStartToEnd.classList.add("timelineStartToEnd");
    timelineStartToEnd.style.left = `${-startFrame * gap}px`;
    timelineStartToEnd.style.width = `${toolbar.animtionEndFrame * gap}px`;

    const timelineMainMain = document.createElement("ul");
    timelineMainMain.classList.add("timeline");
    timelineMainMain.style.left = `${-startFrame * gap}px`;
    timelineMainMain.style.width = `${(toolbar.animtionEndFrame) * gap}px`;

    let isKeysTransForm = false;
    timelineMainMain.addEventListener("mousedown", () => {
        isKeysTransForm = true;
    })

    timelineMainMain.addEventListener("mouseup", () => {
        isKeysTransForm = false;
    })

    timelineMainMain.addEventListener("mousemove", (e) => {
        if (isKeysTransForm) {
            for (const key of toolbar.activeActionKeyframe) {
                key.frame += e.movementX / gap;
                managerForDOMs.update(key);
            }
        }
    })

    timelineMain.append(timelineStartToEnd, timeSegments, timelineMainMain);
    timelineDiv.append(timelineHeader, timelineMain);

    containerDiv.append(channelDiv, timelineDiv);

    managerForDOMs.set("タイムライン-チャンネル", groupID, channelDiv, updateChannel);
    managerForDOMs.set("タイムライン-タイムライン", groupID, {h: timelineHeader, s: timeSegments}, updateTimeline);
    managerForDOMs.set("キーブロック全て", groupID, null, updateKeyBlocks);
    managerForDOMs.set("タイムライン-タイムライン-オブジェクト", groupID, timelineMainMain, updateKeyBlocksAppendDelete);

    managerForDOMs.update("タイムライン-チャンネル", groupID);
    managerForDOMs.update("タイムライン-タイムライン", groupID);
    managerForDOMs.update("タイムライン-タイムライン-オブジェクト", groupID);

    targetTag.append(containerDiv);
}