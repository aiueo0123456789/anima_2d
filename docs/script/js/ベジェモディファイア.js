import { device,GPU } from "./webGPU.js";
import { Children } from "./子要素.js";
import { AnimationBlock, VerticesAnimation } from "./アニメーション.js";
import { v_sr,c_sr_sr,c_sr,c_srw,c_srw_sr } from "./GPUObject.js";
import { setBaseBBox, setParentModifierWeight, sharedDestroy } from "./オブジェクトで共通の処理.js";
import { createID } from "./グリッド/制御.js";

export class LineModifier {
    constructor(name) {
        this.id = createID();
        this.name = name;
        this.isInit = false;
        this.isChange = false;

        this.CPUBaseVerticesPositionData = [];
        this.s_baseVerticesPositionBuffer = null;
        this.RVrt_coBuffer = null;
        this.s_controlPointBuffer = null;
        this.type = "ベジェモディファイア";
        this.renderBBoxData = {max: [1,1], min: [-1,-1]};
        this.animationBlock = new AnimationBlock(this, VerticesAnimation);

        this.modifierDataGroup = null;
        this.modifierTransformDataGroup = null;
        this.adaptAnimationGroup1 = null;
        this.parentWeightBuffer = null;

        this.calculateAllBBoxGroup = null;
        this.GUIrenderGroup = null;

        this.BBoxArray = [0,0,0,0];
        this.BBoxBuffer = GPU.createStorageBuffer(4 * 4, undefined, ["f32"]);
        this.BBoxRenderGroup = GPU.createGroup(v_sr, [{item: this.BBoxBuffer, type: 'b'}]);

        this.baseBBoxArray = [0,0,0,0];
        this.baseBBoxBuffer = GPU.createStorageBuffer(4 * 4, undefined, ["f32"]);

        this.verticesNum = 0;
        this.pointNum = 0;
        this.baseTransformIsLock = false;

        this.children = new Children();

        this.init({baseVertices: [-100,0, -150,0, -50,50, 100,0, 50,-50, 150,0], animationKeyDatas: []});
    }

    // gc対象にしてメモリ解放
    destroy() {
        sharedDestroy(this);
        this.name = null;
        this.CPUBaseVerticesPositionData = null;
        this.s_baseVerticesPositionBuffer = null;
        this.RVrt_coBuffer = null;
        this.s_controlPointBuffer = null;
        this.type = null;
        this.renderBBoxData = null;
        this.animationBlock = null;
        this.modifierTransformDataGroup = null;
        this.adaptAnimationGroup1 = null;
        this.parentWeightBuffer = null;

        this.calculateAllBBoxGroup = null;
        this.GUIrenderGroup = null;

        this.BBoxArray = null;
        this.BBoxBuffer = null;
        this.BBoxRenderGroup = null;

        this.roop = null;
        this.verticesNum = null;
        this.pointNum = null;
        this.baseTransformIsLock = null;

        this.children = null;
    }

