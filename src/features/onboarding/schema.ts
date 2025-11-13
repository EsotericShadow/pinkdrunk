import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(2, "Tell us what to call you"),
  geoLocation: z.string().max(120).default(""),
  profileImageUrl: z
    .union([z.string().url("Enter a valid URL"), z.literal("")])
    .optional()
    .default(""),
  heightUnit: z.enum(["cm", "imperial"]),
  heightCm: z.coerce.number().gt(100).lt(230).optional(),
  heightFeet: z.coerce.number().min(3).max(7).optional(),
  heightInches: z.coerce.number().min(0).max(11).optional(),
  weightUnit: z.enum(["kg", "lbs"]),
  weightValue: z.coerce.number().gt(35).lt(250),
  age: z.coerce.number().min(18).max(99),
  genderIdentity: z.enum(["female", "male", "nonbinary", "custom"]),
  customGender: z.string().max(40).optional().default(""),
  menstruation: z.enum(["yes", "no"]),
  cycleDay: z.number().int().min(1).max(40).optional().nullable(),
  medications: z.enum(["yes", "no"]),
  medicationDetails: z.string().max(240).optional().default(""),
  conditions: z.enum(["yes", "no"]),
  conditionDetails: z.string().max(240).optional().default(""),
  metabolismScore: z.coerce.number().min(1).max(10),
  toleranceScore: z.coerce.number().min(1).max(10),
  targetLevel: z.coerce.number().min(0).max(10),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export type OnboardingFieldKey = keyof OnboardingFormValues | "height" | "weight";

export type OnboardingStep = {
  title: string;
  description: string;
  fields: OnboardingFieldKey[];
};

export const onboardingSteps: OnboardingStep[] = [
  {
    title: "Profile basics",
    description: "Name and location help personalize legal context.",
    fields: ["name", "geoLocation"],
  },
  {
    title: "Body stats",
    description: "We use physiology to set your baseline.",
    fields: ["height", "weight", "age", "genderIdentity", "menstruation", "cycleDay"],
  },
  {
    title: "Health context",
    description: "Medications and conditions change metabolization.",
    fields: ["medications", "medicationDetails", "conditions", "conditionDetails"],
  },
  {
    title: "Personal calibration",
    description: "Tell us your perceived metabolism, tolerance, and target.",
    fields: ["metabolismScore", "toleranceScore", "targetLevel"],
  },
];
