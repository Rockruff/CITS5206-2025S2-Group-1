interface TrainingBase {
  id: string;
  name: string;
  expiry: number; // completion auto-expires after this many days
}

export interface LMSTraining extends TrainingBase {
  type: "LMS";
  completion_score: number;
}

export interface F2FTraining extends TrainingBase {
  type: "F2F";
}

export interface ExternalTraining extends TrainingBase {
  type: "External";
  proof_fields: []; // capability will be added later
}

export type Training = LMSTraining | ExternalTraining | F2FTraining;
