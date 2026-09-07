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
            const paint = new Color(shoulder ? '#17324d' : '#d6d1bf');
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
            };
            material.customProgramCacheKey = () => 'world-eater-paint-v1';
            cache.set(key, material); return material;
        };
        object.material = Array.isArray(object.material) ? object.material.map(convert) : convert(object.material);
    });
}
