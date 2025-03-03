@group(0) @binding(0) var<storage, read_write> output: array<vec2<f32>>;
@group(0) @binding(1) var<uniform> pointOfEffort: vec2<f32>;
@group(0) @binding(2) var<storage, read> originalVertices: array<vec2<f32>>;
@group(0) @binding(3) var<storage, read> weigth: array<f32>;
@group(0) @binding(4) var<uniform> value: vec2<f32>;

fn getAngle(a: vec2<f32>, b: vec2<f32>) -> f32 {
    return atan2(a.y - b.y, a.x - b.x);
}

fn rotate(p: vec2<f32>, angle: f32) -> vec2<f32> {
    let c = cos(angle);
    let s = sin(angle);
    return vec2<f32>(
        p.x * c - p.y * s,
        p.x * s + p.y * c,
    );
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&weigth) <= index) {
        return;
    }
    let sub = rotate(originalVertices[index] - pointOfEffort, value.x * (weigth[index]));
    output[index] = sub + pointOfEffort;
}