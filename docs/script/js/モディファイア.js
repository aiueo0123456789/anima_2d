import { device,GPU } from "./webGPU.js";
import { Children } from "./子要素.js";
import { AnimationBlock, VerticesAnimation } from "./アニメーション.js";
import { vec2 } from "./ベクトル計算.js";
import { v_sr,c_sr,c_u_u,c_srw,c_srw_sr,c_srw_u_u,c_srw_sr_u_u,v_sr_u, c_sr_sr, baseTransformPipeline } from "./GPUObject.js";
import { BBox } from "./BBox.js";
import { setBaseBBox, setParentModifierWeight, sharedDestroy } from "./オブジェクトで共通の処理.js";
import { createID } from "./グリッド/制御.js";

export class Modifier {
    constructor(name) {
        this.id = createID();
        this.name = name;
        this.isInit = false;
        this.type = "モディファイア";
        this.isChange = false;
        this.baseTransformIsLock = false;

        this.verticesNum = null;
        this.meshesNum = null;
        this.fineness = [1,1];
        this.u_finenessBuffer = GPU.createUniformBuffer(2 * 4, undefined, ["u32"]);
        this.RVrt_coBuffer = null;
        this.parentWeightBuffer = null;
        this.modifierDataGroup = null;
        this.modifierTransformDataGroup = null;

        this.modifierTransformGroup = null;

        this.collisionVerticesGroup = null;

        this.updateModifierRenderVerticesGroup = null;
        this.adaptAnimationGroup1 = null;

        this.GUIMeshRenderGroup = null;
        this.GUIVerticesRenderGroup = null;

        this.BBoxArray = [0,0,0,0];
        this.BBoxBuffer = GPU.createStorageBuffer(4 * 4, undefined, ["f32"]);
        this.BBoxRenderGroup = GPU.createGroup(v_sr, [{item: this.BBoxBuffer, type: 'b'}]);

        this.baseBBoxArray = [0,0,0,0];
        this.baseBBoxBuffer = GPU.createStorageBuffer(4 * 4, undefined, ["f32"]);

        this.animationBlock = new AnimationBlock(this, VerticesAnimation);
        this.renderBBoxData = {max: [], min: []};

        this.boundingBox = {max: [], min: []};
        this.u_boundingBoxBuffer = GPU.createUniformBuffer(2 * (2) * 4, undefined, ["f32"]);

        this.modifierDataGroup = GPU.createGroup(c_u_u, [{item: this.u_boundingBoxBuffer, type: 'b'}, {item: this.u_finenessBuffer, type: 'b'}]);

        this.parent = "";

        this.children = new Children();

        this.init({fineness: [1,1], boundingBox: {min: [-100,-100], max: [100,100]}, animationKeyDatas: []}); // 初期化
    }

    // gc対象にしてメモリ解放
    destroy() {
        sharedDestroy(this);
        this.name = null;
        this.type = null;
        this.verticesNum = null;
        this.fineness = null;
        this.u_finenessBuffer = null;
        this.RVrt_coBuffer = null;
        this.parentWeightBuffer = null;
        this.modifierDataGroup = null;
        this.modifierTransformDataGroup = null;

        this.modifierTransformGroup = null;

        this.collisionVerticesGroup = null;

        this.updateModifierRenderVerticesGroup = null;
        this.adaptAnimationGroup1 = null;

        this.animationBlock = null;
        this.renderBBoxData = null;

        this.boundingBox = null;
        this.u_boundingBoxBuffer = null;

        this.parent = "";

        this.children = null;
    }

    init(data) {
        this.fineness = data.fineness;
        this.verticesNum = (this.fineness[0] + 1) * (this.fineness[1] + 1);
        this.meshesNum = this.fineness[0] * this.fineness[1];

        this.boundingBox = data.boundingBox;
        GPU.writeBuffer(this.u_boundingBoxBuffer, new Float32Array([...this.boundingBox.max, ...this.boundingBox.min]));
        GPU.writeBuffer(this.u_finenessBuffer, new Uint32Array(this.fineness));
        this.animationBlock.setSaveData(data.animationKeyDatas);

        this.s_baseVerticesPositionBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, this.createVertices(data.fineness, data.boundingBox).flat(), ["f32"]);
        this.RVrt_coBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, undefined, ["f32"]);

        this.parentWeightBuffer = GPU.createStorageBuffer(this.verticesNum * (4 + 4) * 4, undefined, ["f32"]);
        this.isInit = true;

        this.isChange = true;

        this.setBindGroup();
        setBaseBBox(this);
    }

    setChildrenBBox() {
        const childrenBBox = [];
        for (const child of this.children.objects) {
            childrenBBox.push(...child.baseBBoxArray);
        }
        console.log(childrenBBox);
        this.init({fineness: this.fineness, boundingBox: BBox(childrenBBox), animationKeyDatas: []});
        this.children.weightReset();
        setParentModifierWeight(this);
    }

    updateFineness(newFineness) {
        this.init({fineness: newFineness, boundingBox: this.boundingBox, animationKeyDatas: []});
        this.children.weightReset();
        setParentModifierWeight(this);
    }

    createVertices(fineness, boundingBox) {
        const result = [];
        for (let y = 0; y < fineness[1] + 1; y ++) {
            for (let x = 0; x < fineness[0] + 1; x ++) {
                const pos = vec2.addR(vec2.mulR(vec2.divR([x,y], fineness),vec2.subR(boundingBox.max,boundingBox.min)), boundingBox.min);
                result.push(pos);
            }
        }
        return result;
    }

    setBindGroup() {
        this.collisionVerticesGroup = GPU.createGroup(c_sr, [{item: this.RVrt_coBuffer, type: 'b'}]);
        this.updateModifierRenderVerticesGroup = GPU.createGroup(c_srw_sr_u_u, [{item: this.RVrt_coBuffer, type: "b"}, {item: this.RVrt_coBuffer, type: 'b'}, {item: this.u_boundingBoxBuffer, type: "b"}, {item: this.u_finenessBuffer, type: "b"}]);

        this.adaptAnimationGroup1 = GPU.createGroup(c_srw, [{item: this.RVrt_coBuffer, type: 'b'}]);

        this.modifierTransformDataGroup = GPU.createGroup(c_sr_sr, [{item: this.s_baseVerticesPositionBuffer, type: 'b'}, {item: this.RVrt_coBuffer, type: 'b'}]);

        this.modifierTransformGroup = GPU.createGroup(c_srw_sr, [{item: this.RVrt_coBuffer, type: "b"}, {item: this.parentWeightBuffer, type: "b"}]);

        this.calculateAllBBoxGroup = GPU.createGroup(c_srw_sr, [{item: this.BBoxBuffer, type: 'b'}, {item: this.RVrt_coBuffer, type: 'b'}]);
        this.calculateAllBaseBBoxGroup = GPU.createGroup(c_srw_sr, [{item: this.baseBBoxBuffer, type: 'b'}, {item: this.s_baseVerticesPositionBuffer, type: 'b'}]);
        this.GUIVerticesRenderGroup = GPU.createGroup(v_sr, [{item: this.RVrt_coBuffer, type: 'b'}]);
        this.GUIMeshRenderGroup = GPU.createGroup(v_sr_u, [{item: this.RVrt_coBuffer, type: 'b'}, {item: this.u_finenessBuffer, type: 'b'}]);
    }

    async getSaveData() {
        const animationKeyDatas = await this.animationBlock.getSaveData()
        return {
            name: this.name,
            type: this.type,
            boundingBox: this.boundingBox,
            fineness: this.fineness,
            animationKeyDatas: animationKeyDatas,
        };
    }
}