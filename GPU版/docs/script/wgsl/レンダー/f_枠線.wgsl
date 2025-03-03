@group(2) @binding(1) var<uniform> color: vec4<f32>; // 距離を計算する座標
// @group(2) @binding(0) var<uniform> boxPoint: vec4<f32>;

struct FragmentOutput {
    @location(0) color: vec4<f32>,   // カラーバッファ (通常は0番目の出力)
};

@fragment
fn main(
    @location(0) uv: vec2<f32>,
    @location(1) wk: f32,
    @location(2) hk: f32,
) -> FragmentOutput {
    var output: FragmentOutput;
    if (uv.x > wk && uv.x < 1.0 - wk && uv.y > hk && uv.y < 1.0 - hk) {
        discard ;
    }
    output.color = color;
    return output;
}