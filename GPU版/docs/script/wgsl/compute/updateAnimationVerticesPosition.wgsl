struct Output {
    index: u32,
    padding: f32,
    movement: vec2<f32>,
}

struct ActiveIndex {
    padding: vec3<f32>, // パディングで16バイトを確保
    index: u32,
};

@group(0) @binding(0) var<storage, read_write> outputData: array<Output>; // 出力
@group(1) @binding(0) var<uniform> activeIndexs: array<ActiveIndex, 1000>; // シェイプキーのデータ
@group(1) @binding(1) var<uniform> movement: vec2<f32>; // 移動距離

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pointIndex = global_id.x;
    if (arrayLength(&activeIndexs) <= pointIndex) {
        return;
    }

    outputData[activeIndexs[pointIndex].index].movement += movement;
}