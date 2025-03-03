struct Rotate {
    position: vec2<f32>,
    scale: f32,
    angle: f32,
}

@group(0) @binding(0) var<storage, read_write> outputData: Rotate; // 出力
@group(0) @binding(1) var<uniform> rotateData: Rotate; // 移動回転スケールデータ

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    outputData += rotateData;
}