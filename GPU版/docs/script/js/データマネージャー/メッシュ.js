import { c_sr_u } from "../GPUObject.js";
import { GPU } from "../webGPU.js";
import { setParentModifierWeight } from "../オブジェクトで共通の処理.js";
import { vec2 } from "../ベクトル計算.js";

export class Mesh {
    constructor() {
    }

    appendBaseVertices(target, value) {
    }

    appendBone(target, parentIndex, head, tail, coordinate) {
        if (coordinate) {
            // console.log(await GPU.getF32BufferPartsData(target.s_baseVerticesPositionBuffer,parentIndex,2))
            // vec2.add(head, await GPU.getF32BufferPartsData(target.s_baseVerticesPositionBuffer,parentIndex,2), head);
            vec2.add(head, coordinate, head);
            console.log(coordinate)
        }
        // ベース頂点データを更新
        target.s_baseVerticesPositionBuffer = GPU.appendDataToBuffer(target.s_baseVerticesPositionBuffer, new Float32Array(head.concat(tail)));
        // アニメーションデータを更新
        for (const anmaiton of target.animationBlock.animationBlock) {
            anmaiton.s_verticesAnimationBuffer = GPU.appendDataToBuffer(anmaiton.s_verticesAnimationBuffer, new Float32Array([0,0,0,0,0,0]));
            anmaiton.adaptAnimationGroup2 = GPU.createGroup(c_sr_u, [{item: anmaiton.s_verticesAnimationBuffer, type: 'b'}, {item: anmaiton.u_animationWeightBuffer, type: 'b'}]);
        }
        // 親子データを更新
        if (parentIndex == "last") {
            parentIndex = target.boneNum - 1;
        }
        target.parentsBuffer = GPU.appendDataToBuffer(target.parentsBuffer, new Uint32Array([parentIndex]));
        const propagateDepth = target.getBoneDepthFromIndex(parentIndex) + 1;
        if (target.propagateDatas.length <= propagateDepth) {
            target.propagateDatas.push([target.boneNum, parentIndex]);
            target.propagateBuffers.push({boneNum: 1, buffer: GPU.createStorageBuffer(2 * 4, [target.boneNum, parentIndex], ["u32"])});
        } else {
            target.propagateDatas[propagateDepth].push(target.boneNum, parentIndex);
            const propagate = target.propagateBuffers[propagateDepth];
            propagate.buffer = GPU.appendDataToBuffer(propagate.buffer, new Uint32Array([target.boneNum, parentIndex]));
            propagate.boneNum ++;
        }
        console.log(target)
        target.boneNum ++;
        target.verticesNum = target.boneNum * 2;

        target.RVrt_coBuffer = GPU.createStorageBuffer(target.verticesNum * (2) * 4, undefined, ["f32","f32","f32","f32"]);

        target.baseBoneBuffer = GPU.createStorageBuffer(target.boneNum * (6) * 4, undefined, ["f32","f32"]);
        target.boneBuffer = GPU.createStorageBuffer(target.boneNum * (6) * 4, undefined, ["f32","f32"]);
        target.baseBoneMatrixBuffer = GPU.createStorageBuffer(target.boneNum * (4 * 3) * 4, undefined, ["f32","f32","f32"]);
        target.boneMatrixBuffer = GPU.createStorageBuffer(target.boneNum * (4 * 3) * 4, undefined, ["f32","f32","f32"]);

        target.calculateBaseBoneData();
        target.setGroup();
        target.children?.weightReset();
        target.isChange = true;
        setParentModifierWeight(target);
    }

    deleteBone(target, indexs) {
        // ベース頂点データを更新
        target.s_baseVerticesPositionBuffer = GPU.deleteIndexsToBuffer(target.s_baseVerticesPositionBuffer, indexs, 8);
        // アニメーションデータを更新
        for (const anmaiton of target.animationBlock.animationBlock) {
            anmaiton.s_verticesAnimationBuffer = GPU.deleteIndexsToBuffer(anmaiton.s_verticesAnimationBuffer, indexs, 24);
            anmaiton.adaptAnimationGroup2 = GPU.createGroup(c_sr_u, [{item: anmaiton.s_verticesAnimationBuffer, type: 'b'}, {item: anmaiton.u_animationWeightBuffer, type: 'b'}]);
        }
        // 親子データを更新
        target.parentsBuffer = GPU.deleteIndexsToBuffer(target.parentsBuffer, indexs, 4);
        const propagateDepth = target.getBoneDepthFromIndex(parentIndex) + 1;
        if (target.propagateDatas.length <= propagateDepth) {
            target.propagateDatas.push([target.boneNum, parentIndex]);
            target.propagateBuffers.push({boneNum: 1, buffer: GPU.createStorageBuffer(2 * 4, [target.boneNum, parentIndex], ["u32"])});
        } else {
            target.propagateDatas[propagateDepth].push(target.boneNum, parentIndex);
            const propagate = target.propagateBuffers[propagateDepth];
            propagate.buffer = GPU.appendDataToBuffer(propagate.buffer, new Uint32Array([target.boneNum, parentIndex]));
            propagate.boneNum ++;
        }
        target.boneNum ++;
        target.verticesNum = target.boneNum * 2;

        target.RVrt_coBuffer = GPU.createStorageBuffer(target.verticesNum * (2) * 4, undefined, ["f32","f32","f32","f32"]);

        target.baseBoneBuffer = GPU.createStorageBuffer(target.boneNum * (6) * 4, undefined, ["f32","f32"]);
        target.boneBuffer = GPU.createStorageBuffer(target.boneNum * (6) * 4, undefined, ["f32","f32"]);
        target.baseBoneMatrixBuffer = GPU.createStorageBuffer(target.boneNum * (4 * 3) * 4, undefined, ["f32","f32","f32"]);
        target.boneMatrixBuffer = GPU.createStorageBuffer(target.boneNum * (4 * 3) * 4, undefined, ["f32","f32","f32"]);

        target.calculateBaseBoneData();
        target.setGroup();
        target.children?.weightReset();
        target.isChange = true;
        setParentModifierWeight(target);
    }
}

