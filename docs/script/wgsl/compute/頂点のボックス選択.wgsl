struct CollsionBox {
    max: vec2<f32>,
    min: vec2<f32>,
}

@group(0) @binding(0) var<storage, read_write> outputData: array<f32>; // 出力
@group(0) @binding(1) var<uniform> collsionBox: CollsionBox; // 距離を計算する座標
@group(1) @binding(0) var<storage, read> vertices: array<vec2<f32>>; // キーに含まれる頂点の数

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pointIndex = global_id.x;
    if (arrayLength(&vertices) <= pointIndex) {
        return;
    }

    let pos = vertices[pointIndex];
    if (collsionBox.min.x < pos.x && collsionBox.min.y < pos.y &&
        collsionBox.max.x > pos.x && collsionBox.max.y > pos.y) {
        outputData[pointIndex] = 100.0;
    } else {
        outputData[pointIndex] = 0.0;
    }
}