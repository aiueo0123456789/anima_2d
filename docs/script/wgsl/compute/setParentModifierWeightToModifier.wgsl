struct Output {
    index: vec4<u32>,
    weight: vec4<f32>,
}

struct ModifierBox {
    max: vec2<f32>,
    min: vec2<f32>,
}

@group(0) @binding(0) var<storage, read_write> outputData: array<Output>; // 出力
@group(0) @binding(1) var<uniform> modifierBox1: ModifierBox;
@group(0) @binding(2) var<uniform> modifierFineness1: vec2<u32>; // キーに含まれる頂点の数
@group(1) @binding(0) var<uniform> modifierBox2: ModifierBox; // モディファイアの頂点位置
@group(1) @binding(1) var<uniform> modifierFineness2: vec2<u32>; // モディファイアの分割数


fn calculateWeight(position: vec2<f32>) -> Output {
    var output: Output;
    var p = vec2<u32>(floor(position));
    var k = position % 1.0;
    if (p.x >= modifierFineness2.x) {
        p.x = modifierFineness2.x - 1u;
        k.x = 1.0;
    }
    if (p.y >= modifierFineness2.y) {
        p.y = modifierFineness2.y - 1u;
        k.y = 1.0;
    }
    let i: u32 = p.x + p.y * modifierFineness2.x;
    output.index = vec4<u32>(i + p.y, i + 1 + p.y, i + modifierFineness2.x + 1 + p.y, i + modifierFineness2.x + 2 + p.y);
    output.weight = vec4<f32>(
        (1.0 - k.y) * (1.0 - k.x),
        (1.0 - k.y) * (k.x),
        k.y * (1.0 - k.x),
        k.y * k.x,
    );
    return output;
}

@compute @workgroup_size(16,16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    if (global_id.x >= modifierFineness1.x + 1 || global_id.y >= modifierFineness1.y + 1) {
        return;
    }
    let pointIndex = global_id.x + global_id.y * (modifierFineness1.x + 1);

    let pos = modifierBox1.min + ((vec2f(global_id.xy) / vec2f(modifierFineness1.xy)) * (modifierBox1.max - modifierBox1.min));
    outputData[pointIndex] = calculateWeight(
            (pos - modifierBox2.min) / (modifierBox2.max - modifierBox2.min) * vec2f(modifierFineness2)
        );
}