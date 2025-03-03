struct Camera {
    position: vec2<f32>,
    zoom: f32,
    padding: f32,
}

@group(0) @binding(0) var<uniform> cvsAspect: vec2<f32>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(1) @binding(0) var<storage, read> boxPoint: vec4<f32>;
@group(2) @binding(0) var<uniform> size: f32;

struct VertexOutput {
    @builtin(position) position: vec4<f32>, // クリッピング座標系での頂点位置
    @location(0) uv: vec2<f32>,
    @location(1) wk: f32,
    @location(2) hk: f32,
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
    var point: vec2<f32>;
    if (vertexIndex % 4u == 0u) {
        point = boxPoint.xy;
    } else  if (vertexIndex % 4u == 1u) {
        point = boxPoint.xw;
    } else  if (vertexIndex % 4u == 2u) {
        point = boxPoint.zy;
    } else {
        point = boxPoint.zw;
    }

    var output: VertexOutput;
    output.position = vec4f((point - camera.position) * camera.zoom * cvsAspect, 0, 1.0);
    output.uv = pointData[vertexIndex % 4u].zw;
    output.wk = size / (boxPoint.z - boxPoint.x) / camera.zoom;
    output.hk = size / (boxPoint.w - boxPoint.y) / camera.zoom;
    return output;
}