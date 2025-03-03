struct Camera {
    position: vec2<f32>,
    zoom: f32,
    padding: f32,
}

@group(0) @binding(0) var<uniform> cvsAspect: vec2<f32>;
@group(0) @binding(1) var<uniform> camera: Camera;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>,
};

const pointData = array<vec4<f32>, 4>(
    vec4<f32>(-1.0, -1.0, 0.0, 1.0), // 左下
    vec4<f32>(-1.0, 1.0, 0.0, 0.0), // 左上
    vec4<f32>(1.0, -1.0, 1.0, 1.0), // 右下
    vec4<f32>(1.0, 1.0, 1.0, 0.0), // 右上
);

@vertex
fn main(
    @builtin(vertex_index) vertexIndex: u32
) -> VertexOutput {
    var output: VertexOutput;
    let point = pointData[vertexIndex];
    output.position = vec4<f32>((point.xy / ((1.0 / cvsAspect) / 2048.0) - camera.position * cvsAspect) * camera.zoom, 0.0, 1.0);
    output.texCoord = point.zw * 2048.0;
    return output;
}