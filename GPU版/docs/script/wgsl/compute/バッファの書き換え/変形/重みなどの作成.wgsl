@group(0) @binding(0) var<storage, read_write> weight: array<f32>;
@group(0) @binding(1) var<storage, read> verticesIndexs: array<u32>;
@group(1) @binding(0) var<uniform> proportionalEditType: u32;
@group(1) @binding(1) var<uniform> proportionalSize: f32;
@group(1) @binding(2) var<uniform> pointOfEffort: vec2<f32>;
@group(2) @binding(0) var<storage, read> vertices: array<vec2<f32>>;

fn arrayIncludes(value: u32) -> bool {
    for (var i = 0u; i < arrayLength(&verticesIndexs); i = i + 1u) {
        if (verticesIndexs[i] == value) {
            return true;
        }
    }
    return false;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&vertices) <= index) {
        return;
    }
    if (proportionalEditType == 0u) { // 通常
        if (arrayIncludes(index)) {
            weight[index] = 1.0;
        } else {
            weight[index] = 0.0;
        }
    } else if (proportionalEditType == 1u) { // 1次関数
        if (arrayIncludes(index)) {
            weight[index] = 1.0;
        } else {
            let dist = distance(vertices[index], pointOfEffort);
            if (dist < proportionalSize) {
                weight[index] = 1.0 - dist / proportionalSize;
            } else {
                weight[index] = 0.0;
            }
        }
    } else if (proportionalEditType == 2u) { // 2次関数
        if (arrayIncludes(index)) {
            weight[index] = 1.0;
        } else {
            let dist = distance(vertices[index], pointOfEffort);
            if (dist < proportionalSize) {
                weight[index] = pow((1.0 - dist / proportionalSize), 2.0);
            } else {
                weight[index] = 0.0;
            }
        }
    }
}