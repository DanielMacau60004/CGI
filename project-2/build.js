import { multRotationY, multScale, pushMatrix, multTranslation, popMatrix } from "../../libs/stack.js";
import { uploadModelView, drawCube } from "./app.js"

const BIG_MIN_HEIGHT = 30;
const BIG_MAX_HIGHT = 50;
const SMALL_MIN_HEIGHT = 10;
const SMALL_MAX_HIGHT = 30;

const NUMBER_OF_PILLARS = 10;

const SMALL_SCALE = 0.7;

const SMALL_PILLAR_SIZE = 0.5;
const BIG_PILLAR_SIZE = 0.8;

const BUILD_SIZE = 15;
const ROOF_SIZE = BUILD_SIZE + 1;
const ROOF_HEIGHT = 1;

let bodyColors = [[[0.28, 0.6, 0.8, 1], [0.47, 0.73, 0.89, 1], [0.5, 0.67, 0.78, 1], [0.67, 0.85, 0.93, 1]]];
let decoratorColors = [[[0.12, 0.145, 0.16, 1], [0.12, 0.22, 0.28, 1], [0.29, 0.34, 0.46, 1], [0.012, 0.11, 0.15, 1], [0.21, 0.233, 0.24, 1]]];

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

export class Build {

    constructor(position) {
        let color = getRandom(0, bodyColors.length);
        this.position = position;
        this.bodyColor = bodyColors[color][getRandom(0, bodyColors[color].length)];
        this.decorColor = decoratorColors[color][getRandom(0, decoratorColors[color].length)];
        this.height = getRandom(BIG_MIN_HEIGHT, BIG_MAX_HIGHT);
        this.minHeight = getRandom(SMALL_MIN_HEIGHT, SMALL_MAX_HIGHT);
    }

    layoutVertical(height) {
        pushMatrix();
        this.layoutVerticalFace(0, height);
        popMatrix();

        pushMatrix();
        this.layoutVerticalFace(90, height);
        popMatrix();

        pushMatrix();
        this.layoutVerticalFace(180, height);
        popMatrix();

        this.layoutVerticalFace(270, height);
    }

    layoutVerticalFace(angle, height) {
        multRotationY(angle);
        for (let i = 0; i < NUMBER_OF_PILLARS; i++) {
            pushMatrix();
            multTranslation([i * BUILD_SIZE / NUMBER_OF_PILLARS - BUILD_SIZE/2, height / 2, -BUILD_SIZE/2]);
            if (i == 0)
                multScale([BIG_PILLAR_SIZE, height, BIG_PILLAR_SIZE]);
            else
                multScale([SMALL_PILLAR_SIZE, height, SMALL_PILLAR_SIZE]);
            uploadModelView();
            drawCube(this.decorColor);
            popMatrix();
        }
    }

    build(height) {
        pushMatrix();
        multTranslation([0, height + ROOF_HEIGHT/2, 0]);
        multScale([ROOF_SIZE, ROOF_HEIGHT, ROOF_SIZE]);
        uploadModelView();
        drawCube(this.decorColor);
        popMatrix();

        pushMatrix();
        this.layoutVertical(height);
        popMatrix();
        multTranslation([0, height / 2, 0]);
        multScale([BUILD_SIZE, height, BUILD_SIZE]);
        uploadModelView();
        drawCube(this.bodyColor);
    }

    draw() {
        pushMatrix();
        multTranslation(this.position);
        pushMatrix();
        this.build(this.height);
        popMatrix();

        if (this.minHeight > 0) {
            multTranslation([0, this.height, 0]);
            multScale([SMALL_SCALE, 1, SMALL_SCALE]);
            this.build(this.minHeight);
        }
        popMatrix();
    }

}