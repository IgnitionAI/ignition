import { Color, Mesh, MeshStandardMaterial, type Object3D } from 'three';
/** Replace painted red with worn ivory/navy while retaining metallic trim and surface maps. */
export function paintWorldEater(character: Object3D): void {
    const cache = new Map<string, MeshStandardMaterial>();
    character.traverse(object => {
        if (!(object instanceof Mesh)) return;
        const shoulder = object.name.startsWith('Pouldron');
        const convert = (source: MeshStandardMaterial): MeshStandardMaterial => {
            const key = source.uuid + (shoulder ? ':navy' : ':ivory');
            const existing = cache.get(key); if (existing) return existing;
            const material = source.clone();
            const helmet = source.name.includes('Helmet_Red');
            const paint = new Color(shoulder ? '#17324d' : '#d6d1bf');
            if (shoulder) {
                // Heraldry is baked into several source maps; replace all of them on the pauldrons.
                material.map = null; material.normalMap = null; material.roughnessMap = null;
                material.metalnessMap = null; material.aoMap = null; material.emissiveMap = null;
                material.emissive.set(0); material.color.copy(paint); material.metalness = .5; material.roughness = .63;
                material.onBeforeCompile = shader => {
                    shader.vertexShader = 'varying vec3 armourSurface;\n' + shader.vertexShader;
                    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\narmourSurface = position;');
                    shader.fragmentShader = `varying vec3 armourSurface;
                        float armourHash(vec3 p) { return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
                        float armourNoise(vec3 p) {
                            vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
                            return mix(mix(mix(armourHash(i),armourHash(i+vec3(1,0,0)),f.x),
                                mix(armourHash(i+vec3(0,1,0)),armourHash(i+vec3(1,1,0)),f.x),f.y),
                                mix(mix(armourHash(i+vec3(0,0,1)),armourHash(i+vec3(1,0,1)),f.x),
                                mix(armourHash(i+vec3(0,1,1)),armourHash(i+vec3(1,1,1)),f.x),f.y),f.z);
                        }
                    ` + shader.fragmentShader;
                    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
                        #include <color_fragment>
                        diffuseColor.rgb *= 0.82 + 0.18*armourNoise(armourSurface*3.0);
                    `);
                };
                material.customProgramCacheKey = () => 'world-eater-plain-pauldrons-v1';
                cache.set(key, material); return material;
            }

            material.onBeforeCompile = shader => {
                shader.uniforms.factionPaint = { value: paint };
                shader.fragmentShader = 'uniform vec3 factionPaint;\n' + shader.fragmentShader;
                shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
                    #include <map_fragment>
                    float otherChannel = max(diffuseColor.g, diffuseColor.b);
                    float redPaint = smoothstep(0.018, 0.07, diffuseColor.r - otherChannel)
                        * smoothstep(1.25, 1.8, diffuseColor.r / (otherChannel + 0.005));
                    float wear = 0.18 + 0.82 * sqrt(clamp(diffuseColor.r, 0.0, 1.0));
                    diffuseColor.rgb = mix(diffuseColor.rgb, factionPaint * wear, redPaint);
                `);
                if (helmet) shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
                    #include <emissivemap_fragment>
                    // The original lens mask is green: transfer its intensity, not its hue.
                    float lensGlow = max(totalEmissiveRadiance.r, max(totalEmissiveRadiance.g, totalEmissiveRadiance.b));
                    totalEmissiveRadiance = vec3(3.0, 0.008, 0.003) * lensGlow;
                    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.002, 0.001), smoothstep(0.005, 0.035, lensGlow));
                `);
            };
            material.customProgramCacheKey = () => helmet ? 'world-eater-red-lenses-v1' : 'world-eater-paint-v1';
            cache.set(key, material); return material;
        };
        object.material = Array.isArray(object.material) ? object.material.map(convert) : convert(object.material);
    });
}
