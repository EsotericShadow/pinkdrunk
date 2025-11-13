import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PredictionPayload } from "@/components/today/dashboard";
import { CalibrationPanel } from "@/components/today/calibration-panel";

describe("CalibrationPanel", () => {
  it("shows target level confidence", () => {
    const thresholds: PredictionPayload["thresholds"] = [
      { level: 4, grams: 40, confidence: 0.3 },
      { level: 5, grams: 55, confidence: 0.5 },
      { level: 6, grams: 70, confidence: 0.2 },
    ];

    render(<CalibrationPanel thresholds={thresholds} targetLevel={5} reportedLevel={5} />);

    expect(screen.getAllByText(/Level 5/i)[0]).toBeTruthy();
    expect(screen.getByText(/Confidence 50%/i)).toBeTruthy();
    expect(screen.getByText(/Last reported level 5.0/i)).toBeTruthy();
  });
});
