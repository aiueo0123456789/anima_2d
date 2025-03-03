@group(0) @binding(0) var<storage, read_write> outputData: array<vec2<f32>>; // 出力
@group(0) @binding(1) var<storage, read> bbox: array<vec2<f32>, 2>; // 頂点インデックスのデータ
@group(1) @binding(0) var<uniform> center: vec2<f32>; // 頂点インデックスのデータ

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let threadIndex = global_id.x;
    if (arrayLength(&outputData) <= threadIndex) {
        return;
    }

    let sub = outputData[threadIndex] - (bbox[0] + bbox[1]) / 2.0;
    outputData[threadIndex] = sub + center;
}