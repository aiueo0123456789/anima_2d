struct Rotate {
    position: vec2<f32>,
    scale: f32,
    angle: f32,
}

@group(0) @binding(0) var<storage, read_write> outputData: array<vec2<f32>>; // 出力
@group(1) @binding(0) var<uniform> baseData: Rotate; // 回転の中心
@group(1) @binding(1) var<uniform> rotateData: Rotate; // 移動回転スケールデータ

fn rotate2D(point: vec2<f32>, angle: f32) -> vec2<f32> {
    let cosTheta = cos(angle);
    let sinTheta = sin(angle);

    let xPrime = point.x * cosTheta - point.y * sinTheta;
    let yPrime = point.x * sinTheta + point.y * cosTheta;

    return vec2<f32>(xPrime, yPrime);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pointIndex = global_id.x;
    if (arrayLength(&outputData) <= pointIndex) {
        return;
    }

    let pos = rotate2D(outputData[pointIndex] - baseData.position, rotateData.angle - baseData.angle) * (rotateData.scale - baseData.scale + 1.0) + rotateData.position;
    outputData[pointIndex] = pos;
}