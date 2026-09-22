/**
 * Automated Payload Wrapper Engine for Google AI Studio
 * Gathers real-time spatial and biogeochemical telemetry frames and structures
 * them into Google AI Studio contents / generationConfig API request payloads.
 */

export interface ActiveTelemetryFrame {
  timestamp: string;
  physicalEnclosure: {
    pondVolumeCubicMeters: number;
    currentWaterDisplacementY: string;
    currentMaterialRoughness: string;
  };
  sensorArrayNode: {
    phValue: string;
    pco2Value: string;
    intakeRateLs: string;
  };
  cameraMatrix: {
    vectorX: string;
    vectorY: string;
    vectorZ: string;
  };
}

export interface GoogleAIStudioPayload {
  contents: {
    role: string;
    parts: {
      text: string;
    }[];
  }[];
  generationConfig: {
    temperature: number;
    topP: number;
    maxOutputTokens: number;
    responseMimeType: string;
  };
}

export function generateAIStudioPayloadWrapper(
  customParams?: Partial<{
    ph: number;
    pco2: number;
    intake: number;
    cameraX: number;
    cameraY: number;
    cameraZ: number;
  }>
): GoogleAIStudioPayload {
  // 1. Gather instant spatial metrics
  const activeTelemetryFrame: ActiveTelemetryFrame = {
    timestamp: new Date().toISOString(),
    physicalEnclosure: {
      pondVolumeCubicMeters: 1350,
      currentWaterDisplacementY: (-0.12).toFixed(4),
      currentMaterialRoughness: (0.15).toFixed(4),
    },
    sensorArrayNode: {
      phValue: customParams?.ph !== undefined ? customParams.ph.toFixed(2) : "8.45",
      pco2Value: customParams?.pco2 !== undefined ? `${customParams.pco2} ppm` : "-18.4%",
      intakeRateLs: customParams?.intake !== undefined ? customParams.intake.toFixed(1) : "250.0",
    },
    cameraMatrix: {
      vectorX: (customParams?.cameraX ?? 32.5).toFixed(2),
      vectorY: (customParams?.cameraY ?? 28.0).toFixed(2),
      vectorZ: (customParams?.cameraZ ?? 45.0).toFixed(2),
    },
  };

  // 2. Wrap into Google AI Studio Contents/GenerationConfig Structured API Format
  const googleAIStudioPayload: GoogleAIStudioPayload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analyze this real-time Ocean Alkalinity Enhancement (OAE) digital twin telemetry frame and return a predictive system stability assessment matching the narrative structure schema:\n\n${JSON.stringify(
              activeTelemetryFrame,
              null,
              2
            )}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.95,
      maxOutputTokens: 800,
      responseMimeType: "application/json",
    },
  };

  return googleAIStudioPayload;
}
