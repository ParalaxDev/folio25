import { Effect } from "postprocessing";
import { Uniform } from "three";

const perspectiveFoldFragmentShader = `
uniform float uStrength;
uniform float uEdgeThreshold;
uniform float uFoldAngle;
uniform float uDepth;

// Rotation matrix helper
mat2 rotate2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 distortedUv = uv;

    // Calculate distance from center
    float distFromCenter = abs(uv.y - 0.5) * 2.0;

    // Smooth initial threshold
    float edgeFactor = smoothstep(uEdgeThreshold, 1.0, distFromCenter);

    // EXPONENTIAL ACCELERATION - keeps folding more and more aggressively
    // Using exp2 for exponential growth toward edges
    float exponentialFactor = pow(edgeFactor, 1.5); // Cubic for strong acceleration
    exponentialFactor = exp2(exponentialFactor * 2.0) - 1.0; // Exponential on top of that
    // exponentialFactor = exponentialFactor / (exp2(2.0) - 1.0); // Normalize back to 0-1 range

    // Determine fold direction (top or bottom)
    float direction = sign(uv.y - 0.5);

    // Apply exponential fold angle - gets more extreme at edges
    float angle = -exponentialFactor * uFoldAngle * direction;

    // Center the UV coordinates
    vec2 centered = uv - 0.5;

    // Apply rotation to simulate paper rolling toward viewer
    mat2 rotation = rotate2D(angle);
    vec2 rotated = rotation * centered;

    // Exponential depth scaling - edges come closer and closer
    float depthScale = 1.0 + (exponentialFactor * uDepth);
    rotated *= depthScale;

    // Exponential expansion - edges spread more and more
    float expand = 1.0 + (exponentialFactor * uStrength * 0.3);
    rotated.y *= expand;

    // Convert back to UV space
    distortedUv = rotated + 0.5;

    // Clamp to prevent sampling outside texture
    distortedUv = clamp(distortedUv, 0.0, 1.0);

    // Sample the scene
    vec4 color = texture2D(inputBuffer, distortedUv);

    // Exponential highlight - brighter and brighter at edges
    float highlight = 1.0 + (exponentialFactor * 0.15);
    color.rgb *= highlight;

    outputColor = color;
}
`;

export interface PerspectiveFoldEffectOptions {
  strength?: number; // Overall fold intensity (0-1)
  edgeThreshold?: number; // When to start folding (0-1)
  foldAngle?: number; // Rotation angle in radians (0-π/2)
  depth?: number; // Perspective depth amount (0-1)
}

export class PerspectiveFoldEffect extends Effect {
  constructor({
    strength = 0.2,
    edgeThreshold = 0.6,
    foldAngle = 0.3,
    depth = 0.15,
  }: PerspectiveFoldEffectOptions = {}) {
    super("PerspectiveFoldEffect", perspectiveFoldFragmentShader, {
      uniforms: new Map([
        ["uStrength", new Uniform(strength)],
        ["uEdgeThreshold", new Uniform(edgeThreshold)],
        ["uFoldAngle", new Uniform(foldAngle)],
        ["uDepth", new Uniform(depth)],
      ]),
    });
  }

  set strength(value: number) {
    (this.uniforms.get("uStrength") as Uniform).value = value;
  }

  set edgeThreshold(value: number) {
    (this.uniforms.get("uEdgeThreshold") as Uniform).value = value;
  }

  set foldAngle(value: number) {
    (this.uniforms.get("uFoldAngle") as Uniform).value = value;
  }

  set depth(value: number) {
    (this.uniforms.get("uDepth") as Uniform).value = value;
  }
}
