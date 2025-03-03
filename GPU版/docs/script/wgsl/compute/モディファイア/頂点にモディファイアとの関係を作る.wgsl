struct Output {
    index: vec4<u32>,
    weight: vec4<f32>,
}

struct ModifierBox {
    max: vec2<f32>,
    min: vec2<f32>,
}

@group(0) @binding(0) var<storage, read_write> outputData: array<Output>; // 出力
@group(0) @binding(1) var<storage, read> baseVertices: array<vec2<f32>>; // グラフィックメッシュの頂点位置
@group(1) @binding(0) var<uniform> modifierBox: ModifierBox; // モディファイアの頂点位置
@group(1) @binding(1) var<uniform> modifierFineness: vec2<u32>; // モディファイアの分割数

fn calculateWeight(position: vec2<f32>) -> Output {
    var output: Output;
    var p = vec2<u32>(floor(position));
    var k = position % 1.0;
    if (p.x >= modifierFineness.x) {
        p.x = modifierFineness.x - 1u;
        k.x = 1.0;
    }
    if (p.y >= modifierFineness.y) {
        p.y = modifierFineness.y - 1u;
        k.y = 1.0;
    }
    let i: u32 = p.x + p.y * modifierFineness.x;
    output.index = vec4<u32>(i + p.y, i + 1u + p.y, i + modifierFineness.x + 1u + p.y, i + modifierFineness.x + 2u + p.y);
    output.weight = vec4<f32>(
        (1.0 - k.y) * (1.0 - k.x),
        (1.0 - k.y) * (k.x),
        k.y * (1.0 - k.x),
        k.y * k.x,
    );
    return output;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let verticesIndex = global_id.x;
    if (arrayLength(&baseVertices) <= verticesIndex) {
        return;
    }

    outputData[verticesIndex] = calculateWeight(
            (baseVertices[verticesIndex] - modifierBox.min) / (modifierBox.max - modifierBox.min) * vec2f(modifierFineness)
        );
}