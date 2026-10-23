export type InputMode = 'demo' | 'hardware' | 'keyboard' | 'mouse';

export interface IrisInputState {
  pitch: number;
  yaw: number;
  roll: number;
  blink: boolean;
  connected: boolean;
  battery: number;
  mode: InputMode;
  sensitivity: number;
  smoothing: number;
  deadZone: number;
  fps: number;
}

export interface CalibrationState {
  step: number;
  totalSteps: number;
  isCalibrating: boolean;
  isComplete: boolean;
  baselinePitch: number;
  baselineYaw: number;
  baselineRoll: number;
  progress: number;
}

export interface IrisInputActions {
  recenter: () => void;
  toggleDemo: () => void;
  setSensitivity: (value: number) => void;
  setSmoothing: (value: number) => void;
  setDeadZone: (value: number) => void;
  startCalibration: () => void;
  setInputMode: (mode: InputMode) => void;
  triggerBlink: () => void;
}

export interface IrisContextValue extends IrisInputState, IrisInputActions {
  calibration: CalibrationState;
}

export const DEFAULT_INPUT_STATE: IrisInputState = {
  pitch: 0,
  yaw: 0,
  roll: 0,
  blink: false,
  connected: true,
  battery: 98,
  mode: 'mouse',
  sensitivity: 0.8,
  smoothing: 0.5,
  deadZone: 0.05,
  fps: 60,
};

export const DEFAULT_CALIBRATION: CalibrationState = {
  step: 0,
  totalSteps: 6,
  isCalibrating: false,
  isComplete: false,
  baselinePitch: 0,
  baselineYaw: 0,
  baselineRoll: 0,
  progress: 0,
};
