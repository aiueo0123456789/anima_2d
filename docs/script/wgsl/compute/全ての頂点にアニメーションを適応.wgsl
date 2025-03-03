@group(0) @binding(0) var<storage, read_write> outputData: array<vec2<f32>>; // 出力
@group(1) @binding(0) var<storage, read> animationDatas: array<vec2<f32>>; // シェイプキーのデータ
@group(1) @binding(1) var<uniform> animationWeight: f32; // シェイプキーの重み

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pointIndex = global_id.x;
    if (arrayLength(&outputData) <= pointIndex) {
        return;
    }

    outputData[pointIndex] += animationDatas[pointIndex] * animationWeight;
}