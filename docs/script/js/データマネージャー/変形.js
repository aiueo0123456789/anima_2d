import { c_srw_sr_sr, c_u_u_u, c_srw_sr_sr_sr_u_u, c_srw_sr_sr_u, c_srw_sr_sr_sr_sr_u } from "../GPUObject.js";
import { GPU } from "../webGPU.js";
import { setBaseBBox, setParentModifierWeight } from "../オブジェクトで共通の処理.js";

const translatePipeline = GPU.createComputePipeline([c_srw_sr_sr_sr_u_u], `
@group(0) @binding(0) var<storage, read_write> output: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read> originalVertices: array<vec2<f32>>;
@group(0) @binding(2) var<storage, read> baseData: array<vec2<f32>>; // 基準
@group(0) @binding(3) var<storage, read> weigth: array<f32>;
@group(0) @binding(4) var<uniform> pointOfEffort: vec2<f32>;
@group(0) @binding(5) var<uniform> value: vec2<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&weigth) <= index) {
        return;
    }
    let sub = (originalVertices[index] - pointOfEffort) + (value) * (weigth[index]);
    output[index] = sub + pointOfEffort - baseData[index];
}
`);

const resizePipeline = GPU.createComputePipeline([c_srw_sr_sr_sr_u_u], `
@group(0) @binding(0) var<storage, read_write> output: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read> originalVertices: array<vec2<f32>>;
@group(0) @binding(2) var<storage, read> baseData: array<vec2<f32>>; // 基準
@group(0) @binding(3) var<storage, read> weigth: array<f32>;
@group(0) @binding(4) var<uniform> pointOfEffort: vec2<f32>;
@group(0) @binding(5) var<uniform> value: vec2<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&weigth) <= index) {
        return;
    }
    let sub = (originalVertices[index] - pointOfEffort);
    // output[index] = sub * (value) * (weigth[index]) + sub + pointOfEffort;
    output[index] = ((sub * (value) + pointOfEffort) * weigth[index]) + (originalVertices[index] * (1.0 - weigth[index])) - baseData[index];
}
`);

const rotatePipeline = GPU.createComputePipeline([c_srw_sr_sr_sr_u_u], `
@group(0) @binding(0) var<storage, read_write> output: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read> originalVertices: array<vec2<f32>>;
@group(0) @binding(2) var<storage, read> baseData: array<vec2<f32>>; // 基準
@group(0) @binding(3) var<storage, read> weigth: array<f32>;
@group(0) @binding(4) var<uniform> pointOfEffort: vec2<f32>;
@group(0) @binding(5) var<uniform> value: vec2<f32>;

fn rotate(p: vec2<f32>, angle: f32) -> vec2<f32> {
    let c = cos(angle);
    let s = sin(angle);
    return vec2<f32>(
        p.x * c - p.y * s,
        p.x * s + p.y * c,
    );
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&weigth) <= index) {
        return;
    }
    let sub = rotate(originalVertices[index] - pointOfEffort, value.x * (weigth[index]));
    output[index] = sub + pointOfEffort - baseData[index];
}
`);

const createBoneAnimationInitDataPipeline = GPU.createComputePipeline([c_srw_sr_sr_u], `
struct Bone {
    position: vec2<f32>,
    scale: vec2<f32>,
    angle: f32,
    length: f32,
}

@group(0) @binding(0) var<storage, read_write> output: array<Bone>;
@group(0) @binding(1) var<storage, read> originalVertices: array<Bone>;
@group(0) @binding(2) var<storage, read> verticesIndexs: array<u32>;
@group(0) @binding(3) var<uniform> value: vec2<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&verticesIndexs) <= index) {
        return;
    }
    var boneIndex = verticesIndexs[index];
    if (f32(boneIndex) % 2.0 == 0.0) {
        boneIndex /= 2u;
        output[boneIndex].position = value + originalVertices[boneIndex].position;
    }
}
`);

