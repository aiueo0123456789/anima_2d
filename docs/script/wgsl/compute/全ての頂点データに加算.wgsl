@group(0) @binding(0) var<storage, read_write> outputData: array<vec2<f32>>; // 出力
@group(1) @binding(0) var<storage, read> activeIndexs: array<vec2<f32>>; // 頂点インデックスのデータ

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let threadIndex = global_id.x;
    if (arrayLength(&activeIndexs) <= threadIndex) {
        return;
    }

    outputData[threadIndex] = activeIndexs[threadIndex];
}