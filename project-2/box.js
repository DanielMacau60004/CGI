import { multScale, pushMatrix, multTranslation, popMatrix } from "../libs/stack.js";
import { uploadModelView, drawCube } from "./app.js"
import { add } from "../../libs/MV.js";

const SCALE = 1.1;

const MAX_TIME = 5;
const FALL_FACTOR = 0.4;
const SMOOTH_FACTOR = 0.1;

function randomFloat(min, max) {
    const str = (Math.random() * (max - min) + min);
    return parseFloat(str);
}

export class Box {

    constructor(city, position, velocity) {
        this.city = city;
        this.position = position;
        this.velocity = velocity;
        this.age = 0;

        this.color = [randomFloat(0, 1), randomFloat(0, 1), randomFloat(0, 1), 1];
    }

    lerp(goal, current, delta) {
        return (current + (goal - current) * delta);
    }

    update(time) {
        this.age += time;
        this.position[1] -= FALL_FACTOR;

        this.position = add(this.position, this.velocity);

        if (this.position[1] < this.city.min_height)
            this.velocity = [this.lerp(0, this.velocity[0], SMOOTH_FACTOR), 0, this.lerp(0, this.velocity[2], SMOOTH_FACTOR)];

        this.position[1] = Math.max(this.position[1], this.city.min_height);
    }

    isAlive() {
        return this.age <= MAX_TIME;
    }

    draw() {
        pushMatrix();
        multTranslation(this.position);
        multTranslation([0, SCALE / 2, 0]);
        multScale([SCALE, SCALE, SCALE]);
        uploadModelView();
        drawCube(this.color);
        popMatrix();
    }

} 