const Csrw_Csr_Csrw_Csr = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 'sr'},{useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 'sr'}]);
const Cu_Cu = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'u'}, {useShaderTypes: ['c'], type: 'u'}]);
const weightPaintPipeline = GPU.createComputePipeline([Csrw_Csr_Csrw_Csr,Cu_Cu],`
struct Output {
    indexs: vec4<u32>,
    weights: vec4<f32>,
}

struct Config {
    decayType: u32,
    decaySize: f32,
    index: u32,
    weight: f32,
}

@group(0) @binding(0) var<storage, read_write> indexAndWeight: array<Output>;
@group(0) @binding(1) var<storage, read> originalIndexAndWeight: array<Output>;
@group(0) @binding(2) var<storage, read_write> maxWeights: array<f32>;
@group(0) @binding(3) var<storage, read> vertices: array<vec2<f32>>;
@group(1) @binding(0) var<uniform> config: Config;
@group(1) @binding(1) var<uniform> centerPoint: vec2<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&vertices) <= index) {
        return;
    }
    let dist = distance(centerPoint, vertices[index]);
    let decay = (config.decaySize - dist) / config.decaySize;
    if (dist < config.decaySize) {
        let weight = config.weight * decay;
        maxWeights[index] = max(maxWeights[index],weight);
    }
    var minIndex = 0u;
    var minWeight = 1.1;
    let data = originalIndexAndWeight[index];
    for (var i = 0u; i < 4u; i ++) {
        if (config.index == data.indexs[i]) {
            minIndex = i;
            minWeight = data.weights[i];
            break ;
        } else if (data.weights[i] < minWeight) {
            minIndex = i;
            minWeight = data.weights[i];
        }
    }
    if (minWeight < maxWeights[index]) {
        indexAndWeight[index].indexs[minIndex] = config.index;
        indexAndWeight[index].weights[minIndex] = maxWeights[index];
        var sumWeight = 0.0;
        for (var i = 0u; i < 4u; i ++) {
            sumWeight += indexAndWeight[index].weights[i];
        }
        indexAndWeight[index].weights /= sumWeight; // 正規化
    }
}
`);

export class WeightPaint {
    constructor() {
        this.configBuffer = GPU.createUniformBuffer(32, undefined, ["u32","f32","u32","f32"]);
        this.pointBuffer = GPU.createUniformBuffer(8, undefined, ["f32","f32"]);
        this.configGroup = GPU.createGroup(Cu_Cu, [{item: this.configBuffer, type: "b"}, {item: this.pointBuffer, type: "b"}]);
    }

    init(target, paintTargetIndex, weight, decayType, radius) {
        GPU.writeBuffer(this.configBuffer, GPU.createBitData([decayType,radius,paintTargetIndex,weight],["u32","f32","u32","f32"]))
        this.target = target;
        this.targetBuffer = target.parentWeightBuffer;
        this.originalBuffer = GPU.copyBufferToNewBuffer(target.parentWeightBuffer);
        this.maxWeightBuffer = GPU.createStorageBuffer(target.verticesNum * 4, undefined, ["f32"]);
        this.originalVerticesBuffer = GPU.copyBufferToNewBuffer(target.RVrt_coBuffer);
        this.workNum = Math.ceil(target.verticesNum / 64);
        this.group = GPU.createGroup(Csrw_Csr_Csrw_Csr, [{item: this.targetBuffer, type: "b"}, {item: this.originalBuffer, type: "b"}, {item: this.maxWeightBuffer, type: "b"}, {item: this.originalVerticesBuffer, type: "b"}]);
    }

    paint(point) {
        GPU.writeBuffer(this.pointBuffer, new Float32Array(point));
        GPU.runComputeShader(weightPaintPipeline, [this.group, this.configGroup], this.workNum);
        this.target.isChange = true;
    }

    createUndoData() {
        return {action: "ウェイトペイント", data: {object: this.target, target: this.targetBuffer, undo: this.originalBuffer, redo: GPU.copyBufferToNewBuffer(this.targetBuffer)}};
    }
}