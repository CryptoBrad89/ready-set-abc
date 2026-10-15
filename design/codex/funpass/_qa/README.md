# Fun-pass evidence

Run from `/tmp/rsabc-funpass`. See [the output README](../README.md) for the idea-by-idea changes, safety implementation, commands, results, and test limits.

`capture`, `record`, `verify`, `contrast`, `edge`, and `sheets` adapt the supplied scripts in `ref/_qa/` to these two local games. `fun-check.mjs` adds effect/audio/cleanup/rapid-input checks. `moments.mjs` captures new moments and full collections. `finalize.py` consolidates reports, verifies all 48 required PNG dimensions, checks every output file against 5,000,000 bytes, probes the videos, and inspects actual MP4 faststart box order.

Stills named with the required viewport sizes are exact viewport images; supplementary hint, collection, and moment captures may be full-page. Video contact sheets sample 1, 3, 6, 8, 10, 12, and 14.5 seconds.

All browser launches use file URLs and `out/_qa/tmp` for temporary browser profiles. Every script closes its browser; video WebM intermediates are removed after conversion. No server is needed.