    init(data) {
        console.log(data)
        this.verticesNum = data.baseVertices.length / 2;
        this.pointNum = this.verticesNum / 3;

        this.animationBlock.setSaveData(data.animationKeyDatas);

        this.parentWeightBuffer = GPU.createStorageBuffer(4, undefined, ['f32']);

        this.s_baseVerticesPositionBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, data.baseVertices, ["f32","f32","f32","f32","f32","f32"]);
        this.RVrt_coBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, undefined, ["f32","f32","f32","f32","f32","f32"]);

        this.isInit = true;
        this.isChange = true;

        this.setGroup();
        setBaseBBox(this);
    }

    addBaseVertices(add) {
        const newBuffer = GPU.createStorageBuffer((this.verticesNum + add.length) * (2) * 4, undefined, ["f32","f32","f32","f32","f32","f32"]);
        GPU.copyBuffer(this.s_baseVerticesPositionBuffer, newBuffer);
        GPU.writeBuffer(newBuffer, new Float32Array(add.flat(1)), this.verticesNum * (2) * 4);
        this.verticesNum = this.verticesNum + add.length;
        this.pointNum = this.verticesNum / 3;
        this.s_baseVerticesPositionBuffer = newBuffer;
        this.RVrt_coBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, undefined, ["f32","f32","f32","f32","f32","f32"]);
        this.setGroup();
        this.isChange = true;

        this.children.weightReset();
        setParentModifierWeight(this);
    }

    subBaseVertices(sub) {
        sub = sub.filter((x) => x % 3 == 0);
        sub = sub.map((x) => x / 3);
        sub.sort((a,b) => a - b);
        const indexs = [];
        let lastIndex = 0;
        for (const subIndex of sub) {
            if (subIndex - lastIndex >= 1) {
                indexs.push([lastIndex,subIndex - 1]);
            }
            lastIndex = subIndex + 1;
        }
        if (lastIndex < this.pointNum) {
            indexs.push([lastIndex,this.pointNum]);
        }
        GPU.consoleBufferData(this.s_baseVerticesPositionBuffer);
        const newBuffer = GPU.createStorageBuffer((this.verticesNum - sub.length * 3) * (2) * 4, undefined, ["f32","f32","f32","f32","f32","f32"]);
        let offset = 0;
        for (const rOffset of indexs) {
            GPU.copyBuffer(this.s_baseVerticesPositionBuffer, newBuffer, rOffset[0] * 3 * 2 * 4, offset, (rOffset[1] - rOffset[0]) * 3 * 2 * 4);
            offset += (rOffset[1] - rOffset[0] + 1) * 3 * 2 * 4;
        }
        GPU.consoleBufferData(newBuffer);
        this.verticesNum = this.verticesNum - sub.length * 3;
        this.pointNum = this.verticesNum / 3;
        this.s_baseVerticesPositionBuffer = newBuffer;
        this.RVrt_coBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, undefined, ["f32","f32","f32","f32","f32","f32"]);
        this.setGroup();
        this.isChange = true;

        this.children.weightReset();
        setParentModifierWeight(this);
    }

    setGroup() {
        this.modifierDataGroup = GPU.createGroup(c_sr, [{item: this.s_baseVerticesPositionBuffer, type: "b"}]);
        this.modifierTransformDataGroup = GPU.createGroup(c_sr_sr, [{item: this.s_baseVerticesPositionBuffer, type: "b"}, {item: this.RVrt_coBuffer, type: "b"}]);
        this.adaptAnimationGroup1 = GPU.createGroup(c_srw, [{item: this.RVrt_coBuffer, type: 'b'}]);
        this.collisionVerticesGroup = GPU.createGroup(c_sr, [{item: this.RVrt_coBuffer, type: 'b'}]);

        this.modifierTransformGroup = GPU.createGroup(c_srw_sr, [{item: this.RVrt_coBuffer, type: "b"}, {item: this.parentWeightBuffer, type: "b"}]);

        this.calculateAllBBoxGroup = GPU.createGroup(c_srw_sr, [{item: this.BBoxBuffer, type: 'b'}, {item: this.RVrt_coBuffer, type: 'b'}]);
        this.calculateAllBaseBBoxGroup = GPU.createGroup(c_srw_sr, [{item: this.baseBBoxBuffer, type: 'b'}, {item: this.s_baseVerticesPositionBuffer, type: 'b'}]);
        this.GUIrenderGroup = GPU.createGroup(v_sr, [{item: this.RVrt_coBuffer, type: 'b'}]);
    }

    async getSaveData() {
        const animationKeyDatas = await this.animationBlock.getSaveData()
        return {
            name: this.name,
            type: this.type,
            baseVertices: [...await GPU.getF32BufferData(this.s_baseVerticesPositionBuffer)],
            animationKeyDatas: animationKeyDatas,
        };
    }
}