import { device,GPU } from "./webGPU.js";
import { AnimationBlock, VerticesAnimation } from "./アニメーション.js";
import { v_sr_sr,c_srw,c_srw_sr,c_srw_sr_sr,v_sr_sr_f_t,v_sr, c_sr,v_sr_sr_f_t_t_u, isNotTexture, c_sr_sr } from "./GPUObject.js";
import { renderObjectManager } from "./main.js";
import { setBaseBBox, setParentModifierWeight, sharedDestroy } from "./オブジェクトで共通の処理.js";
import { createID } from "./グリッド/制御.js";
import { indexOfSplice } from "./utility.js";

export class GraphicMesh {
    constructor(name) {
        this.id = createID();
        this.name = name;
        this.type = "グラフィックメッシュ";
        this.isInit = false;
        this.baseTransformIsLock = false;
        this.isHide = true;
        this.zIndex = 0;
        this.delete = false;

        this.isChange = false;

        // バッファの宣言
        this.s_baseVerticesPositionBuffer = null;
        this.s_baseVerticesUVBuffer = null;
        this.RVrt_coBuffer = null;
        this.v_meshIndexBuffer = null;
        this.s_meshIndexBuffer = null;
        this.parentWeightBuffer = null;
        this.modifierType = 0;
        this.texture = null;
        this.textureView = null;

        // グループの宣言
        this.adaptAnimationGroup1 = null;
        this.renderGroup = null;
        this.modifierTransformGroup = null;
        this.collisionVerticesGroup = null;
        this.collisionMeshGroup = null;
        this.collisionMeshResultBuffer = null;

        // その他
        this.animationBlock = new AnimationBlock(this, VerticesAnimation);

        this.BBoxArray = [0,0,0,0];
        this.BBoxBuffer = GPU.createStorageBuffer(4 * 4, undefined, ["f32"]);
        this.BBoxRenderGroup = GPU.createGroup(v_sr, [{item: this.BBoxBuffer, type: 'b'}]);

        this.baseBBoxArray = [0,0,0,0];
        this.baseBBoxBuffer = GPU.createStorageBuffer(4 * 4, undefined, ["f32"]);

        this.verticesNum = null;
        this.meshesNum = null;

        this.parent = "";

        this.renderingTargetTexture = null;
        this.maskTargetTexture = null;
        this.changeMaskTexture(renderObjectManager.searchMaskTextureFromName("base"));
        this.maskTypeBuffer = GPU.createUniformBuffer(4, undefined, ["f32"]);
        GPU.writeBuffer(this.maskTypeBuffer, new Float32Array([0])); // 0　マスク 反転マスク

        // this.init();
    }

    // gc対象にしてメモリ解放
    destroy() {
        sharedDestroy(this);
        this.delete = true;
        if (this.maskTargetTexture) {
            indexOfSplice(this.maskTargetTexture.useObjects, this);
        }
        if (this.renderingTargetTexture) {
            indexOfSplice(this.renderingTargetTexture.renderingObjects, this);
        }
        this.name = null;
        this.type = null;
        this.baseTransformIsLock = null;
        this.isHide = null;
        this.zIndex = null;
        // ブッファの宣言
        this.s_baseVerticesPositionBuffer = null;
        this.s_baseVerticesUVBuffer = null;
        this.RVrt_coBuffer = null;
        this.v_meshIndexBuffer = null;
        this.s_meshIndexBuffer = null;
        this.parentWeightBuffer = null;
        this.texture = null;
        this.textureView = null;

        // グループの宣言
        this.adaptAnimationGroup1 = null;
        this.renderGroup = null;
        this.modifierTransformGroup = null;
        this.collisionVerticesGroup = null;
        this.collisionMeshGroup = null;
        this.collisionMeshResultBuffer = null;

        // その他
        this.animationBlock = null;

        this.verticesNum = null;
        this.meshesNum = null;

        this.parent = "";
    }

