// @group(2) @binding(1) var<uniform> color: vec3<f32>; // 距離を計算する座標
@group(2) @binding(1) var<uniform> color: vec4<f32>;

struct FragmentOutput {
    @location(0) color: vec4<f32>,   // カラーバッファ (通常は0番目の出力)
};

@fragment
fn main(
    @location(0) uv: vec2<f32>,
) -> FragmentOutput {
    var output: FragmentOutput;
    // if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    if (pow(uv.x * 2.0 - 1.0, 2.0) + pow(uv.y * 2.0 - 1.0, 2.0) > 1.0) {
        discard ;
    }
    // output.color = vec4f(1,0,0,1);
    output.color = color;
    return output;
}