uniform float uScrollProgress;
uniform float uMaskPosition;

varying vec2 vUv;
varying float vMask;

float smootherstep(float edge0, float edge1, float x) {
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

void main() {
    vUv = uv;

    float uMaskDistance = 0.35;
    float uLowerThreshold = 0.4;
    float startThreshold = 0.1;

    float distFromOrigin = (position.y - uMaskPosition) * -1.0;

    float scrollDirection = -sign(uScrollProgress - 0.5);

    float relativeY = distFromOrigin * scrollDirection;

    float movingY = max(0.0, relativeY - startThreshold);

    float gradient = smoothstep(-uMaskDistance, -1.0, relativeY);

    vMask = gradient;

    vMask = vMask * uLowerThreshold;

    float minScale = 1.0;
    float maxScale = 1.5;

    float normalizedMask = clamp(vMask / uLowerThreshold, 0.0, 1.0);
    float curve = pow(normalizedMask, 3.0); // ease-in
    float finalScale = mix(minScale, maxScale, curve);

    vec3 scaledPosition = position * finalScale;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(-scaledPosition, 1.0);
}
