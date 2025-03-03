import { f_ts_t, pipelineFortextureToCVS, sampler } from "./GPUObject.js";
import { device,format,GPU } from "./webGPU.js";

export class TextureToCVS {
    constructor(cvs) {
        this.cvs = cvs;
        this.ctx = cvs.getContext('webgpu');
        this.ctx.configure({
            device: device,
            format: format
        });
        this.bindGroup = null;
    }

    setTexture(texture,textureView) {
        this.cvs.width = texture.width;
        this.cvs.height = texture.height;
        this.bindGroup = GPU.createGroup(f_ts_t, [{item: sampler, type: "ts"}, {item: textureView, type: "t"}]);
    }

    update() {
        console.log("描画")
        if (this.bindGroup) {
            const commandEncoder = device.createCommandEncoder();
            const renderPass = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: this.ctx.getCurrentTexture().createView(),
                        clearValue: { r: 1, g: 1, b: 1, a: 1 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            });
            renderPass.setPipeline(pipelineFortextureToCVS);
            renderPass.setBindGroup(0, this.bindGroup);
            renderPass.draw(4, 1, 0, 0);
            // 処理の終了と送信
            renderPass.end();
            device.queue.submit([commandEncoder.finish()]);
        }
    }
}