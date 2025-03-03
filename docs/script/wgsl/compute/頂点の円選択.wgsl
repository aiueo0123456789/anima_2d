@group(0) @binding(0) var<storage, read_write> outputData: array<f32>; // 出力
@group(0) @binding(1) var<uniform> point: vec2<f32>; // 距離を計算する座標
@group(1) @binding(0) var<storage, read> vertices: array<vec2<f32>>; // 頂点座標

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pointIndex = global_id.x;
    if (arrayLength(&vertices) <= pointIndex) {
        return;
    }

    outputData[pointIndex] = distance(vertices[pointIndex], point);
}