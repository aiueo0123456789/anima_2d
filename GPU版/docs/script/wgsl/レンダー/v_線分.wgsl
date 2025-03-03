struct Camera {
    position: vec2<f32>,
    zoom: f32,
    padding: f32,
}

@group(0) @binding(0) var<uniform> cvsAspect: vec2<f32>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(1) @binding(0) var<storage, read> verticesPosition: array<vec2<f32>>;
@group(2) @binding(0) var<uniform> size: f32;

struct VertexOutput {
    @builtin(position) position: vec4<f32>, // クリッピング座標系での頂点位置
}

const pointData = array<vec4<f32>, 4>(
    vec4<f32>(-1.0, -1.0, 0.0, 1.0), // 左下
    vec4<f32>(-1.0,  1.0, 0.0, 0.0), // 左上
    vec4<f32>( 1.0, -1.0, 1.0, 1.0), // 右下
    vec4<f32>( 1.0,  1.0, 1.0, 0.0), // 右上
);

// バーテックスシェーダー
@vertex
fn main(
    @builtin(instance_index) instanceIndex: u32, // インスタンスのインデックス
    @builtin(vertex_index) vertexIndex: u32
    ) -> VertexOutput {
    // 頂点データを取得
    // let index = instanceIndex * 2u;
    let index = instanceIndex;
    let position1 = verticesPosition[index];
    let position2 = verticesPosition[index + 1u];
    // let point = pointData[vertexIndex % 4u];
    let sub = position2 - position1;
    let thickness = 0.005; // 線の太さ
    let normal = normalize(vec2<f32>(-sub.y, sub.x)); // 仮の法線
    var offset = vec2<f32>(0.0);

    if (vertexIndex % 4u == 0u) {
        offset = position1 - (normal * thickness) / camera.zoom;
    } else if (vertexIndex % 4u == 1u) {
        offset = position1 + (normal * thickness) / camera.zoom;
    } else if (vertexIndex % 4u == 2u) {
        offset = position2 - (normal * thickness) / camera.zoom;
    } else {
        offset = position2 + (normal * thickness) / camera.zoom;
    }

    var output: VertexOutput;
    output.position = vec4f((offset - camera.position) * camera.zoom * cvsAspect, 0, 1.0);
    return output;
}