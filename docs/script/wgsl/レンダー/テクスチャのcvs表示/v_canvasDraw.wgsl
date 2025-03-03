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
    output.position = vec4<f32>(point.xy, 0.0, 1.0);
    output.texCoord = point.zw;
    return output;
}