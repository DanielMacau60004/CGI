import { modelView, multRotationY, multRotationX, multScale, pushMatrix, multRotationZ, multTranslation, popMatrix } from "../../libs/stack.js";
import { uploadModelView, drawSphere, drawCylinder, drawCube } from "./app.js"
import { mult,lookAt,mat4} from "../../libs/MV.js";
import * as BOX from "./box.js"
import { scale } from "../libs/MV.js";

const ORBIT = 30;

const START_ORIENTATION = 270;
const SMOOTH_FACTOR = 0.01;
const MAX_INCLINATION = 30;
const MIN_HEIGHT_FORWARD = 1;

const PROPELLER_SPEED = 60;
const PROPPELER_COLOR = [0, 0, 0, 1.0];
const PROPELLER_HEIGHT = 0.02;
const PROPELLER_WIDTH = 0.4;
const PROPELLER_SUPPORT_COLOR = [1.0, 1.0, 0.0, 1.0];
const PROPELLER_SUPPORT_SCALE = [0.1, 0.5, 0.1];

const BODY_SCALE = [5, 2.5, 2.5];
const BODY_COLOR = [85 / 256, 107 / 256, 47 / 256, 1.0];

const TAIL_TRANSLATION = [3.8, 0.4, 0];
const TAIL_SCALE = [5, 0.7, 0.7];
const TAIL_COLOR = [85 / 256, 107 / 256, 47 / 256, 1.0];

const SMALL_TAIL_SCALE = [1, 0.5, 0.5];
const SMALL_TAIL_COLOR = [85 / 256, 107 / 256, 47 / 256, 1.0];
const SMALL_TAIL_INCLINATION = 70;

const SUB_TAIL_TRANSLATION = [6.3, 0.8, 0];
const SUB_TAIL_PROPELLER_TRANSLATION = [0, 0, 0.4];
const SUB_TAIL_PROPELLER_ROTATION = 90;

const BASE_SUPPORT_SCALE = [1.5, 0.2, 0.2];
const BASE_SUPPORT_COLOR = [0.5, 0.5, 0.5, 1.0];
const BASE_SUPPORT_INCLINATION = -20;

const GROUND_SUPPORT_SCALE = [0.25, 5, 0.25];
const GROUND_SUPPORT_COLOR = [1.0, 1.0, 0.0, 1.0];
const GROUND_SUPPORT_ROTATION = 90;

const NOSE = [-2,0,0,1];

export class Helicopter {

    constructor(city) {
        this.city = city;
        this.position = [ORBIT, 0, 0];

        this.model = mat4();

        this.zAxisAngle = 0;
        this.velocityX = 0;
        this.maxVelocity = 0;
        this.maxInc = 0;
        this.maxPropellerAngle = 0;
        this.propellerAngle = 0;
        this.propellerVelocity = 0;
        this.velocityY = 0;
        this.maxVelocityY = 0;
        this.yAxisAngle = 0;

        this.boxes = [];
    }

    drawPropeller(lengthProp) {
        multTranslation([lengthProp / 2, 0, 0]);
        multScale([lengthProp, PROPELLER_HEIGHT, PROPELLER_WIDTH]);
        uploadModelView();
        drawSphere(PROPPELER_COLOR);
    }

    drawPropellers(angle, lengthProp) {
        pushMatrix();
        multRotationY(angle);
        multRotationX(15);
        pushMatrix();
        
        this.drawPropeller(lengthProp);
        popMatrix();
        multRotationY(180);
        this.drawPropeller(lengthProp);
        popMatrix();
        this.drawPropellerSupport();
    }

    drawPropellerSupport() {
        multScale(PROPELLER_SUPPORT_SCALE);
        uploadModelView();
        drawCylinder(PROPELLER_SUPPORT_COLOR);
    }

    drawBody() {
        multScale(BODY_SCALE);
        uploadModelView();
        drawSphere(BODY_COLOR);
    }

    drawTail() {
        multTranslation(TAIL_TRANSLATION);
        multScale(TAIL_SCALE);
        uploadModelView();
        drawSphere(TAIL_COLOR);
    }

    drawSmallTail() {
        multRotationZ(SMALL_TAIL_INCLINATION);
        multScale(SMALL_TAIL_SCALE);
        uploadModelView();
        drawSphere(SMALL_TAIL_COLOR);
    }

    drawSubTail() {
        multTranslation(SUB_TAIL_TRANSLATION);

        pushMatrix();
        this.drawSmallTail();
        popMatrix();

        multTranslation(SUB_TAIL_PROPELLER_TRANSLATION);
        multRotationX(SUB_TAIL_PROPELLER_ROTATION);
        this.drawPropellers(this.propellerAngle, 0.7);
    }

