uniform sampler2D uTexture;
uniform vec2 uContainerSize;
uniform vec2 uImageSize;
uniform bool uUseContain;
uniform vec4 uClipBounds; // left, top, right, bottom in screen space
uniform vec4 uElementBounds; // left, top, right, bottom in screen space
uniform float uUseClipping;
uniform vec2 uViewportSize;
varying vec2 vUv;
varying float vMask;
varying vec3 vWorldPosition;

vec2 cover(vec2 uv, vec2 containerSize, vec2 imageSize) {
    float containerRatio = containerSize.x / containerSize.y;
    float imageRatio = imageSize.x / imageSize.y;
    vec2 scale;
    vec2 offset;
    if (imageRatio > containerRatio) {
        scale = vec2(containerSize.y / imageSize.y);
        offset = vec2((containerSize.x - imageSize.x * scale.x) * 0.5, 0.0);
    } else {
        scale = vec2(containerSize.x / imageSize.x);
        offset = vec2(0.0, (containerSize.y - imageSize.y * scale.y) * 0.5);
    }
    vec2 adjustedUV = (uv * containerSize - offset) / (imageSize * scale);
    return adjustedUV;
}

vec2 contain(vec2 uv, vec2 containerSize, vec2 imageSize) {
    float containerRatio = containerSize.x / containerSize.y;
    float imageRatio = imageSize.x / imageSize.y;
    vec2 scale;
    vec2 offset;
    if (imageRatio > containerRatio) {
        scale = vec2(containerSize.x / imageSize.x);
        offset = vec2(0.0, (containerSize.y - imageSize.y * scale.y) * 0.5);
    } else {
        scale = vec2(containerSize.y / imageSize.y);
        offset = vec2((containerSize.x - imageSize.x * scale.x) * 0.5, 0.0);
    }
    vec2 adjustedUV = (uv * containerSize - offset) / (imageSize * scale);
    return adjustedUV;
}

void main() {
    // Calculate screen position from UV
    vec2 screenPos = vec2(
            uElementBounds.x + vUv.x * (uElementBounds.z - uElementBounds.x),
            uElementBounds.y + vUv.y * (uElementBounds.w - uElementBounds.y)
        );

    // Perform clipping if enabled
    if (uUseClipping > 0.5) {
        // Discard fragments outside the clip bounds
        if (screenPos.x < uClipBounds.x || screenPos.x > uClipBounds.z ||
                screenPos.y < uClipBounds.y || screenPos.y > uClipBounds.w) {
            discard;
        }
    }

    if (uUseContain) {
        vec2 adjustedUV = contain(vUv, uContainerSize, uImageSize);
        if (adjustedUV.x < 0.0 || adjustedUV.x > 1.0 || adjustedUV.y < 0.0 || adjustedUV.y > 1.0) {
            discard;
        }
        vec4 color = texture2D(uTexture, 1.0 - adjustedUV);
        gl_FragColor = vec4(color.rgb, color.a);
        return;
    }

    vec2 adjustedUV = cover(vUv, uContainerSize, uImageSize);

    vec4 color = texture2D(uTexture, 1.0 - adjustedUV);
    gl_FragColor = vec4(vec3(color), 1.0);
}
