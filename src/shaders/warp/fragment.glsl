uniform sampler2D uTexture;
uniform float uScrollVel;
uniform float uStrength;
uniform float uEdgeThreshold;
uniform float uFoldAngle;
uniform float uDepth;

varying vec2 vUv;

// Rotation matrix helper
mat2 rotate2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 distortedUv = vUv;
    
    // VERTICAL version - calculate distance from horizontal center (top/bottom)
    float distFromCenter = abs(vUv.y - 0.5) * 2.0;
    
    // Smooth initial threshold
    float edgeFactor = smoothstep(uEdgeThreshold, 1.0, distFromCenter);
    
    // EXPONENTIAL ACCELERATION - scroll velocity modulates the effect
    float exponentialFactor = pow(edgeFactor, 3.0);
    exponentialFactor = exp2(exponentialFactor * 2.0) - 1.0;
    exponentialFactor = exponentialFactor / (exp2(2.0) - 1.0);
    
    // Modulate by scroll velocity for dynamic effect
    float scrollModulation = abs(uScrollVel) * 2.0;
    scrollModulation = clamp(scrollModulation, 0.0, 1.0);
    exponentialFactor *= scrollModulation;
    
    // Determine fold direction (top or bottom) - VERTICAL
    float direction = sign(vUv.y - 0.5);
    
    // Apply exponential fold angle
    float angle = -exponentialFactor * uFoldAngle * direction;
    
    // Center the UV coordinates
    vec2 centered = vUv - 0.5;
    
    // Apply rotation
    mat2 rotation = rotate2D(angle);
    vec2 rotated = rotation * centered;
    
    // Exponential depth scaling
    float depthScale = 1.0 + (exponentialFactor * uDepth);
    rotated *= depthScale;
    
    // Exponential expansion - VERTICAL (apply to Y instead of X)
    float expand = 1.0 + (exponentialFactor * uStrength * 0.3);
    rotated.y *= expand;
    
    // Convert back to UV space
    distortedUv = rotated + 0.5;
    
    // Clamp to prevent sampling outside texture
    distortedUv = clamp(distortedUv, 0.0, 1.0);
    
    // Sample the texture
    vec4 color = texture2D(uTexture, distortedUv);
    
    // Exponential highlight
    float highlight = 1.0 + (exponentialFactor * 0.15);
    color.rgb *= highlight;
    
    gl_FragColor = color;
}
