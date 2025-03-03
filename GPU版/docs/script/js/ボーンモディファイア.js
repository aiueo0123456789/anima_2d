import { device,GPU } from "./webGPU.js";
import { Children } from "./子要素.js";
import { AnimationBlock, BoneAnimation, VerticesAnimation } from "./アニメーション.js";
import { v_sr,c_sr_sr,c_sr,c_srw,c_srw_sr, c_sr_u, calculateBaseBoneDataPipeline, c_srw_srw_sr_sr, c_srw_sr_sr } from "./GPUObject.js";

export class BoneModifier {
    constructor(name) {
        this.name = name;
        this.isInit = false;
        this.isChange = false;

        this.CPUBaseVerticesPositionData = [];
        this.baseBoneBuffer = null;
        this.baseBoneMatrixBuffer = null;
        this.boneMatrixBuffer = null;
        this.boneBuffer = null;
        this.type = "ボーンモディファイア";
        this.animationBlock = new AnimationBlock(this, BoneAnimation);
        this.modifierDataGroup = null;
        this.modifierTransformDataGroup = null;
        this.adaptAnimationGroup1 = null;
        this.parentWeightBuffer = null;

        this.calculateAllBBoxGroup = null;
        this.GUIrenderGroup = null;

        this.BBoxArray = [0,0,0,0];
        this.BBoxBuffer = GPU.createStorageBuffer(4 * 4, undefined, ["f32"]);
        this.BBoxRenderGroup = GPU.createGroup(v_sr, [this.BBoxBuffer]);

        this.baseBBoxArray = [0,0,0,0];
        this.baseBBoxBuffer = GPU.createStorageBuffer(4 * 4, undefined, ["f32"]);

        this.boneNum = 0;
        this.baseTransformIsLock = false;

        this.children = new Children();

        this.init({
            baseVertices: [
                0,0, 0,50,
            ],
            relationship: [{
                parent: 0,
                children: [],
            }],
            animationKeyDatas: []
        });
    }

    // gc対象にしてメモリ解放
    destroy() {
        this.animationBlock.forEach(animtion => {
            animtion.destroy();
        });
        this.animationBlock.length = 0;
    }

    getBoneDepthFromIndex(index) {
        let depth = 0;
        for (const data of this.propagateDatas) {
            for (let i = 0; i < data.length; i += 2) {
                if (data[i] == index) {
                    return depth;
                }
            }
            depth ++;
        }

        return -1;
    }

    init(data) {
        this.verticesNum = data.baseVertices.length / 2;
        this.boneNum = this.verticesNum / 2;
        this.propagateDatas = [];
        this.propagateBuffers = [];
        const parentsData = Array.from({ length: this.boneNum }, (_, i) => i);
        const roopChildren = (parent,children, depth) => {
            for (const child of children) {
                if (this.propagateDatas.length <= depth) {
                    this.propagateDatas.push([]);
                }
                parentsData[child.parent] = parent;
                this.propagateDatas[depth].push(child.parent, parent);
                roopChildren(child.parent, child.children, depth + 1);
            }
        }
        roopChildren(0,data.relationship[0].children, 0);
        for (const data of this.propagateDatas) {
            this.propagateBuffers.push({boneNum: data.length / 2, buffer: GPU.createStorageBuffer(data.length * 4, data, ["u32"])});
        }
        this.parentsBuffer = GPU.createStorageBuffer(this.boneNum * 4, parentsData, ["u32"]);
        console.log(this.propagateDatas);

        this.animationBlock.setSaveData(data.animationKeyDatas);

        this.parentWeightBuffer = GPU.createStorageBuffer(4, undefined, ['f32']);

        this.s_baseVerticesPositionBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, data.baseVertices, ["f32","f32","f32","f32"]);
        this.RVrt_coBuffer = GPU.createStorageBuffer(this.verticesNum * (2) * 4, undefined, ["f32","f32","f32","f32"]);

        this.baseBoneBuffer = GPU.createStorageBuffer(this.boneNum * (6) * 4, undefined, ["f32","f32"]);
        this.boneBuffer = GPU.createStorageBuffer(this.boneNum * (6) * 4, undefined, ["f32","f32"]);
        this.baseBoneMatrixBuffer = GPU.createStorageBuffer(this.boneNum * (4 * 3) * 4, undefined, ["f32","f32","f32"]);
        this.boneMatrixBuffer = GPU.createStorageBuffer(this.boneNum * (4 * 3) * 4, undefined, ["f32","f32","f32"]);

        this.isInit = true;
        this.isChange = true;

        this.calculateBaseBoneData();

        this.setGroup();
    }

    calculateBaseBoneData() {
        GPU.runComputeShader(calculateBaseBoneDataPipeline, [GPU.createGroup(c_srw_srw_sr_sr, [{item: this.baseBoneBuffer, type: "b"}, this.baseBoneMatrixBuffer, this.s_baseVerticesPositionBuffer, {item: GPU.createStorageBuffer(this.boneNum * 8, [0,0].concat(this.propagateDatas.flat()), ["u32"]), type: "b"}])], Math.ceil(this.boneNum / 64));
    }

    setGroup() {
        this.calculateBoneVerticesGroup = GPU.createGroup(c_srw_sr_sr, [this.RVrt_coBuffer, this.boneMatrixBuffer, this.boneBuffer]);
        this.calculateLocalMatrixGroup = GPU.createGroup(c_srw_sr, [this.boneMatrixBuffer, this.boneBuffer]);
        this.modifierDataGroup = GPU.createGroup(c_sr_u, [this.s_baseVerticesPositionBuffer, GPU.createUniformBuffer(4, [20], ["f32"])]);
        this.modifierTransformDataGroup = GPU.createGroup(c_sr_sr, [this.baseBoneMatrixBuffer, this.boneMatrixBuffer]);
        this.adaptAnimationGroup1 = GPU.createGroup(c_srw, [this.boneBuffer]);
        this.collisionVerticesGroup = GPU.createGroup(c_sr, [this.RVrt_coBuffer]);
        this.collisionBoneGroup = GPU.createGroup(c_sr, [this.RVrt_coBuffer]);

        this.modifierTransformGroup = GPU.createGroup(c_srw_sr, [this.boneBuffer, this.parentWeightBuffer]);

        this.calculateAllBBoxGroup = GPU.createGroup(c_srw_sr, [this.BBoxBuffer, this.RVrt_coBuffer]);
        this.calculateAllBaseBBoxGroup = GPU.createGroup(c_srw_sr, [this.baseBBoxBuffer, this.s_baseVerticesPositionBuffer]);
        this.GUIrenderGroup = GPU.createGroup(v_sr, [this.RVrt_coBuffer]);
    }

    async getSaveData() {
        const animationKeyDatas = await this.animationBlock.getSaveData()

        return {
            name: this.name,
            type: this.type,
            baseVertices: [...await GPU.getF32BufferData(this.s_baseVerticesPositionBuffer)],
            relationship: [{

            }],
            animationKeyDatas: animationKeyDatas,
        };
    }
}