struct FragmentOutput {
    @location(0) color: vec4<f32>,   // カラーバッファ (通常は0番目の出力)
};

@fragment
fn main(
    @location(0) color: vec4<f32>,
) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = color;
    return output;
}