const boneAnimationTranslatePipeline = GPU.createComputePipeline([c_srw_sr_sr_sr_sr_u], `
struct Bone {
    position: vec2<f32>,
    scale: vec2<f32>,
    angle: f32,
    length: f32,
}

@group(0) @binding(0) var<storage, read_write> boneAnimation: array<Bone>;
@group(0) @binding(1) var<storage, read> originalBoneAnimation: array<Bone>;
@group(0) @binding(2) var<storage, read> boneMatrix: array<mat3x3<f32>>;
@group(0) @binding(3) var<storage, read> parents: array<u32>;
@group(0) @binding(4) var<storage, read> verticesIndexs: array<u32>;
@group(0) @binding(5) var<uniform> value: vec2<f32>;

fn inverseMat3x3(matrix: mat3x3<f32>) -> mat3x3<f32> {
    var inv: mat3x3<f32>;

    let a = matrix[0][0];
    let b = matrix[0][1];
    let c = matrix[0][2];
    let d = matrix[1][0];
    let e = matrix[1][1];
    let f = matrix[1][2];
    let g = matrix[2][0];
    let h = matrix[2][1];
    let i = matrix[2][2];

    let det = a * (e * i - f * h) -
              b * (d * i - f * g) +
              c * (d * h - e * g);

    if (det == 0.0) {
        // 行列が逆行列を持たない場合
        return mat3x3<f32>(0.0, 0.0, 0.0,
                           0.0, 0.0, 0.0,
                           0.0, 0.0, 0.0);
    }

    let invDet = 1.0 / det;

    inv[0][0] = (e * i - f * h) * invDet;
    inv[0][1] = (c * h - b * i) * invDet;
    inv[0][2] = (b * f - c * e) * invDet;
    inv[1][0] = (f * g - d * i) * invDet;
    inv[1][1] = (a * i - c * g) * invDet;
    inv[1][2] = (c * d - a * f) * invDet;
    inv[2][0] = 0.0;
    inv[2][1] = 0.0;
    inv[2][2] = 1.0;

    return inv;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&verticesIndexs) <= index) {
        return;
    }
    let boneIndex = verticesIndexs[index];
    let parentIndex = parents[boneIndex];
    if (boneIndex == parentIndex) {
        boneAnimation[boneIndex].position = value + originalBoneAnimation[boneIndex].position;
    } else {
        let parentMatrix = inverseMat3x3(boneMatrix[parentIndex]);
        boneAnimation[boneIndex].position = (parentMatrix * vec3f(value,1.0)).xy + originalBoneAnimation[boneIndex].position;
    }
}
`);

const boneAnimationRotatePipeline = GPU.createComputePipeline([c_srw_sr_sr_sr_sr_u], `
struct Bone {
    position: vec2<f32>,
    scale: vec2<f32>,
    angle: f32,
    length: f32,
}

@group(0) @binding(0) var<storage, read_write> boneAnimation: array<Bone>;
@group(0) @binding(1) var<storage, read> originalBoneAnimation: array<Bone>;
@group(0) @binding(2) var<storage, read> boneMatrix: array<mat3x3<f32>>;
@group(0) @binding(3) var<storage, read> parents: array<u32>;
@group(0) @binding(4) var<storage, read> verticesIndexs: array<u32>;
@group(0) @binding(5) var<uniform> value: vec2<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&verticesIndexs) <= index) {
        return;
    }
    let boneIndex = verticesIndexs[index];
    boneAnimation[boneIndex].angle = originalBoneAnimation[boneIndex].angle - value.x;
}
`);


// あとあと直す
const boneAnimationResizePipeline = GPU.createComputePipeline([c_srw_sr_sr_sr_sr_u], `
struct Bone {
    position: vec2<f32>,
    scale: vec2<f32>,
    angle: f32,
    length: f32,
}

@group(0) @binding(0) var<storage, read_write> boneAnimation: array<Bone>;
@group(0) @binding(1) var<storage, read> originalBoneAnimation: array<Bone>;
@group(0) @binding(2) var<storage, read> boneMatrix: array<mat3x3<f32>>;
@group(0) @binding(3) var<storage, read> parents: array<u32>;
@group(0) @binding(4) var<storage, read> verticesIndexs: array<u32>;
@group(0) @binding(5) var<uniform> value: vec2<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&verticesIndexs) <= index) {
        return;
    }
    let boneIndex = verticesIndexs[index];
    boneAnimation[boneIndex].scale = originalBoneAnimation[boneIndex].scale * value - 1.0;
}
`);

