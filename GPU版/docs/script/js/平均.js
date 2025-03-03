import { GPU } from "./webGPU.js";
import { calculateAllAveragePipeline,c_srw } from "./GPUObject.js";

const aaaBuffer = GPU.createStorageBuffer((2) * 4, undefined, ["f32"]);
const aaaGroup = GPU.createGroup(c_srw, [{item: aaaBuffer, type: "b"}]);
export function calculateAllAverage(group, verticesNum) {
    GPU.runComputeShader(calculateAllAveragePipeline, [group, aaaGroup], Math.ceil(verticesNum / 20 / 64));
}