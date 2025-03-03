fn binary4ToU32Direct(b0: u32, b1: u32, b2: u32, b3: u32) -> u32 {
    return (b0 << 3u) | (b1 << 2u) | (b2 << 1u) | b3;
}

@group(0) @binding(0) var<storage, read_write> outputData: array<u32>; // 出力
@group(0) @binding(1) var inputTexture: texture_2d<f32>;

fn sampleValue(samplePoint: vec2<i32>, dimensions: vec2<i32>) -> u32 {
    if (samplePoint.x >= dimensions.x || samplePoint.x < 0 ||
        samplePoint.y >= dimensions.y || samplePoint.y < 0) {
        return 0u;
    }
    return select(0u,1u,textureLoad(inputTexture, samplePoint, 0).a != 0.0);
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let samplePoint = vec2i(id.xy) + vec2i(-1,-1);
    let dimensions = vec2i(textureDimensions(inputTexture).xy);
    if (dimensions.x <= samplePoint.x || dimensions.y <= samplePoint.y) {
        return ;
    }
    var b0 = sampleValue(samplePoint + vec2<i32>(0, 1), dimensions);
    var b1 = sampleValue(samplePoint + vec2<i32>(1, 1), dimensions);
    var b2 = sampleValue(samplePoint + vec2<i32>(1, 0), dimensions);
    var b3 = sampleValue(samplePoint + vec2<i32>(0, 0), dimensions);

    outputData[id.x + id.y * u32(dimensions.x + 1)] = binary4ToU32Direct(b0,b1,b2,b3);
}