const createInitDataPipeline = GPU.createComputePipeline([c_srw_sr_sr, c_u_u_u], `
@group(0) @binding(0) var<storage, read_write> weight: array<f32>;
@group(0) @binding(1) var<storage, read> verticesIndexs: array<u32>;
@group(0) @binding(2) var<storage, read> vertices: array<vec2<f32>>;
@group(1) @binding(0) var<uniform> proportionalEditType: u32;
@group(1) @binding(1) var<uniform> proportionalSize: f32;
@group(1) @binding(2) var<uniform> pointOfEffort: vec2<f32>;

fn arrayIncludes(value: u32) -> bool {
    for (var i = 0u; i < arrayLength(&verticesIndexs); i = i + 1u) {
        if (verticesIndexs[i] == value) {
            return true;
        }
    }
    return false;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&vertices) <= index) {
        return;
    }
    if (proportionalEditType == 0u) { // 通常
        if (arrayIncludes(index)) {
            weight[index] = 1.0;
        } else {
            weight[index] = 0.0;
        }
    } else if (proportionalEditType == 1u) { // 1次関数
        if (arrayIncludes(index)) {
            weight[index] = 1.0;
        } else {
            let dist = distance(vertices[index], pointOfEffort);
            if (dist < proportionalSize) {
                weight[index] = 1.0 - dist / proportionalSize;
            } else {
                weight[index] = 0.0;
            }
        }
    } else if (proportionalEditType == 2u) { // 2次関数
        if (arrayIncludes(index)) {
            weight[index] = 1.0;
        } else {
            let dist = distance(vertices[index], pointOfEffort);
            if (dist < proportionalSize) {
                weight[index] = pow((1.0 - dist / proportionalSize), 2.0);
            } else {
                weight[index] = 0.0;
            }
        }
    }
}
`);

// const Csrw_Csr_Csr = GPU.createGroupLayout();

export class Transform {
    constructor() {
        this.target = null;
        this.worldOriginalBuffer = null;
        this.valueBuffer = GPU.createUniformBuffer(2 * 4, undefined, ["f32"]);
        this.pointOfEffortBuffer = GPU.createUniformBuffer(2 * 4, undefined, ["f32","f32"]);
        this.proportionalEditTypeBuffer = GPU.createUniformBuffer(4, undefined, ["u32"]);
        this.proportionalSizeBuffer = GPU.createUniformBuffer(4, undefined, ["f32"]);
        this.configGroup = GPU.createGroup(c_u_u_u, [{item: this.proportionalEditTypeBuffer, type: "b"}, {item: this.proportionalSizeBuffer, type: "b"}, {item: this.pointOfEffortBuffer, type: "b"}]);
    }

    // 基準となるデータを作る
    init(target, selectVerticesIndexs) {
        this.target = target;
        if (target.type == "ボーンアニメーション") {
            let minDepthIndex = [];
            let minDepth = 1000;
            for (let index of selectVerticesIndexs) {
                if (index % 2 == 0) {
                    index /= 2;
                    const depth = target.belongObject.getBoneDepthFromIndex(index);
                    if (depth < minDepth) {
                        minDepth = depth;
                        minDepthIndex = [index];
                    } else if (depth == minDepth) {
                        minDepthIndex.push(index);
                    }
                }
            }
            if (minDepthIndex.length) {
                const selectVerticesIndexBuffer = GPU.createStorageBuffer(minDepthIndex.length * 4, minDepthIndex, ["u32"]);
                this.targetBuffer = target.s_verticesAnimationBuffer;
                this.worldOriginalBuffer = GPU.copyBufferToNewBuffer(target.s_verticesAnimationBuffer); // ターゲットの頂点のワールド座標を取得
                this.transformGroup = GPU.createGroup(c_srw_sr_sr_sr_sr_u,  [{item: this.targetBuffer, type: "b"}, {item: this.worldOriginalBuffer, type: "b"}, {item: target.getWorldVerticesMatrixBuffer(), type: "b"}, {item: target.belongObject.parentsBuffer, type: "b"}, {item: selectVerticesIndexBuffer, type: "b"}, {item: this.valueBuffer, type: "b"}]);
            }
            this.workNumX = Math.ceil(this.target.belongObject.boneNum / 64);
        } else {
            const selectVerticesIndexBuffer = GPU.createStorageBuffer(selectVerticesIndexs.length * 4, selectVerticesIndexs, ["u32"]);
            if (target.type == "オールアニメーション") {
                this.worldOriginalBuffer = target.getWorldVerticesPositionBuffer(); // ターゲットの頂点のワールド座標を取得
                this.targetBuffer = target.s_verticesAnimationBuffer;
                this.baseBuffer = target.belongObject.s_baseVerticesPositionBuffer; // 頂点の基準
                this.workNumX = Math.ceil(this.target.belongObject.verticesNum / 64);
                this.weightBuffer = GPU.createStorageBuffer(this.target.belongObject.verticesNum * 4, undefined, ["f32"]);
            } else {
                this.worldOriginalBuffer = GPU.copyBufferToNewBuffer(target.s_baseVerticesPositionBuffer); // ターゲットの頂点のワールド座標を取得
                this.targetBuffer = target.s_baseVerticesPositionBuffer;
                this.baseBuffer = GPU.createStorageBuffer(target.verticesNum * 2 * 4, undefined, ["f32"]); // 頂点の基準
                this.workNumX = Math.ceil(this.target.verticesNum / 64);
                this.weightBuffer = GPU.createStorageBuffer(target.verticesNum * 4, undefined, ["f32"]);
            }
            this.weightAndIndexsGroup = GPU.createGroup(c_srw_sr_sr,  [{item: this.weightBuffer, type: "b"}, {item: selectVerticesIndexBuffer, type: "b"}, {item: this.worldOriginalBuffer, type: "b"}]);
            this.transformGroup = GPU.createGroup(c_srw_sr_sr_sr_u_u,  [{item: this.targetBuffer, type: "b"}, {item: this.worldOriginalBuffer, type: "b"}, {item: this.baseBuffer, type: "b"}, {item: this.weightBuffer, type: "b"}, {item: this.pointOfEffortBuffer, type: "b"}, {item: this.valueBuffer, type: "b"}]);
        }
        this.originalBuffer = GPU.copyBufferToNewBuffer(this.targetBuffer); // ターゲットのオリジナル状態を保持
    }

