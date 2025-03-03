struct ModifierBox {
    max: vec2<f32>,
    min: vec2<f32>,
}

@group(0) @binding(0) var<storage, read_write> outputData: array<vec2<f32>>; // 出力
@group(0) @binding(1) var<storage, read> movement: array<vec2<f32>>; // 移動距離
@group(0) @binding(2) var<uniform> modifierBox: ModifierBox;
@group(0) @binding(3) var<uniform> fineness: vec2<u32>; // キーに含まれる頂点の数

@compute @workgroup_size(16,16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    if (global_id.x >= fineness.x + 1 || global_id.y >= fineness.y + 1) {
        return;
    }
    let pointIndex = global_id.x + global_id.y * (fineness.x + 1);

    let pos = modifierBox.min + ((vec2f(global_id.xy) / vec2f(fineness.xy)) * (modifierBox.max - modifierBox.min)) + movement[pointIndex];
    outputData[pointIndex] = pos;
}