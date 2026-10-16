# Lucy likeness check — locked

Use the unchanged reference set under `lucy-reference/`; `sha256.txt` preserves its complete original nested paths. The reference set and checksum file are pinned by the stdlib tests. No reference is loaded by gameplay, the manifest, or the offline cache.

Review each NEW delivery (`art/lucy-welcome.png`, `art/lucy-guide.png`, `art/lucy-cheer.png`) side by side with the named default, specs, and bows references from its request. Approve only when all are true:

- This is recognizable as the same Lucy, with the same face, eye shape/spacing, muzzle, ears, golden fur coloration, and proportions.
- The pose, silhouette, paw arrangement, and composition are fresh. The output is not a cropped, traced, recolored, composited, or lightly edited rough reference.
- Teaching glasses and celebration bows match the supplied references. No harness, extra limbs, distorted paws, or accessories obscuring her face.
- Her expression is lively, gentle, and suitable for a 3–4-year-old. She fits the warm Stitch cream/yellow/sky/mint world.
- Full silhouette has safe margins and a clean transparent background; no embedded words or lettering. Review the actual transparent output on both light and dark game backgrounds.

Do not weaken likeness to meet a scene prompt. Regenerate an inaccurate delivery. A passed byte/hash check is necessary but does not constitute visual likeness approval.

Current status: **all three 1024×1024 transparent RGBA PNGs delivered and reviewed alongside default/specs/bows references during the design polish**. Welcome retains Lucy's golden fur, soft ears, large brown eyes and broad dark nose in a fresh gate/watering-can scene. Guide retains blue round glasses and an attentive raised paw; cheer retains the pink dotted bow and a fresh two-paw celebration with a flower pot. No harness or embedded lettering was seen. The poses and full silhouettes are distinct from the references. Files remain byte-identical and are hash-pinned in the tests.

The stage frames use `object-fit: contain`, and speech bubbles occupy a separate row above the art. The image-error paw badge is retained. Final human likeness approval and rendered light/dark tablet review remain manual: Chromium cannot launch in this sandbox, so this pass does not claim an in-browser compositing review.
