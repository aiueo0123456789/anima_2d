struct Animation {
    index: u32,
    padding: f32,
    movement: vec2<f32>,
}

struct Option {
    shaft: u32,
};

@group(0) @binding(0) var<storage, read_write> targetData: array<Animation>; // 出力
@group(1) @binding(0) var<storage, read> sourceData: array<Animation>; // 出力
@group(2) @binding(0) var<uniform> optionData: Option; // 頂点インデックスのデータ

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let threadIndex = global_id.x;
    if (arrayLength(&targetData) <= threadIndex) {
        return;
    }

    let data = sourceData[threadIndex];
    if (optionData.shaft == 0u) {
        targetData[threadIndex] = Animation(data.index, data.padding, data.movement * vec2f(-1,1));
    } else if (optionData.shaft == 1u) {
        targetData[threadIndex] = Animation(data.index, data.padding, data.movement * vec2f(1,-1));
    } else {
        targetData[threadIndex] = Animation(data.index, data.padding, data.movement * vec2f(-1,-1));
    }
}