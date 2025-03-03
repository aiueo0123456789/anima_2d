struct Camera {
    position: vec2<f32>,
    zoom: f32,
    padding: f32,
}

struct Data {
    position: vec2<f32>,
    scale: f32,
    angle: f32,
}

@group(0) @binding(0) var<uniform> cvsAspect: vec2<f32>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(1) @binding(0) var<uniform> data: Data;
@group(2) @binding(0) var<uniform> textureSize: vec2<f32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>, // クリッピング座標系での頂点位置
    @location(0) uv: vec2<f32>,
}

const pointData = array<vec4<f32>, 4>(
    // vec4<f32>(-1.0, -1.0, 0.0, 1.0), // 左下
    // vec4<f32>(-1.0,  1.0, 0.0, 0.0), // 左上
    // vec4<f32>( 1.0, -1.0, 1.0, 1.0), // 右下
    // vec4<f32>( 1.0,  1.0, 1.0, 0.0), // 右上
    vec4<f32>(-1.0, 0.0, 0.0, 1.0), // 左下
    vec4<f32>(-1.0,  2.0, 0.0, 0.0), // 左上
    vec4<f32>( 1.0, 0.0, 1.0, 1.0), // 右下
    vec4<f32>( 1.0,  2.0, 1.0, 0.0), // 右上
);

fn rotate2D(point: vec2<f32>, angle: f32) -> vec2<f32> {
    let cosTheta = cos(angle);
    let sinTheta = sin(angle);

    let xPrime = point.x * cosTheta - point.y * sinTheta;
    let yPrime = point.x * sinTheta + point.y * cosTheta;

    return vec2<f32>(xPrime, yPrime);
}

// バーテックスシェーダー
@vertex
fn main(
    @builtin(instance_index) instanceIndex: u32, // インスタンスのインデックス
    @builtin(vertex_index) vertexIndex: u32
    ) -> VertexOutput {
    // 頂点データを取得
    let point = pointData[vertexIndex % 4u];

    var output: VertexOutput;
    output.position = vec4f((data.position + rotate2D(point.xy * textureSize * data.scale, data.angle) - camera.position) * camera.zoom * cvsAspect, 0, 1.0);
    output.uv = point.zw;
    return output;
}