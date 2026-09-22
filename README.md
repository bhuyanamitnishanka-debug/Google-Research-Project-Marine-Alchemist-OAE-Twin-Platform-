# Google Research // Project Marine Alchemist (OAE-Twin Engine)

An interactive, WebGL 3D digital twin platform built to bypass traditional Google Docs structural document tab limit constraints for scaled mCDR evaluation pipelines.

## 🚀 Live Interactive Portal
Access the runtime simulation here: **[Google AI Studio Applet Preview](https://ais-dev-ryozfiwjtyapd7rtcfbbnd-584664573496.asia-southeast1.run.app)**

## 🛠 Structural System Matrix

- `index.html`: Fully self-contained interface compiling Three.js graphics, pipeline mesh geometry layouts, procedural noise shaders, and asynchronous payload routers.
- `.github/workflows/deploy-simulation.yml`: Automated CI/CD integration script powering live deployment hosting frameworks.
- `src/components/TelemetryDrawer.tsx`: Collapsible real-time scientific telemetry suite with full-spectrum geochemistry indicators, interactive controls, and historical logging.
- `src/components/SimulationHistoryLog.tsx`: Narrative and log feed with the Google AI Studio execution matrix, severity filtering, and immediate auditory alarm triggers for critical anomalies.
- `src/components/SeverityFilter.tsx`: Granular event filter supporting toggles for Critical, Warning, Resolved, and Nominal log events.
- `src/utils/audio.ts`: Web Audio API sound engine generating ambient oceanic swells and critical anomaly warning sirens.

## 🤖 Google AI Studio API Integration

This sandbox platform wraps dynamic 3D spatial properties directly into automated contents strings matching structured JSON output models.

### Key Deployment Evaluation Step
To execute runtime cloud inferences while keeping API accounts secure, launch the live portal, hit `F12` to enter your browser's Developer Terminal Console, and overwrite your secure context token line as follows:
```javascript
GOOGLE_AI_STUDIO_API_KEY = "AIzaSy_YOUR_PERSONAL_DEVELOPER_KEY";
```

Alternatively, use the built-in **🤖 Run Live AI Prediction** button directly within the Telemetry Drawer's **Simulation History Log** tab or invoke via the browser console:
```javascript
window.executeLiveAIStudioInference();
window.triggerAISpikeSimulation();
```

## 📦 Deployment Workflow

```bash
git init -b main
git add .
git commit -m "feat: complete deployment integration setup package"
# Create a public repository on GitHub, then link and push:
git remote add origin https://github.com/YOUR_USERNAME/project-marine-alchemist.git
git push -u origin main
```
