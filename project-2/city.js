import { multRotationY, multScale, pushMatrix,  multTranslation, popMatrix } from "../../libs/stack.js";
import { uploadModelView, drawCylinder, drawCube } from "./app.js"

import * as BUILD from "./build.js"

const ORBIT = 30;

const FLOOR_SIZE = 140;
const FLOOR_HEIGHT = 5;
const FLOOR_COLOR = [0.64, 0.67, 0.68, 1.0];

const ROAD_WIDTH = 20;
const ROAD_COLOR = [0.23, 0.27, 0.27, 1.0];

const CITY_MAX_HEIGHT = 50;
const CITY_MIN_HEIGHT = 0;

export class City {

    constructor() {
        this.buildings = [];

        this.min_height = CITY_MIN_HEIGHT;
        this.max_height = CITY_MAX_HEIGHT;

        this.buildings.push(new BUILD.Build([0,0,0]));
        this.buildings.push(new BUILD.Build([-50,0,50]));
        this.buildings.push(new BUILD.Build([-30,0,50]));
        this.buildings.push(new BUILD.Build([-50,0,30]));
        this.buildings.push(new BUILD.Build([50,0,-50]));
        this.buildings.push(new BUILD.Build([30,0,-50]));
        this.buildings.push(new BUILD.Build([50,0,-30]));
        this.buildings.push(new BUILD.Build([-50,0,-50]));
        this.buildings.push(new BUILD.Build([-30,0,-50]));
        this.buildings.push(new BUILD.Build([-50,0,-30]));
    }


    drawRoad(angle) {
        multRotationY(angle);
        multTranslation([(2 * ORBIT + ROAD_WIDTH/2)/2, 0, 0]);
        multScale([FLOOR_SIZE - (2 * ORBIT + ROAD_WIDTH/2), 0.01, ROAD_WIDTH/2]);
        uploadModelView();
        drawCube(ROAD_COLOR);
    }

    drawFloor() {
        multTranslation([0, -2.5, 0]);
        multScale([FLOOR_SIZE, FLOOR_HEIGHT,  FLOOR_SIZE]);
        uploadModelView();
        drawCube(FLOOR_COLOR);
    }

    drawRoads() {
        pushMatrix();
        multScale([2 * ORBIT - ROAD_WIDTH/2, 0.02, 2 * ORBIT - ROAD_WIDTH/2]);
        uploadModelView();
        drawCylinder(FLOOR_COLOR);
        popMatrix();

        pushMatrix();
        multScale([2 * ORBIT + ROAD_WIDTH/2, 0.01, 2 * ORBIT + ROAD_WIDTH/2]);
        uploadModelView();
        drawCylinder(ROAD_COLOR);
        popMatrix();

        pushMatrix();
        this.drawRoad(0);
        popMatrix();

        pushMatrix();
        this.drawRoad(90);
        popMatrix();

        pushMatrix();
        this.drawRoad(180);
        popMatrix();

        this.drawRoad(270);
    }

    draw() {
        pushMatrix();
        this.buildings.forEach(building => building.draw());
        popMatrix();

        pushMatrix();
        this.drawRoads();
        popMatrix();

        this.drawFloor();
    }

}