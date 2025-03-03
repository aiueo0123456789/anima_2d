struct AnimationData {
    index: vec4<u32>,
    weight: vec4<f32>,
}

struct Animation {
    index: u32,
    padding: f32,
    position: vec2<f32>,
}

@group(0) @binding(0) var<storage, read_write> outputData: array<vec2<f32>>; // 出力
@group(0) @binding(1) var<storage, read> animationDatas: array<AnimationData>; // 頂点がモディファイのどの頂点にどれぐらい影響を受けるか
@group(1) @binding(0) var<storage, read> baseModifierVertices: array<vec2<f32>>; // モディファイア
@group(1) @binding(1) var<storage, read> modifierVertices: array<vec2<f32>>; // モディファイア

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pointIndex = global_id.x;
    if (arrayLength(&animationDatas) <= pointIndex) {
        return;
    }

    let animationData = animationDatas[pointIndex];
    let indexs = animationData.index;
    let a = modifierVertices[indexs.x] - baseModifierVertices[indexs.x];
    let b = modifierVertices[indexs.y] - baseModifierVertices[indexs.y];
    let c = modifierVertices[indexs.z] - baseModifierVertices[indexs.z];
    let d = modifierVertices[indexs.w] - baseModifierVertices[indexs.w];

    outputData[pointIndex] +=
        a * animationData.weight.x +
        b * animationData.weight.y +
        c * animationData.weight.z +
        d * animationData.weight.w
        ;
}