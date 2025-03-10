import { device,GPU } from "./webGPU.js";
import { v_u, c_u_u } from "./GPUObject.js";
import { Children } from "./子要素.js";
import { AnimationBlock, RotateAnimation } from "./アニメーション.js";
import { createID } from "./グリッド/制御.js";
import { sharedDestroy } from "./オブジェクトで共通の処理.js";

export class RotateModifier {
    constructor(name) {
        this.id = createID();
        this.name = name;
        this.isInit = false;
        this.isChange = false;

        this.type = "回転モディファイア";
        this.rotateData = [0,0,1,0];
        this.baseData = [0,0,1,0];
        this.animationBlock = new AnimationBlock(this, RotateAnimation);
        this.baseDataBuffer = GPU.createUniformBuffer((2 + 1 + 1) * 4, undefined, ["f32"]);
        GPU.writeBuffer(this.baseDataBuffer, new Float32Array(this.baseData));
        this.rotateDataBuffer = GPU.createUniformBuffer((2 + 1 + 1) * 4, undefined, ["f32"]);
        this.modifierTransformDataGroup = GPU.createGroup(c_u_u, [{item: this.baseDataBuffer, type: "b"},{item: this.rotateDataBuffer, type: "b"}]);

        this.BBoxRenderGroup = GPU.createGroup(v_u, [{item: this.rotateDataBuffer, type: "b"}]);

        this.BBoxArray = [this.rotateData[0],this.rotateData[1],this.rotateData[0],this.rotateData[1]];
        this.baseBBoxArray = [this.baseData[0],this.baseData[1],this.baseData[0],this.baseData[1]];

        this.children = new Children();

        this.parent = "";

        this.init({baseData: [0,0,1,0], animationKeyDatas: []});
    }

    // gc対象にしてメモリ解放
    destroy() {
        sharedDestroy(this);
        this.name = null;
        this.type = null;
        this.angle = null;
        this.scale = null;
        this.movement = null;
        this.renderData = null; // [x,y,angle]
        this.renderBBoxData = null;
        this.animationBlock = null;
        this.rotateDataBuffer = null;
        this.modifierTransformDataGroup = null;

        this.children = null;

        this.parent = "";
    }

    init(data) {
        this.updateBaseData(data.baseData);
        this.animationBlock.setSaveData(data.animationKeyDatas);

        this.isInit = true;
        this.isChange = true;
    }

    updateBaseData(newData) {
        this.baseData = newData;
        this.baseBBoxArray = [this.baseData[0],this.baseData[1],this.baseData[0],this.baseData[1]];
        GPU.writeBuffer(this.baseDataBuffer, new Float32Array(newData));
    }

    async getSaveData() {
        const animationKeyDatas = await this.animationBlock.getSaveData();
        return {
            name: this.name,
            type: this.type,
            baseData: this.baseData,
            animationKeyDatas: animationKeyDatas,
        };
    }
}