import { vec2 } from "./ベクトル計算.js";

export class ConvertCoordinate {
    constructor(cvs, camera) {
        this.cvs = cvs;
        this.camera = camera;
    }

    screenPosFromGPUPos(pos) {
        return vec2.addR(vec2.reverseScaleR(vec2.subR(pos,vec2.scaleR([this.cvs.width, this.cvs.height], 0.5)), this.camera.zoom / 2), this.camera.position);
    }

    GPUSizeFromCPU(size) {
        return size / this.camera.zoom;
    }

    sizeClmapFromCPU(size) {
        return size / (Math.max(this.cvs.width, this.cvs.height) / 2);
    }
}