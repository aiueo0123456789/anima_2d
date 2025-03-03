import { keysDown, stateMachine, toolbar } from "../main.js";
import { hierarchy } from "../ヒエラルキー.js";
import { renderingParameters } from "../レンダリングパラメーター.js";
import { select } from "./ヒエラルキーの表示.js";
import { createKeyframeTag, deleteTagDisappearedObject, updateDataForUI } from "./制御.js";

export function displayTimeLine(targetTag, isInit, tags, config) {
    console.log("displayTimeLine")
    if (isInit) {
        config.gap = 50;
        config.endFrame = 300;
        config.startFrame = -10;
        targetTag.className = "grid-main";
        targetTag.replaceChildren();
        const allTag = document.createElement("div");
        allTag.classList.add("timeline-grid-w");
        targetTag.append(allTag);

        const channelsDiv = document.createElement("div");
        channelsDiv.classList.add("channel-body");
        allTag.append(channelsDiv);
        const channelHeader = document.createElement("div");
        channelHeader.classList.add("channel-header");
        const ulForChannelScrollable = document.createElement("ul");
        ulForChannelScrollable.classList.add("scrollable");
        channelsDiv.append(channelHeader,ulForChannelScrollable);

        const timelineMainDiv = document.createElement("div");
        timelineMainDiv.classList.add("timeline-main");

        const timelineContainerDiv = document.createElement("div");
        timelineContainerDiv.classList.add("timeline-container");
        const timelineBodyDiv = document.createElement("div");
        timelineBodyDiv.classList.add("timeline-body");
        const timeLineHeaderDiv = document.createElement("div");
        timeLineHeaderDiv.classList.add("timeline-header")
        const timeLineFramesDiv = document.createElement("div");
        timeLineFramesDiv.classList.add("time-frames");
        timeLineFramesDiv.style.gap = `${config.gap}px`;
        for (let i = config.startFrame; i < config.endFrame; i ++) {
            const timeFrame = document.createElement("div");
            timeFrame.style.setProperty("--label", `'${i}'`);
            timeLineFramesDiv.append(timeFrame)
        }
        // const nowFrameDiv = document.createElement("div");
        // nowFrameDiv.classList.add("time-nowframes");
        // nowFrameDiv.style.setProperty("--label", `'${renderingParameters.keyfarameCount}'`);
        // nowFrameDiv.style.left = `${(renderingParameters.keyfarameCount + Math.abs(startFrame)) * gap}px`;
        const nowFrameDiv = createKeyframeTag(config);
        let nowFrameMove = false;
        timeLineHeaderDiv.addEventListener("mousedown", () => {
            nowFrameMove = true;
        })
        timeLineHeaderDiv.append(timeLineFramesDiv,nowFrameDiv);

        const timeSegmentsDiv = document.createElement("div");
        timeSegmentsDiv.classList.add("time-segments");
        timeSegmentsDiv.style.gap = `${config.gap}px`;
        for (let i = config.startFrame; i < config.endFrame; i ++) {
            const timeSegment = document.createElement("div");
            timeSegmentsDiv.append(timeSegment)
        }

        const timelineStartToEndDiv = document.createElement("div");
        timelineStartToEndDiv.classList.add("timelineStartToEnd");
        timelineStartToEndDiv.style.left = `${Math.abs(config.startFrame) * config.gap}px`;
        timelineStartToEndDiv.style.width = `${toolbar.animtionEndFrame * config.gap}px`;
        const ulForTimeLine = document.createElement("ul");
        ulForTimeLine.style.width = `${toolbar.animtionEndFrame * config.gap}px`;
        ulForTimeLine.classList.add("timeline");
        ulForTimeLine.style.left = `${Math.abs(config.startFrame) * config.gap}px`;
        timelineMainDiv.append(timelineStartToEndDiv,timeSegmentsDiv,ulForTimeLine);
        timelineBodyDiv.append(timeLineHeaderDiv,timelineMainDiv);
        timelineContainerDiv.append(timelineBodyDiv);
        allTag.append(timelineContainerDiv);

        function syncScroll(source, target) {
            target.scrollTop = source.scrollTop;
        }
        timelineContainerDiv.scrollLeft = config.gap * Math.abs(config.startFrame); // スクロールをframe0に持ってくる

        ulForChannelScrollable.addEventListener('scroll', () => syncScroll(ulForChannelScrollable, ulForTimeLine));
        ulForTimeLine.addEventListener('scroll', () => syncScroll(ulForTimeLine, ulForChannelScrollable));

        let isMove = false;
        ulForTimeLine.addEventListener("click", () => {
            toolbar.activeActionKeyframe.length = 0;
            // updateDataForUI["タイムライン"] = true;
        })
        ulForTimeLine.addEventListener("mousedown", () => {
            // updateDataForUI["タイムライン"] = true;
            isMove = true;
        })
        timelineBodyDiv.addEventListener("mouseup", () => {
            isMove = false;
            nowFrameMove = false;
        })
        timelineBodyDiv.addEventListener("mousemove", (event) => {
            if (isMove) {
                for (const key of toolbar.activeActionKeyframe) {
                    key.frame += event.movementX / config.gap;
                }
                if (toolbar.activeActionKeyframe.length) {
                    updateDataForUI["タイムライン"] = true;
                }
            }
            if (nowFrameMove) {
                renderingParameters.setKeyfarameCount((event.clientX - timelineBodyDiv.getBoundingClientRect().left) / config.gap + config.startFrame);
            }
        })

        targetTag.addEventListener("wheel", (event) => {
            if (keysDown["Alt"]) {
                config.gap += event.deltaY / 200;
                config.gap = Math.max(Math.min(70,config.gap), 20);;
                timeLineFramesDiv.style.gap = `${config.gap}px`;
                timeSegmentsDiv.style.gap = `${config.gap}px`;
                timelineStartToEndDiv.style.left = `${Math.abs(config.startFrame) * config.gap}px`;
                timelineStartToEndDiv.style.width = `${toolbar.animtionEndFrame * config.gap}px`;
                ulForTimeLine.style.left = `${Math.abs(config.startFrame) * config.gap}px`;
                nowFrameDiv.style.left = `${(renderingParameters.keyfarameCount + Math.abs(config.startFrame)) * config.gap}px`;
            }
        });
    }
    const allTag = targetTag.querySelector("div");
    const channelDiv = allTag.querySelector(".channel-body");
    const ulForChannelScrollable = channelDiv.querySelector(".scrollable");

    const timelineContainerDiv = allTag.querySelector(".timeline-container");
    const timelineBodyDiv = timelineContainerDiv.querySelector(".timeline-body");

    const timeLineHeaderDiv = timelineBodyDiv.querySelector(".timeline-header");
    // const nowFrameDiv = timeLineHeaderDiv.querySelector(".time-nowframes")
    // nowFrameDiv.style.setProperty("--label", `'${Math.round(renderingParameters.keyfarameCount)}'`);
    // nowFrameDiv.style.left = `${(renderingParameters.keyfarameCount + Math.abs(startFrame)) * gap}px`;
    const timelineMainDiv = timelineBodyDiv.querySelector(".timeline-main");
    const ulForTimeLine = timelineMainDiv.querySelector(".timeline");
    let offset = 0;
    const createAnimtionKeySpan = (target, mapTarget, key) => {
        const animationKeyDiv = document.createElement("span");
        animationKeyDiv.classList.add("timeline-animtionKey");
        animationKeyDiv.style.left = `${key.frame * config.gap}px`;
        animationKeyDiv.style.backgroundColor = select("rgb(255, 204, 0)","rgb(0, 55, 255)",toolbar.activeActionKeyframe.includes(key));
        animationKeyDiv.addEventListener("click", (event) => {
            event.stopPropagation();
            if (keysDown["Shift"]) {
            } else {
                toolbar.activeActionKeyframe.length = 0;
            }
            if (!toolbar.activeActionKeyframe.includes(key)) {
                toolbar.activeActionKeyframe.push(key);
                updateDataForUI["タイムライン"] = true;
            }
        })
        mapTarget.set(key, animationKeyDiv)
        target.append(animationKeyDiv);
    };
    for (const object of hierarchy.animationManagers) {
        if (tags.has(object)) { // オブジェクト用のタグがあるか
            const data = tags.get(object);
            const liForObject = data[0];
            const animationKeysDiv = data[1];
            for (const key of object.keyframe.keys) {
                if (data[2].has(key)) {
                    const animationKeyDiv = data[2].get(key);
                    animationKeyDiv.style.left = `${key.frame * config.gap}px`;
                    animationKeyDiv.style.backgroundColor = select("rgb(255, 204, 0)","rgb(0, 55, 255)",toolbar.activeActionKeyframe.includes(key));
                } else {
                    createAnimtionKeySpan(animationKeysDiv,data[2],key);
                }
            }
        } else {
            const liForObject = document.createElement("li");
            liForObject.style.backgroundColor = `rgb(0,0,0,${offset % 2 / 10})`;
            const nameInputTag = document.createElement("input");
            nameInputTag.style.height = "20px";
            nameInputTag.type = "text";
            nameInputTag.value = object.name;
            liForObject.append(nameInputTag);
            liForObject.addEventListener("click", () => {
            })
            ulForChannelScrollable.append(liForObject);

            const keyMap = new Map();
            const animationKeysDiv = document.createElement("li");
            animationKeysDiv.style.backgroundColor = `rgb(0,0,0,${offset % 2 / 10})`;
            ulForTimeLine.append(animationKeysDiv);
            for (const key of object.keyframe.keys) {
                createAnimtionKeySpan(animationKeysDiv,keyMap,key);
            }
            tags.set(object, [liForObject, animationKeysDiv, keyMap]);
        }
        offset ++;
    }

    deleteTagDisappearedObject(tags);

}