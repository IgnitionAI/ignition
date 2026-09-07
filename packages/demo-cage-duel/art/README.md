# The Crucible — Blender assets

Created in Blender 5.2.1 through Blender MCP, then rebuilt successfully in a fresh Blender process using the same scripts. Original authored geometry; Space Marine fan-art base, no extracted or purchased assets.

## Deliverables

- `crucible-assets.blend`: two editable scenes, `01 · THE CAGE` and `02 · MARINE BASE`. Cage scene includes ship architecture and lights; marine scene includes a studio stage. Only asset scenes are saved, not the user's initial scene.
- `renders/cage-0001.png`: actual Cycles render, 1600 × 1100, 32 samples with denoising.
- `renders/marine-0001.png`: actual Cycles render, 1400 × 1600, 32 samples with denoising.
- `../public/models/cage-blender.glb`: isolated cage, 53,556 triangles, one mesh object, 3,610,068 bytes.
- `../public/models/marine-base-blender.glb`: isolated marine, 54,544 triangles, 19 mesh objects under 20 rigid pivots, 2,645,660 bytes.
- `http://127.0.0.1:3033/atelier.html`: orbit/zoom viewer for the actual exported GLBs. Run `pnpm --filter demo-cage-duel dev` from repository root.

## Model structure

Cage: eight-sided foundation and steel deck, physical lattice, open south entrance, threshold hazard stripes, integrated lamps and upper frame. Ship presentation architecture stays in Blender and is excluded from the cage GLB.

Marine: shaped breastplate, gorget, helmet/visor/respirator, shoulder heraldry, skull/wing relief, faulds, tabard, leg armour, gloves, reactor backpack and chain axe. Facing -Y in Blender, +Z after glTF's Y-up conversion. Approximate model height 3.5 Blender units. Root remains at the origin.

Named rigid pivots include MarineRoot, Hips, Torso, Head, Thigh.L/R, Shin.L/R, Foot.L/R, Shoulder.L/R, UpperArm.L/R, Forearm.L/R, Hand.L/R, PowerPack and Weapon · ChainAxe. Exported names can acquire numeric suffixes because Blender source objects remain present during export. Mesh surfaces are merged per parent pivot and preserve material slots.

The source includes editable bevels and procedural microtexture. Exports bake geometry modifiers and use constant PBR colours/metalness/roughness/emission; procedural bumps are not baked to image textures. Materials therefore do not exactly match the Cycles renders. Neither asset is a final AAA production claim. There is no skinning, retopology/UV bake pass, completed combat animation, LOD set, or integration into the playable duel yet.

## Reproduce

From repository root, in a fresh process:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P packages/demo-cage-duel/art/blender/build.py
```

The runner refuses to reuse existing named asset scenes, builds cage then marine, exports only each temporary active scene and writes the asset project. Rebuilding replaces these generated deliverables; manually edited projects should be saved under another filename first.

Renders can be reproduced with:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b packages/demo-cage-duel/art/crucible-assets.blend -S '02 · MARINE BASE' -o /tmp/marine- -F PNG -f 1
/Applications/Blender.app/Contents/MacOS/Blender -b packages/demo-cage-duel/art/crucible-assets.blend -S '01 · THE CAGE' -o /tmp/cage- -F PNG -f 1
```

## Validation

- Fresh-process build and GLB exports completed successfully.
- Tests verify a single isolated scene per GLB, no cameras/skins/animations, valid mesh/material references, and world-space articulation pivots after Y-up conversion.
- Both GLBs loaded and visually inspected in the browser viewer. One Three.js duplicate-instance warning occurred during development; a clean reload produced no new warning or error. Cage/Marine selection and camera recenter checked.
- Package typecheck and two-page production build pass; Three.js shared chunk still produces a >500 kB Vite warning.
- Full Vitest: 53 files passed, 3 skipped; 356 tests passed, 3 skipped. An earlier run concurrent with two Cycles renders had one existing PPO convergence assertion failure and one existing car-race timeout; the subsequent full run passed without code/test changes to those packages. This is not proof those tests are deterministic.

## Standards review

No outstanding documented-standard or significant smell findings after correcting mesh normals. Export-only copies preserve editable source geometry.

## Spec review

Corrected gate obstruction, intersecting pauldron shells, mirrored plate normals. Source, renders and GLB deliverables match the asset-base scope. Visual refinement and final animation remain future work.
