@group(2) @binding(1) var<uniform> color: vec4<f32>; // 距離を計算する座標

struct FragmentOutput {
    @location(0) color: vec4<f32>,   // カラーバッファ (通常は0番目の出力)
};

@fragment
fn main(
) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = color;
    return output;
}