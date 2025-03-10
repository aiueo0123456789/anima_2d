import { device,GPU } from "./webGPU.js";
import { c_sr_u, c_srw, adaptAllAnimationToVerticesPipeline } from "./GPUObject.js";
import { arrayMath } from "./配列計算.js";
import { createID } from "./グリッド/制御.js";

export class AnimationBlock {
    constructor(belongObject,useClass) {
        this.animationBlock = [];
        this.belongObject = belongObject;
        this.useClass = useClass;
    }

    destroy() {
        for (const animation of this.animationBlock) {
            animation.destroy();
        }
        this.animationBlock.length = 0;
        this.belongObject = null;
        this.useClass = null;
    }

    appendAnimation() {
        const animation = new this.useClass("名称未設定", this.belongObject);
        animation.emptyInit();
        this.animationBlock.push(animation);
        return animation;
    }

    deleteAnimation(animation) {
        let index = this.animationBlock.indexOf(animation);
        if (index != -1) {
            animation.destroy();
            this.animationBlock.splice(index,1);
        }
    }

    searchAnimation(animationName) {
        for (const animation of this.animationBlock) {
            if (animation.name == animationName) return animation;
        }
        return null;
    }

    setSaveData(data) {
        for (const keyData of data) {
            const animationData = keyData.transformData;
            const animation = new this.useClass(keyData.name, this.belongObject);
            animation.setAnimationData(animationData);
            this.animationBlock.push(animation);
        }
    }

    async getSaveData() {
        const animationsSaveData = [];
        await Promise.all(
            this.animationBlock.map(async (animation) => {
                animationsSaveData.push({name : animation.name,transformData: await animation.getSaveData()});
            })
        );
        return animationsSaveData;
    }
}

export class VerticesAnimation {
    constructor(name, belongObject) {
        this.id = createID();
        this.type = "オールアニメーション";
        this.weight = 0;
        this.beforeWeight = 0;
        this.s_verticesAnimationBuffer = null;
        this.u_animationWeightBuffer = GPU.createUniformBuffer(4, undefined, ['f32']);
        this.adaptAnimationGroup2 = null;

        this.name = name;

        this.belongAnimationManager = null;
        this.belongObject = belongObject;
    }

    // gc対象にしてメモリ解放
    destroy() {
        this.type = "オールアニメーション";
        this.weight = 0;
        this.s_verticesAnimationBuffer = null;
        this.u_animationWeightBuffer = null;
        this.adaptAnimationGroup2 = null;

        this.name = null;

        this.belongAnimationManager = null;
        this.belongObject = null;
    }

    emptyInit() {
        this.s_verticesAnimationBuffer = GPU.createStorageBuffer(this.belongObject.verticesNum * 2 * 4, Array(this.belongObject.verticesNum * 2).fill(0), ["f32","f32"]);
        this.adaptAnimationGroup2 = GPU.createGroup(c_sr_u, [{item: this.s_verticesAnimationBuffer, type: 'b'}, {item: this.u_animationWeightBuffer, type: 'b'}]);
    }

    async getSaveData() {
        return {
            transformData: [...await GPU.getF32BufferData(this.s_verticesAnimationBuffer)],
        }
    }

    setAnimationData(data) {
        let trueData;
        trueData = [];
        for (const index in data.transformData) {
            trueData.push(data.transformData[index])
        }
        this.s_verticesAnimationBuffer = GPU.createStorageBuffer(trueData.length * 4, trueData, ["f32","f32"]);
        this.adaptAnimationGroup2 = GPU.createGroup(c_sr_u, [{item: this.s_verticesAnimationBuffer, type: 'b'}, {item: this.u_animationWeightBuffer, type: 'b'}]);

        this.isChange = true;
    }

    getWorldVerticesPositionBuffer() {
        const resultBuffer = GPU.copyBufferToNewBuffer(this.belongObject.s_baseVerticesPositionBuffer);
        GPU.runComputeShader(adaptAllAnimationToVerticesPipeline, [GPU.createGroup(c_srw, [{item: resultBuffer, type: "b"}]), GPU.createGroup(c_sr_u, [{item: this.s_verticesAnimationBuffer, type: 'b'}, {item: GPU.createUniformBuffer(4, [1], ["f32"]), type: 'b'}])], Math.ceil(this.belongObject.verticesNum / 64));
        return resultBuffer;
    }
}

export class RotateAnimation {
    constructor(name, belongObject) {
        this.id = createID();
        this.type = "回転アニメーション";
        this.weight = 0;
        this.beforeWeight = 0;
        this.transformData = [0,0,0,0];

        this.name = name;

        this.belongAnimationManager = null;
        this.belongObject = belongObject;
    }

    // gc対象にしてメモリ解放
    destroy() {
        this.type = "回転アニメーション";
        this.weight = 0;
        this.u_animationWeightBuffer = null;

        this.name = null;

        this.belongAnimationManager = null;
        this.belongObject = null;
    }

    emptyInit() {
        this.transformData = [0,0,0,0];
    }

    async getSaveData() {
        return {
            transformData: this.transformData,
        }
    }

    setAnimationData(data) {
        this.transformData = data.transformData;
    }

    transformAnimationData(transformData) {
        arrayMath.sub(this.transformData, transformData, this.belongObject.baseData);
    }
}

export class BoneAnimation {
    constructor(name, belongObject) {
        this.id = createID();
        this.type = "ボーンアニメーション";
        this.weight = 0;
        this.beforeWeight = 0;
        this.s_verticesAnimationBuffer = null;
        this.u_animationWeightBuffer = GPU.createUniformBuffer(4, undefined, ['f32']);
        this.adaptAnimationGroup2 = null;

        this.name = name;

        this.belongAnimationManager = null;
        this.belongObject = belongObject;
    }

    // gc対象にしてメモリ解放
    destroy() {
        this.type = "ボーンアニメーション";
        this.weight = 0;
        this.s_verticesAnimationBuffer = null;
        this.u_animationWeightBuffer = null;
        this.adaptAnimationGroup2 = null;

        this.name = null;

        this.belongAnimationManager = null;
        this.belongObject = null;
    }

    emptyInit() {
        this.s_verticesAnimationBuffer = GPU.createStorageBuffer(this.belongObject.verticesNum * 6 * 4, Array(this.belongObject.verticesNum * 6).fill(0), ["f32","f32"]);
        this.adaptAnimationGroup2 = GPU.createGroup(c_sr_u, [{item: this.s_verticesAnimationBuffer, type: 'b'}, {item: this.u_animationWeightBuffer, type: 'b'}]);
    }

    async getSaveData() {
        return {
            transformData: [...await GPU.getF32BufferData(this.s_verticesAnimationBuffer)],
        }
    }

    setAnimationData(data) {
        let trueData;
        trueData = [];
        for (const index in data.transformData) {
            trueData.push(data.transformData[index]);
        }
        this.s_verticesAnimationBuffer = GPU.createStorageBuffer(trueData.length * 4, trueData, ["f32","f32"]);
        this.adaptAnimationGroup2 = GPU.createGroup(c_sr_u, [{item: this.s_verticesAnimationBuffer, type: 'b'}, {item: this.u_animationWeightBuffer, type: 'b'}]);
    }

    getWorldVerticesMatrixBuffer() {
        return GPU.copyBufferToNewBuffer(this.belongObject.boneMatrixBuffer);
    }
}