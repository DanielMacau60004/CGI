import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, mult} from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationY, multRotationX, pushMatrix, multTranslation, popMatrix } from "../../libs/stack.js";

import * as SPHERE from '../../libs/objects/sphere.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as CUBE from '../../libs/objects/cube.js';
import * as TORUS from '../../libs/objects/torus.js';
import * as HELICOPTER from "./helicopter.js";
import * as CITY from "./city.js";
import { loadIdentity } from "../libs/stack.js";

let vp_distance = 30;

const AP = lookAt([0, 0, vp_distance], [0, 0, 0], [0, 1, 0]);
const SCROLL_FACTOR = 5;
const HELICOPTER_SPEED = 0.5;
const SKY_COLOR = [132.0 / 256, 207.0 / 256, 256 / 256, 1.0];

/** @type WebGLRenderingContext */
let gl;

let mode;
let program;
let canvas;
let mProjection;
let view;
let aspect;

let helicopter;
let city;

let theta = -45;
let gamma = 45;

let isDragging = false;
let start = [];
let current = [];

let currentProjection = 0;
let projections = [
    () => ortho(-vp_distance * aspect, vp_distance * aspect, -vp_distance, vp_distance, -3 * vp_distance, 3 * vp_distance),
    () => ortho(-10 * aspect, 10 * aspect, -20, 0, -10, vp_distance),
    () => ortho(-8 * aspect, 8 * aspect, -10.5, 5.5, 12, vp_distance)
];

let time = undefined;

let thetaRange = document.getElementById("range-theta");
let thetaOutputRange = document.getElementById("range-theta-output");
let gammaRange = document.getElementById("range-gamma");
let gammaOutputRange = document.getElementById("range-gamma-output");

export function uploadModelView() {
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModel"), false, flatten(modelView()));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mView"), false, flatten(view));
}

export function drawSphere(color) {
    gl.uniform4fv(gl.getUniformLocation(program, "fColor"), color);
    SPHERE.draw(gl, program, mode);

}

export function drawCube(color) {
    gl.uniform4fv(gl.getUniformLocation(program, "fColor"), color);
    CUBE.draw(gl, program, mode);

}

export function drawCylinder(color) {
    gl.uniform4fv(gl.getUniformLocation(program, "fColor"), color);
    CYLINDER.draw(gl, program, mode);
}

function updateRanges() {
    thetaRange.value = theta;
    thetaOutputRange.innerHTML = theta.toFixed(0);
    gammaRange.value = gamma;
    gammaOutputRange.innerHTML = gamma.toFixed(0);
    window.focus();
}

function setup(shaders) {
    canvas = document.getElementById("gl-canvas");
    aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    mode = gl.TRIANGLES;

    view = AP;
    mProjection = projections[currentProjection];

    city = new CITY.City();
    helicopter = new HELICOPTER.Helicopter(city);

    updateRanges();

    thetaRange.addEventListener('input', function () {
        thetaOutputRange.innerHTML = thetaRange.value;
        theta = Number(thetaRange.value);
    });

    gammaRange.addEventListener('input', function () {
        gammaOutputRange.innerHTML = gammaRange.value;
        gamma = Number(gammaRange.value);
    });

    resize_canvas();
    window.addEventListener("resize", resize_canvas);
    canvas.addEventListener("mousewheel", (event) => {
        if (currentProjection != 0)
            return;

        vp_distance += event.wheelDeltaY > 0 ? - SCROLL_FACTOR : SCROLL_FACTOR;
    });

    canvas.addEventListener('mousedown', (event) => {
        if (currentProjection != 0)
            return;

        isDragging = true;
        start = [event.screenX, event.screenY];
    });

    canvas.addEventListener('mousemove', (event) => {
        if (currentProjection != 0)
            return;

        if (isDragging) {            
            current = [event.screenX, event.screenY];
            theta += Math.asin((current[0] - start[0]) / vp_distance / 5) * 2 * 180 / Math.PI;
            gamma += Math.asin((current[1] - start[1]) / vp_distance / 5) * 2 * 180 / Math.PI;

            theta = theta - Math.floor((theta + 180.0) / 360) * 360;
            gamma = gamma - Math.floor((gamma + 180.0) / 360) * 360;
            start = current;
            
            updateRanges();
        }
    });

    canvas.addEventListener('mouseup', (event) => {
        if (currentProjection != 0)
            return;
        isDragging = false;
    });

    document.onkeydown = function (event) {
        if (event.key == "w")
            mode = gl.LINES;
        if (event.key == "s")
            mode = gl.TRIANGLES;
        
        //Projections
        if (event.key == "1") {
            gamma = 45;
            theta = -45;
            currentProjection = 0;
        } else if (event.key == "2") {
            gamma = 0;
            theta = 0;
            currentProjection = 0;
        } else if (event.key == "3") {
            gamma = 90;
            theta = 0;
            currentProjection = 0;
        } else if (event.key == "4") {
            gamma = 0;
            theta = 90;
            currentProjection = 0;
        } else if (event.key == "5") {
            gamma = 0;
            theta = 0;
            currentProjection = 1;
            vp_distance = 80;
        } else if (event.key == "6") {
            gamma = 0;
            theta = 0;
            currentProjection = 2;
            vp_distance = 80;
        }

        //Movements
        if (event.key == "ArrowLeft")
            helicopter.moveForward(HELICOPTER_SPEED);
        if (event.key == "ArrowUp")
            helicopter.moveVertically(HELICOPTER_SPEED);
        if (event.key == "ArrowDown")
            helicopter.moveVertically(-HELICOPTER_SPEED);
        if (event.key == " ") //Space
            helicopter.dropBox();

    }

    document.onkeyup = function (event) {
        //Movements
        if (event.key == "ArrowLeft")
            helicopter.moveForward(0);
        if (event.key == "ArrowUp")
            helicopter.moveVertically(0);
        if (event.key == "ArrowDown")
            helicopter.moveVertically(0);
    }

    gl.clearColor(SKY_COLOR[0],SKY_COLOR[1],SKY_COLOR[2],SKY_COLOR[3]);

    //Init Shapes
    SPHERE.init(gl);
    CYLINDER.init(gl);
    CUBE.init(gl);
    TORUS.init(gl);

    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    window.requestAnimationFrame(render);
}

function resize_canvas(event) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    aspect = canvas.width / canvas.height;

    gl.viewport(0, 0, canvas.width, canvas.height);
}

function render(timestamp) {
    let deltaTime = 0;

    if (time === undefined) {  
        time = timestamp / 1000;
        deltaTime = 0;
    }
    else {       
        deltaTime = timestamp / 1000 - time;
        time = timestamp / 1000;
    }

    window.requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

    mProjection = projections[currentProjection]();
    
    if(currentProjection >= 1)
        view = helicopter.getDirection();
    else view = AP;

    //Load view
    loadMatrix(view);
    multTranslation([0, -vp_distance / 6, 0]);
    multRotationX(gamma);
    multRotationY(theta);
    view = modelView();
    popMatrix();

    //Load World
    loadIdentity();
    pushMatrix();
    helicopter.update(deltaTime);
    helicopter.draw();
    popMatrix();
    city.draw();

}

const urls = ["shader.vert", "shader.frag"]
loadShadersFromURLS(urls).then(shaders => setup(shaders))