precision highp float;

varying vec3 fNormal;
uniform vec4 fColor;

const vec3 lightDir = vec3(0.55,1,0.35);

void main() {
    vec3 normal = normalize(fNormal);
    float light = dot(normal, lightDir);

    gl_FragColor = vec4( mix(fColor.rgb, fColor.rgb*light, 0.5),1.0);
}