    setPointOfEffort(pointOfEffort) {
        GPU.writeBuffer(this.pointOfEffortBuffer, new Float32Array(pointOfEffort));
    }

    transform(pipeline, value, proportionalEditType, proportionalSize) {
        GPU.writeBuffer(this.valueBuffer, new Float32Array(value));
        if (this.target.type == "ボーンアニメーション") {
            GPU.runComputeShader(pipeline, [this.transformGroup], this.workNumX);
            this.target.belongObject.isChange = true;
        } else {
            GPU.writeBuffer(this.proportionalEditTypeBuffer, new Uint32Array([proportionalEditType]));
            GPU.writeBuffer(this.proportionalSizeBuffer, new Float32Array([proportionalSize]));
            GPU.runComputeShader(createInitDataPipeline,[this.weightAndIndexsGroup, this.configGroup], this.workNumX);

            GPU.runComputeShader(pipeline, [this.transformGroup], this.workNumX);
            if (this.target.type == "ボーンモディファイア") {
                this.target.calculateBaseBoneData();
            }
            if (this.target.type != "オールアニメーション") {
                this.target.children?.weightReset();
                setBaseBBox(this.target);
                setParentModifierWeight(this.target);
                this.target.isChange = true;
            } else {
                this.target.belongObject.isChange = true;
            }
        }
    }

    // 並行移動
    trnaslate(value, orientType, proportionalEditType, proportionalSize) {
        if (orientType == "ローカル") { // 親の行列を探す
        } else {
        }
        if (this.target.type == "ボーンアニメーション") {
            this.transform(boneAnimationTranslatePipeline, value, proportionalEditType, proportionalSize);
        } else {
            this.transform(translatePipeline, value, proportionalEditType, proportionalSize);
        }
    }

    // 拡大縮小
    resize(value, orientType, proportionalEditType, proportionalSize) {
        if (orientType == "ローカル") { // 親の行列を探す
        } else {
        }
        if (this.target.type == "ボーンアニメーション") {
            this.transform(boneAnimationResizePipeline, value, proportionalEditType, proportionalSize);
        } else {
            this.transform(resizePipeline, value, proportionalEditType, proportionalSize);
        }
    }

    // 回転
    rotate(value, orientType, proportionalEditType, proportionalSize) {
        if (orientType == "ローカル") { // 親の行列を探す
        } else {
        }
        if (this.target.type == "ボーンアニメーション") {
            this.transform(boneAnimationRotatePipeline, value, proportionalEditType, proportionalSize);
        } else {
            this.transform(rotatePipeline, value, proportionalEditType, proportionalSize);
        }
    }

    // 変形を取り消し
    cancel() {
        GPU.copyBuffer(this.originalBuffer, this.targetBuffer);
    }

    clear() {

    }

    createUndoData() {
        return {action: "変形", data: {object: this.target, target: this.targetBuffer, undo: this.originalBuffer, redo: GPU.copyBufferToNewBuffer(this.targetBuffer)}};
    }
}