    drawBase_Support(xDesloc, zAxisAngle) {
        multTranslation([xDesloc, 0.65, -0.2]);
        multRotationX(BASE_SUPPORT_INCLINATION);
        multRotationZ(zAxisAngle);
        multScale(BASE_SUPPORT_SCALE);
        uploadModelView();
        drawCube(BASE_SUPPORT_COLOR);
    }

    drawGroundBar() {
        multRotationZ(GROUND_SUPPORT_ROTATION);
        multScale(GROUND_SUPPORT_SCALE);
        uploadModelView();
        drawCylinder(GROUND_SUPPORT_COLOR);
    }

    drawBase() {
        pushMatrix();
        this.drawGroundBar();
        popMatrix();

        pushMatrix();
        this.drawBase_Support(-1, 60);
        popMatrix();
        this.drawBase_Support(1, 120);

    }

    lerp(goal, current, delta) {
        return (current + (goal - current) * delta);
    }

    moveForward(newMaxVelocity) {
        if (this.position[1] < MIN_HEIGHT_FORWARD)
            this.maxVelocity = 0;
        else
            this.maxVelocity = newMaxVelocity;

        if (this.maxVelocity != 0) {
            this.maxInc = MAX_INCLINATION;
            this.maxPropellerAngle = PROPELLER_SPEED;
        }
        else
            this.maxInc = 0;
    }

    moveVertically(newMaxVelocityY) {
        this.maxVelocityY = newMaxVelocityY;
        if (newMaxVelocityY < 0 && this.position[1] == this.city.min_height)
            this.maxPropellerAngle = 0;
        else if (this.maxVelocityY != 0)
            this.maxPropellerAngle = PROPELLER_SPEED;
    }

    getDirection() {
        let nose = mult(this.model, NOSE);
        return lookAt(this.getPosition(), [nose[0],nose[1],nose[2]], [0,1,0]);
    }

    getPosition() {
        let p = mult(this.model, [0,0,0,1]);
        return [p[0],p[1],p[2]];
    }

    getVelocity() {
        let p = mult(this.model, [-this.velocityX, 0,0,1]);
        let position = this.getPosition();
        return [p[0]-position[0],p[1]-position[1],p[2]-position[2]];
    }

    dropBox() {
        let box = new BOX.Box(this.city, this.getPosition(), this.getVelocity());
        this.boxes.push(box);
    }

    update(time) {
        //Inclination
        this.zAxisAngle = this.lerp(this.maxInc, this.zAxisAngle, SMOOTH_FACTOR);

        //Proppelers Speed
        this.propellerVelocity = this.lerp(this.maxPropellerAngle, this.propellerVelocity, SMOOTH_FACTOR);
        this.propellerAngle += this.propellerVelocity;

        //Y Rotation
        this.yAxisAngle += (180 * this.velocityX) / (ORBIT * Math.PI);

        //Translation
        this.velocityX = this.lerp(this.maxVelocity, this.velocityX, SMOOTH_FACTOR);
        this.velocityY = this.lerp(this.maxVelocityY, this.velocityY, SMOOTH_FACTOR);
        this.position[1] += this.velocityY;
        this.position[1] = Math.max(Math.min(this.position[1], this.city.max_height), this.city.min_height);

        //Update Boxes
        this.boxes = this.boxes.filter(box => box.isAlive());
        this.boxes.forEach(box => box.update(time));
    }

    draw() {
       
        pushMatrix();
        multRotationY(this.yAxisAngle);
        multTranslation(this.position);
        multRotationY(START_ORIENTATION);

        multRotationZ(this.zAxisAngle);

        pushMatrix();
        multTranslation([0, 2, 0]);

        this.model = modelView();

        pushMatrix();
        multTranslation([0, 1.4, 0]);
        this.drawPropellers(this.propellerAngle, 4.5);
        popMatrix();

        pushMatrix();
        multTranslation([0, 1.7, 0]);
        this.drawPropellers(-this.propellerAngle + 90, 4.5);
        popMatrix();

        pushMatrix();
        this.drawBody();
        popMatrix();

        pushMatrix();
        this.drawTail();
        popMatrix();

        this.drawSubTail();

        popMatrix();

        pushMatrix();
        multTranslation([0, 0, 0.8]);
        this.drawBase();
        popMatrix();

        multTranslation([0, 0, -0.8]);
        multScale([1.0, 1.0, -1.0]);
        this.drawBase();
        popMatrix();

        //Draw boxes
        this.boxes.forEach(box => box.draw());
    }

}