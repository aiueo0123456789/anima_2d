import { GPU, device } from './webGPU.js';
import { createID, managerForDOMs, updateDataForUI } from './グリッド/制御.js';

const maskTextureSize = [2048,2048];

class MaskTexture {
    constructor(name, size) {
        this.id = createID();
        this.name = name;
        this.texture= GPU.createTexture2D(size,"r8unorm");
        this.textureView = this.texture.createView();
        this.renderingObjects = [];
        this.useObjects = [];
    }
}

export class RenderObjectManager {
    constructor() {
        this.backgroundColor = { r: 1, g: 1, b: 1, a: 1 };
        this.maskTextures = [
            new MaskTexture("base", [1,1]),
            new MaskTexture("test1", maskTextureSize),
        ];

        if (true) { // 白のマスクテクスチャ
            const commandEncoder = device.createCommandEncoder();
            const value = this.maskTextures[0];
            const maskRenderPass = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: value.textureView,
                        clearValue: { r: 1, g: 0, b: 0, a: 0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            });
            // 処理の終了と送信
            maskRenderPass.end();
            device.queue.submit([commandEncoder.finish()]);
        }
    }

    destroy() {
        this.maskTextures.length = 0;
    }

    appendMaskTexture(name) {
        // updateDataForUI["プロパティ"] = true;
        this.maskTextures.push(new MaskTexture(name, maskTextureSize));
        managerForDOMs.update(this.maskTextures);
    }

    deleteMaskTextureFromName(name) {
    }

    deleteMaskTextureFromID(id) {
        for (let i = this.maskTextures.length - 1; i >= 0; i --) {
            if (this.maskTextures[i].id == id) {
                this.deleteMaskTexture(this.maskTextures[i]);
                return ;
            }
        }
    }

    deleteMaskTexture(maskTexture) {
        if (maskTexture.renderingObjects.length || maskTexture.useObjects.length) {
            console.warn("削除しようとしたマスクは参照されているため削除できません");
        } else {
            managerForDOMs.deleteObject(maskTexture);
            this.maskTextures.splice(this.maskTextures.indexOf(maskTexture), 1);
        }
    }

    searchMaskTextureFromName(name) {
        for (const texture of this.maskTextures) {
            if (texture.name == name) return texture;
        }
        console.warn("マスクテクスチャが見つかりませんでした");
        return null;
    }
}