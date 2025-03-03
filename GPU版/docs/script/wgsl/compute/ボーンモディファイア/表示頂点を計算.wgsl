struct Bone {
    position: vec2<f32>,
    scale: vec2<f32>,
    angle: f32,
    length: f32,
}

struct BoneVertices {
    h: vec2<f32>,
    t: vec2<f32>,
}

@group(0) @binding(0) var<storage, read_write> outputData: array<BoneVertices>; // 出力
@group(0) @binding(1) var<storage, read> boneMatrix: array<mat3x3<f32>>; // ボーンの行列
@group(0) @binding(2) var<storage, read> boneData: array<Bone>; // ボーンのデータ

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let boneIndex = global_id.x;
    if (arrayLength(&outputData) <= boneIndex) {
        return;
    }

    // 頂点データを取得
    let matrix = boneMatrix[boneIndex];
    var output: BoneVertices;
    output.h = (matrix * vec3<f32>(0.0, 0.0, 1.0)).xy;
    output.t = (matrix * vec3<f32>(0.0, boneData[boneIndex].length, 1.0)).xy;
    outputData[boneIndex] = output;
}