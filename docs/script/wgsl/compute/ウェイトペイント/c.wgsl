struct Output {
    indexs: vec4<u32>,
    weights: vec4<f32>,
}

struct Config {
    decayType: u32,
    decaySize: f32,
    index: u32,
    weight: f32,
}

@group(0) @binding(0) var<storage, read_write> indexAndWeight: array<Output>;
@group(0) @binding(1) var<storage, read> originalIndexAndWeight: array<Output>;
@group(0) @binding(2) var<storage, read_write> maxWeights: array<f32>;
@group(0) @binding(3) var<storage, read> vertices: array<vec2<f32>>;
@group(1) @binding(0) var<uniform> config: Config;
@group(1) @binding(1) var<uniform> centerPoint: vec2<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&vertices) <= index) {
        return;
    }
    let dist = distance(centerPoint, vertices[index]);
    let decay = (config.decaySize - dist) / config.decaySize;
    if (dist < config.decaySize) {
        let weight = config.weight * decay;
        maxWeights[index] = max(maxWeights[index],weight);
    }
    var minIndex = 0u;
    var minWeight = 1.1;
    let data = originalIndexAndWeight[index];
    for (var i = 0u; i < 4u; i ++) {
        if (config.index == data.indexs[i]) {
            minIndex = i;
            minWeight = data.weights[i];
            break ;
        } else if (data.weights[i] < minWeight) {
            minIndex = i;
            minWeight = data.weights[i];
        }
    }
    if (minWeight < maxWeights[index]) {
        indexAndWeight[index].indexs[minIndex] = config.index;
        indexAndWeight[index].weights[minIndex] = maxWeights[index];
        var sumWeight = 0.0;
        for (var i = 0u; i < 4u; i ++) {
            sumWeight += indexAndWeight[index].weights[i];
        }
        indexAndWeight[index].weights /= sumWeight; // 正規化
    }
}