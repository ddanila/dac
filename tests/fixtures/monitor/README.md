# Optical backend replay fixture

`optical-backend-v3.mcrt` is a synthetic constant-electrical-input test of the
native optical backend. It is **not** a Robotron firmware capture, a complete
K7222 circuit result or a measured monitor. The 300 s start timestamp tests the
absolute-time parser, not warm-up. The first frame is an empty phosphor surface.

Regenerate in the sibling `dac-emulation` checkout using the adjacent CSV:

```python
import sys
sys.path.insert(0, 'verification/robotron-monitor')
import beam_render
beam_render.run('../dac/tests/fixtures/monitor/optical-backend-v3.csv',
                'build/monitor/optical-fixture-new', frame_count=3,
                surface=dict(width=64, height=48))
```

Copy the resulting `replay.mcrt` here. The replay archives hashes of the CSV,
renderer, trajectory and phosphor sources, all rendering parameters, and the
explicit `experimental-optical-bench` qualification.
