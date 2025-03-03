struct Camera {
    position: vec2<f32>,
    zoom: f32,
    padding: f32,
}

@group(0) @binding(0) var<uniform> cvsAspect: vec2<f32>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(1) @binding(0) var<storage, read> verticesPosition: array<vec2<f32>>;
@group(1) @binding(1) var<storage, read> verticesUV: array<vec2<f32>>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>, // クリッピング座標系での頂点位置
    @location(0) uv: vec2<f32>,
}

// バーテックスシェーダー
@vertex
fn main(
    // @builtin(vertex_index) vertexIndex: u32
    @location(0) index: u32,
    ) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4f((verticesPosition[index] - camera.position) * camera.zoom * cvsAspect, 0, 1.0);
    output.uv = verticesUV[index];
    return output;
}