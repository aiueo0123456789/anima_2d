import { toolbar } from "./main.js";
import { updateDataForUI } from "./グリッド/制御.js";
import { hierarchy } from "./ヒエラルキー.js";

export let keyfarameCount = 0;
class RenderingParameters {
    constructor() {
        this.keyfarameCount = 0;
        this.keyfarameStep = 0.2;
        this.isReplay = false;
    }

    setKeyfarameCount(frame) {
        this.keyfarameCount = frame;
        hierarchy.runHierarchy();
    }

    updateKeyfarameCount() {
        if (!this.isReplay) return ;
        this.keyfarameCount += this.keyfarameStep;
        this.keyfarameCount %= toolbar.animtionEndFrame;
    }
}

export const renderingParameters = new RenderingParameters();