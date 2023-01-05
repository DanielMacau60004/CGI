uniform mat4 mView;
uniform mat4 mModel;
uniform mat4 mProjection;

attribute vec4 vPosition;
attribute vec3 vNormal;

varying vec3 fNormal;

void main() {
    gl_Position = mProjection * mView * mModel * vPosition;
    fNormal = vNormal;
}