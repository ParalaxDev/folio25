precision mediump float;

uniform float u_opacity;

void main() {
    gl_FragColor = vec4(vec3(1.0), u_opacity);
}
