struct Data {
}

@group(0) @binding(0) var<storage, read_write> outputData: array<Data>; // 出力
@group(0) @binding(1) var<storage, read> baseData: array<Data>; // 基準
@group(0) @binding(2) var<storage, read> updateData: array<Data>; // 入力

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let threadIndex = global_id.x;
    if (arrayLength(&updateData) <= threadIndex) {
        return;
    }

    outputData[threadIndex] = updateData[threadIndex] - baseData[threadIndex];
}