#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_offset;

#include "../../../node_modules/lygia/generative/snoise.glsl"

void main(void) {
    vec4 color = vec4(vec3(0.0), 1.0);
    vec2 pixel = 1.0 / u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;

    vec4 white = vec4(1.0);

    color += (snoise(vec3((st * 5.) + (u_offset * 100.), u_time * .1)) * 0.5 + 0.5) * 0.75;

    if (u_offset > 1.0) color *= 2.0;
    else if (u_offset == 1.0) color *= 1.5;

    gl_FragColor = color;
}
