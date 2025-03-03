struct Data {
    index: u32,
    padding: f32,
    movement: vec2<f32>,
}

@group(0) @binding(0) var<storage, read_write> dataOutput: array<Data>; // 出力
@group(0) @binding(1) var<storage, read> dataInput: array<Data>; // 入力
@group(0) @binding(2) var<storage, read> correspondingIndex: array<u32>; // 入力
@group(0) @binding(3) var<storage, read> deleteIndexs: array<u32>; // 削除されるindex
@group(0) @binding(4) var<uniform> isVertexDeletion: f32; // 削除されるindex

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pointIndex = global_id.x;
    if (arrayLength(&dataOutput) <= pointIndex) {
        return;
    }

    var data = dataInput[correspondingIndex[pointIndex]];
    var count = 0u;
    if (isVertexDeletion == 1.0) {
        for (var i: u32 = 0u; i < arrayLength(&deleteIndexs); i ++) {
            if (data.index > deleteIndexs[i]) {
                data.index --;
            } else {
                break ;
            }
        }
    }
    dataOutput[pointIndex] = data;
}