    async init(data) {
        if (data.texture) {
            this.texture = GPU.createTexture2D([data.texture.width, data.texture.height, 1],"rgba8unorm");
            await GPU.copyBase64ToTexture(this.texture, data.texture.data);
        } else {
            this.textureView = isNotTexture;
        }

        this.zIndex = data.zIndex;
        this.verticesNum = data.baseVerticesPosition.length / 2;
        this.meshesNum = data.meshIndex.length / 4;
        this.s_baseVerticesPositionBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, data.baseVerticesPosition, ['f32','f32']);
        this.s_baseVerticesUVBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, data.baseVerticesUV, ['f32','f32']);
        this.RVrt_coBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, undefined, ['f32']);
        this.parentWeightBuffer = GPU.createStorageBuffer(4, undefined, ['f32']);

        this.v_meshIndexBuffer = GPU.createVertexBuffer(this.meshesNum * 3 * 4, data.meshIndex.filter((x,i) => (i + 1) % 4 != 0), ['u32']); // [i0,i1,i2,padding,...] -> [i0,i1,i2,...]
        this.s_meshIndexBuffer = GPU.createStorageBuffer(this.meshesNum * 4 * 4, data.meshIndex, ['u32']);

        this.animationBlock.setSaveData(data.animationKeyDatas);

        this.textureView = this.texture.createView(); // これを先に処理しようとするとエラーが出る

        if (data.renderingTargetTexture) {
            this.changeRenderingTarget(renderObjectManager.searchMaskTextureFromName(data.renderingTargetTexture));
        }
        this.changeMaskTexture(renderObjectManager.searchMaskTextureFromName(data.maskTargetTexture));

        this.isInit = true;
        this.isChange = true;
        this.setGroup();
        setBaseBBox(this);
    }

    setMeshData(vertices, uv, mesh) {
        this.verticesNum = vertices.length;
        this.meshesNum = mesh.length;
        this.s_baseVerticesPositionBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, vertices.flat(), ['f32','f32']);
        this.s_baseVerticesUVBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, uv.flat(), ['f32','f32']);
        this.RVrt_coBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, undefined, ['f32']);
        this.parentWeightBuffer = GPU.createStorageBuffer(4, undefined, ['f32']);

        this.v_meshIndexBuffer = GPU.createVertexBuffer(this.meshesNum * 3 * 4, mesh.flat(), ['u32']);
        this.s_meshIndexBuffer = GPU.createStorageBuffer(this.meshesNum * 4 * 4, mesh.map((x) => [...x, 0]).flat(), ['u32']);

        if (!this.isInit && this.texture) {
            this.isInit = true;
        }

        this.isChange = true;

        this.baseTransformIsLock = true;

        this.setGroup();
        setBaseBBox(this);
        setParentModifierWeight(this);
    }

    changeMaskTexture(target) {
        if (this.maskTargetTexture) {
            indexOfSplice(this.maskTargetTexture.useObjects, this);
        }
        this.maskTargetTexture = target;
        this.maskTargetTexture.useObjects.push(this);
        if (this.isInit) {
            this.renderGroup = GPU.createGroup(v_sr_sr_f_t_t_u, [this.RVrt_coBuffer, {item: this.s_baseVerticesUVBuffer, type: 'b'}, {item: this.textureView, type: 't'}, {item: this.maskTargetTexture.textureView, type: 't'}, {item: this.maskTypeBuffer, type: "b"}]);
        }
    }

    changeRenderingTarget(target) {
        if (this.renderingTargetTexture) {
            indexOfSplice(this.renderingTargetTexture.renderingObjects, this);
        }
        this.renderingTargetTexture = target;
        this.renderingTargetTexture.renderingObjects.push(this);
        this.isChange = true;
    }

    addBaseVertices(add) {
        const newBuffer = GPU.createStorageBuffer((this.verticesNum + add.length) * (2) * 4, undefined, ["f32","f32"]);
        GPU.copyBuffer(this.s_baseVerticesPositionBuffer, newBuffer);
        GPU.writeBuffer(newBuffer, new Float32Array(add.flat(1)), this.verticesNum * (2) * 4);
        this.verticesNum = this.verticesNum + add.length;
        this.s_baseVerticesPositionBuffer = newBuffer;
        this.RVrt_coBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, undefined, ["f32","f32"]);
        this.isChange = true;
        this.setGroup();

        setParentModifierWeight(this);
    }

    subBaseVertices(sub) {
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
        const newBuffer = GPU.createStorageBuffer((this.verticesNum - sub.length) * (2) * 4, undefined, ["f32","f32"]);
        let offset = 0;
        for (const rOffset of indexs) {
            GPU.copyBuffer(this.s_baseVerticesPositionBuffer, newBuffer, rOffset[0] * 2 * 4, offset, (rOffset[1] - rOffset[0]) * 2 * 4);
            offset += (rOffset[1] - rOffset[0] + 1) * 2 * 4;
        }
        GPU.consoleBufferData(newBuffer);
        this.verticesNum = this.verticesNum - sub.length;
        this.s_baseVerticesPositionBuffer = newBuffer;
        this.RVrt_coBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, undefined, ["f32"]);
        this.isChange = true;
        this.setGroup();

        setParentModifierWeight(this);
    }

    setGroup() {
        if (!this.isInit) return ;
        this.adaptAnimationGroup1 = GPU.createGroup(c_srw, [this.RVrt_coBuffer]);

        this.modifierTransformGroup = GPU.createGroup(c_srw_sr, [{item: this.RVrt_coBuffer, type: "b"}, {item: this.parentWeightBuffer, type: "b"}]);

        this.collisionVerticesGroup = GPU.createGroup(c_sr, [this.RVrt_coBuffer]);
        this.collisionMeshGroup = GPU.createGroup(c_sr_sr, [this.RVrt_coBuffer, this.s_meshIndexBuffer]);

        this.renderGroup = GPU.createGroup(v_sr_sr_f_t_t_u, [this.RVrt_coBuffer, {item: this.s_baseVerticesUVBuffer, type: 'b'}, {item: this.textureView, type: 't'}, {item: this.maskTargetTexture.textureView, type: 't'}, {item: this.maskTypeBuffer, type: "b"}]);
        this.renderWegihtGroup = GPU.createGroup(v_sr_sr, [this.RVrt_coBuffer, {item: this.parentWeightBuffer, type: 'b'}]);
        this.maskRenderGroup = GPU.createGroup(v_sr_sr_f_t, [this.RVrt_coBuffer, {item: this.s_baseVerticesUVBuffer, type: 'b'}, {item: this.textureView, type: 't'}]);
        this.calculateAllBBoxGroup = GPU.createGroup(c_srw_sr, [{item: this.BBoxBuffer, type: 'b'}, this.RVrt_coBuffer]);
        this.calculateAllBaseBBoxGroup = GPU.createGroup(c_srw_sr, [{item: this.baseBBoxBuffer, type: 'b'}, {item: this.s_baseVerticesPositionBuffer, type: 'b'}]);
        this.GUIMeshRenderGroup = GPU.createGroup(v_sr_sr, [this.RVrt_coBuffer, this.s_meshIndexBuffer]);
        this.GUIVerticesRenderGroup = GPU.createGroup(v_sr, [this.RVrt_coBuffer]);
    }

    async getSaveData() {
        const animationKeyDatas = await this.animationBlock.getSaveData()
        let modifierEffectData = null;
        if (this.parent) {
            if (this.parent.type == "モディファイア") {
                modifierEffectData = await GPU.getBufferDataAsStruct(this.parentWeightBuffer, this.verticesNum * (4 + 4) * 4, ["u32","u32","u32","u32","f32","f32","f32","f32"]);
            } else if (this.parent.type == "ベジェモディファイア") {
               modifierEffectData = await GPU.getBufferDataAsStruct(this.parentWeightBuffer, this.verticesNum * (1 + 1) * 4, ["u32","f32"]);
            }
        }

        return {
            name: this.name,
            type: this.type,
            baseTransformIsLock: this.baseTransformIsLock,
            zIndex: this.zIndex,
            baseVerticesPosition: [...await GPU.getF32BufferData(this.s_baseVerticesPositionBuffer)],
            baseVerticesUV: [...await GPU.getF32BufferData(this.s_baseVerticesUVBuffer)],
            meshIndex: [...await GPU.getU32BufferData(this.s_meshIndexBuffer)],
            animationKeyDatas: animationKeyDatas,
            modifierEffectData: modifierEffectData,
            texture: await GPU.textureToBase64(this.texture, false),
            // texture: await GPU.textureToRGBA(this.texture),
            renderingTargetTexture: this.renderingTargetTexture ? this.renderingTargetTexture.name : null,
            maskTargetTexture: this.maskTargetTexture.name,
        };
    }
}