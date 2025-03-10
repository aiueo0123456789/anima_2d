import { updateDataForUI } from "./グリッド/制御.js";

export class WeightKeyframe {
    constructor(object) {
        this.belongObject = object;
        this.keys = [];
    }

    addKeyframe(frame, data) {
        let insertIndex = this.keys.length;
        for (let i = 0; i < this.keys.length; i ++) {
            if (frame == this.keys[i].frame) {
                this.keys[i].data = data;
                // updateDataForUI["タイムライン"] = true;
                return ;
            } else if (frame < this.keys[i].frame) {
                insertIndex = i;
                break ;
            }
        }
        this.keys.splice(insertIndex,0,{frame, data});
        // updateDataForUI["タイムライン"] = true;
    }

    deleteKeyframe(key) {
        this.keys.splice(this.keys.indexOf(key),1);
        // updateDataForUI["タイムライン"] = true;
    }

    updateKeyframe(key,newData) {
        key.data = newData;
    }

    setKeyframe(data) {
        for (const key of data) {
            // this.addKeyframe(key.frame,key.data)
            this.keys.push(key);
        }
    }

    getKeyFromFrame(frame, threshold = 0.5) {
        for (const key of this.keys) {
            if (Math.abs(key.frame - frame) < threshold) return key;
        }
        return null;
    }

    hasKeyFromFrame(frame, threshold = 0.5) {
        for (const key of this.keys) {
            if (Math.abs(key.frame - frame) < threshold) return true;
        }
        return false;
    }

    update(frame) {
        if (this.keys.length == 0) return ;
        let beforeData = this.keys[0];
        let afterData = this.keys[0];
        for (const key of this.keys) {
            beforeData = afterData;
            afterData = key;
            if (frame < key.frame) {
                break ;
            }
        }
        let weight = Math.max(0,Math.min((frame - beforeData.frame) / (afterData.frame - beforeData.frame),1));
        // console.log("前",beforeData,"後",afterData,"現在",frame,"割合",weight)
        this.belongObject.weight = (afterData.data - beforeData.data) * weight + beforeData.data;
    }

    getSaveData() {
        return {
            type: "ウェイト",
            keys: this.keys,
        };
    }
}