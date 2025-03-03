struct Output {
    position: vec2<f32>,
}

struct ActiveIndex {
    movement: vec2<f32>,
    index: u32,
    padding: f32,
};

@group(0) @binding(0) var<storage, read_write> outputData: array<Output>; // 出力
@group(1) @binding(0) var<storage, read> activeIndexs: array<ActiveIndex>; // 頂点インデックスのデータ

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let threadIndex = global_id.x;
    if (arrayLength(&activeIndexs) <= threadIndex) {
        return;
    }

    let pointIndex = activeIndexs[threadIndex].index;

    outputData[pointIndex].position = activeIndexs[threadIndex].movement + outputData[pointIndex].position * activeIndexs[threadIndex].padding;
}