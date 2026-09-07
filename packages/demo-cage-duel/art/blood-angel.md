# Purchased Blood Angel: import and visual inspection

Vendor: Jeffry Quiambao. Product: https://www.artstation.com/marketplace/p/Yybmj/space-marine-blood-angel . User supplied the purchased archives on 2026-09-07. ArtStation library showed Extended Commercial License. This record does not claim ownership of the character/IP or permission to redistribute source archives.

## Files and findings

Original archives remain in `~/Downloads/Blood-Angel.rar` and `~/Downloads/textures.rar`. Extracted assets and generated Blender projects live outside Git in `~/.local/share/ignition-assets/blood-angel/`:

- `source/`: FBX, MAX and OBJ supplied in the archive.
- `textures/`: 4K base colour, normal, packed ORM and emission textures, including UDIM tiles.
- `blood-angel-prepared.blend`: imported FBX, rebuilt Blender PBR materials, studio camera and lights.
- `blood-angel-closeup.blend`: closeup camera and corrected dark studio floor.
- `blood-angel-preview.png0001.png`, `blood-angel-closeup-0001.png`: actual Cycles renders, 1200×1400, 32 samples, denoising.
- `blood-angel-inspection.glb`: static inspection export, 71 mesh objects, 497,645 triangles, 13 materials and 40 source texture images. Runtime textures limited to 2K and JPEG quality90. ORM roughness and metalness are connected; AO is not yet applied, so this is an inspection adaptation rather than an exact match to V-Ray. Export may deduplicate images/materials.

The supplied FBX has 261,422 vertices and **no armature**. Objects are separate armour/finger/weapon parts in a standing pose, all object origins at the scene origin. The OBJ was also inspected: the same general geometry and UV layout, no supplied MTL file. The MAX file was preserved but not opened. No claim is made about a rig that might exist only inside that MAX file.

The FBX's V-Ray/3ds Max material links contain missing external Windows paths. Importing geometry succeeds, but materials must be rebuilt against the supplied texture archive. Blender node lookup uses node type because this installation localizes node names.

## Reproduce preparation

Extract both archives using `bsdtar` into `source/` and `textures/` under the private root above. Then, from repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P packages/demo-cage-duel/art/blender/prepare_blood_angel.py
/Applications/Blender.app/Contents/MacOS/Blender -b ~/.local/share/ignition-assets/blood-angel/blood-angel-prepared.blend -P packages/demo-cage-duel/art/blender/export_blood_angel.py
```

The preparation script refuses to rebuild an already-prepared active scene. Its generated project path is overwritten on a fresh-process rebuild, so save manual edits under another name. Import warnings are captured in a private log. The exporter copies meshes and materials into a separate export scene, converts UDIM tiles into ordinary per-tile materials and shifts UVs on the copies. Vendor source geometry and 4K texture files are preserved.

## Local browser inspection

The Vite development server serves the fixed private GLB path directly, without putting it in `public/`. Run the demo, then open:

http://127.0.0.1:3033/atelier.html?model=blood-angel

The purchased option is only exposed in this explicit inspection mode. Standard demo builds without the privately purchased file retain their original assets. The private route only exists in development and does not copy the GLB into production builds. Do not commit the GLB or vendor archives.

This browser export is **static visual acceptance**, not a playable replacement yet. The separate Blender rig described below is not exported into this GLB. Concealed joints, combat animation, weapon grip, collision alignment and runtime optimization remain work for the combat integration. The existing cage duel is preserved.

## First editable skeleton (2026-09-07)

`blender/rig_blood_angel.py` copies the prepared scene into `Blood Angel Rigged` and saves the private `blood-angel-rigged.blend`. It creates 55 FK bones, including 30 finger bones and separate shoulder/hip plate controls. All 71 purchased mesh objects receive an armature modifier and rigid weights (one bone per part). The studio floor is excluded. This preserves rigid armour; it does not add a deformable undersuit or IK controls.

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b ~/.local/share/ignition-assets/blood-angel/blood-angel-prepared.blend --python-exit-code 1 -P packages/demo-cage-duel/art/blender/rig_blood_angel.py
/Applications/Blender.app/Contents/MacOS/Blender -b ~/.local/share/ignition-assets/blood-angel/blood-angel-rigged.blend --python-exit-code 1 -P packages/demo-cage-duel/art/blender/validate_blood_angel_rig.py
```

Rebuilding overwrites the generated rig project; save hand edits under another name first. The supplied FBX and prepared scene are preserved. Open the generated project, select `Blood Angel Rig`, enter Pose Mode and rotate bones. The Action Editor contains `Guard Test`, `Strike Test` and `Step Test`: 48-frame diagnostic pose transitions, not finished combat clips. The file opens at rest with no active action; select the action and its rig slot to preview it.

Validation samples rest-pose vertices across all 71 parts (maximum displacement below 0.000001 scene units), verifies bindings and checks that hands/feet move in the saved actions. Cycles renders `rig-guard.png` and `rig-strike.png` confirm visible articulation. They also reveal unfinished shoulder coverage and hand poses: these are joint tests, not approved combat choreography. `rig-report.json` records the binding map; `rig-validation.json` records action displacement checks.

Mixamo is a candidate source for motion. The third-party https://github.com/V1xel/mixamo-mcp advertises character upload, auto-rigger review, animation search, parameter changes and FBX downloads through a persistent authenticated browser. It has not been installed or tested here. Motions still need retargeting and armour-clearance adjustments; the current rig is not claimed to be automatically Mixamo-compatible.

Saved-action validation passed: right-hand displacement 0.45818 (guard), 0.63600 (strike), left-foot displacement 0.04187 (step), in scene units. Both Cycles poses rendered. Package typecheck passed; full Vitest rerun: 54 files / 359 tests passed, 3 files / 3 tests skipped. Standards review found no actionable issue; spec review's pending saved-action check was resolved by the successful validation report.

## Validation and review

- Both archive extractions completed. Blender import and separate OBJ inspection confirmed the FBX geometry and lack of armature; the MAX remains uninspected.
- Full-body and close-up Cycles renders inspected. Browser GLB loaded with visible PBR textures; model switching restores the correct title/attribution. No console warning/error in the checked session.
- Final GLB verified: one scene, 71 meshes, 13 materials, 33,457,768 bytes; no studio objects, skins or animations. Production build verified to exclude the purchased GLB.
- Package typecheck and build passed (existing shared Three.js chunk-size warning). Full Vitest: 54 files passed, 3 skipped; 359 tests passed, 3 skipped.
- Standards review: 0 outstanding findings after isolating the private dev route and updating metadata on model changes.
- Spec review: 0 outstanding findings after restricting export to the active scene. Static inspection is complete; combat integration is not claimed.

Fresh-process preparation and export were also rerun successfully. The saved scene library may open on an empty scene; select `03 · BLOOD ANGEL — PURCHASED` in Blender. The exporter selects this scene explicitly.
