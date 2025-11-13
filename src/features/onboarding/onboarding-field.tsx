"use client";

import { useEffect } from "react";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { onboardingSchema, type OnboardingFieldKey, type OnboardingFormValues } from "./schema";

type FieldProps = {
  fieldKey: OnboardingFieldKey;
  register: UseFormRegister<OnboardingFormValues>;
  errors: FieldErrors<OnboardingFormValues>;
  watch: UseFormWatch<OnboardingFormValues>;
  setValue: UseFormSetValue<OnboardingFormValues>;
};

export function OnboardingField({ fieldKey, register, errors, watch, setValue }: FieldProps) {
  switch (fieldKey) {
    case "height":
      return (
        <HeightSelector
          unit={watch("heightUnit")}
          heightCm={watch("heightCm")}
          heightFeet={watch("heightFeet")}
          heightInches={watch("heightInches")}
          setValue={setValue}
          register={register}
          errors={errors}
        />
      );
    case "weight":
      return (
        <WeightSelector
          unit={watch("weightUnit")}
          weightValue={watch("weightValue")}
          setValue={setValue}
          register={register}
          errors={errors}
        />
      );
    case "genderIdentity":
      return (
        <GenderSelector
          value={watch("genderIdentity")}
          setValue={(value) => setValue("genderIdentity", value)}
          register={register}
        />
      );
    case "profileImageUrl":
      return <BasicField field={fieldKey} register={register} errors={errors} />;
    case "menstruation":
    case "medications":
    case "conditions":
      return (
        <BinaryQuestion
          field={fieldKey}
          value={watch(fieldKey)}
          setValue={(value) => setValue(fieldKey, value)}
          register={register}
        />
      );
    case "cycleDay":
      return (
        <CycleDayField
          value={watch("cycleDay")}
          menstruation={watch("menstruation")}
          setValue={(value) => setValue("cycleDay", value)}
        />
      );
    case "metabolismScore":
    case "toleranceScore":
    case "targetLevel":
      return (
        <ScoreSlider
          field={fieldKey}
          value={watch(fieldKey)}
          setValue={(value) => setValue(fieldKey, value, { shouldDirty: true, shouldTouch: true })}
        />
      );
    case "name":
    case "geoLocation":
    case "age":
      return (
        <BasicField field={fieldKey} register={register} errors={errors} />
      );
    case "medicationDetails":
    case "conditionDetails": {
      const related = fieldKey === "medicationDetails" ? "medications" : "conditions";
      if (watch(related) === "yes") {
        return (
          <textarea
            key={fieldKey}
            className="w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40"
            rows={3}
            placeholder="List meds or conditions so we can tune predictions"
            {...register(fieldKey)}
          />
        );
      }
      return null;
    }
    default:
      return null;
  }
}

function HeightSelector({
  unit,
  heightCm,
  heightFeet,
  heightInches,
  setValue,
  register,
  errors,
}: {
  unit: OnboardingFormValues["heightUnit"];
  heightCm?: number;
  heightFeet?: number;
  heightInches?: number;
  setValue: UseFormSetValue<OnboardingFormValues>;
  register: UseFormRegister<OnboardingFormValues>;
  errors: FieldErrors<OnboardingFormValues>;
}) {
  const handleUnitChange = (nextUnit: OnboardingFormValues["heightUnit"]) => {
    if (nextUnit === unit) return;

    if (nextUnit === "cm") {
      const cmValue = Number.isFinite(heightCm)
        ? Number(heightCm)
        : cmFromImperial(heightFeet, heightInches);
      setValue("heightCm", parseFloat(cmValue.toFixed(2)), { shouldDirty: true });
    } else {
      const cmValue = Number.isFinite(heightCm)
        ? Number(heightCm)
        : cmFromImperial(heightFeet, heightInches);
      const { feet, inches } = imperialFromCm(cmValue);
      setValue("heightFeet", feet, { shouldDirty: true });
      setValue("heightInches", inches, { shouldDirty: true });
    }

    setValue("heightUnit", nextUnit);
  };

  useEffect(() => {
    if (unit === "imperial") {
      const cmValue = cmFromImperial(heightFeet, heightInches);
      const rounded = parseFloat(cmValue.toFixed(2));
      if (!Number.isFinite(rounded)) return;
      if (Math.abs((heightCm ?? 0) - rounded) > 0.05) {
        setValue("heightCm", rounded, { shouldDirty: true });
      }
    }
  }, [unit, heightFeet, heightInches, heightCm, setValue]);

  useEffect(() => {
    if (unit === "cm") {
      const { feet, inches } = imperialFromCm(heightCm);
      if (heightFeet !== feet) {
        setValue("heightFeet", feet);
      }
      if (heightInches !== inches) {
        setValue("heightInches", inches);
      }
    }
  }, [unit, heightCm, heightFeet, heightInches, setValue]);

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-white">Height</legend>
      <ToggleGroup
        options={[
          { value: "cm", label: "Centimeters (cm)" },
          { value: "imperial", label: "Feet / inches" },
        ]}
        value={unit}
        onChange={(value) => handleUnitChange(value as OnboardingFormValues["heightUnit"])}
      />
      <p className="text-xs text-white/60">
        {unit === "cm"
          ? `= ${formatFeet(heightCm)} · ${formatInches(heightCm)}"`
          : `${(heightFeet ?? 0)}'${heightInches ?? 0}" ≈ ${formatCm(heightCm)} cm`}
      </p>
      {unit === "cm" ? (
        <div className="space-y-2">
          <Input type="number" step="0.01" {...register("heightCm", { valueAsNumber: true })} />
          {errors.heightCm && <p className="text-sm text-red-300">Valid range 100–230 cm.</p>}
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="flex-1 space-y-2">
            <Input type="number" {...register("heightFeet", { valueAsNumber: true })} />
            <p className="text-xs text-white/60">Feet</p>
          </div>
          <div className="flex-1 space-y-2">
            <Input type="number" {...register("heightInches", { valueAsNumber: true })} />
            <p className="text-xs text-white/60">Inches</p>
          </div>
        </div>
      )}
    </fieldset>
  );
}

function WeightSelector({
  unit,
  weightValue,
  setValue,
  register,
  errors,
}: {
  unit: OnboardingFormValues["weightUnit"];
  weightValue?: number;
  setValue: UseFormSetValue<OnboardingFormValues>;
  register: UseFormRegister<OnboardingFormValues>;
  errors: FieldErrors<OnboardingFormValues>;
}) {
  const handleUnitChange = (nextUnit: OnboardingFormValues["weightUnit"]) => {
    if (nextUnit === unit) return;

    if (nextUnit === "kg") {
      const kgValue = unit === "lbs"
        ? lbsToKg(weightValue)
        : weightValue ?? 0;
      setValue("weightValue", parseFloat(kgValue.toFixed(1)));
    } else {
      const lbsValue = unit === "kg"
        ? kgToLbs(weightValue)
        : weightValue ?? 0;
      setValue("weightValue", parseFloat(lbsValue.toFixed(1)));
    }

    setValue("weightUnit", nextUnit);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-white">Weight</legend>
      <ToggleGroup
        options={[
          { value: "kg", label: "Kilograms (kg)" },
          { value: "lbs", label: "Pounds (lbs)" },
        ]}
        value={unit}
        onChange={(value) => handleUnitChange(value as OnboardingFormValues["weightUnit"])}
      />
      <p className="text-xs text-white/60">
        {unit === "kg"
          ? `${weightValue ?? 0} kg ≈ ${formatLbs(weightValue)} lbs`
          : `${weightValue ?? 0} lbs ≈ ${formatKg(weightValue)} kg`}
      </p>
      <div className="space-y-2">
        <Input
          type="number"
          step={unit === "kg" ? "0.01" : "0.1"}
          {...register("weightValue", { valueAsNumber: true })}
        />
        {errors.weightValue && (
          <p className="text-sm text-red-300">Enter a realistic weight.</p>
        )}
      </div>
    </fieldset>
  );
}

function GenderSelector({
  value,
  setValue,
  register,
}: {
  value: OnboardingFormValues["genderIdentity"];
  setValue: (value: OnboardingFormValues["genderIdentity"]) => void;
  register: UseFormRegister<OnboardingFormValues>;
}) {
  const options = onboardingSchema.shape.genderIdentity.options;

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-white">Gender identity</label>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => setValue(option)}
            className={`rounded-[var(--radius-sm)] px-4 py-3 text-sm font-medium ${value === option ? "bg-[var(--color-primary)] text-[var(--color-background)]" : "bg-white/10 text-white/80"}`}
          >
            {option === "nonbinary" ? "Non-binary" : option === "custom" ? "Custom" : option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
      {value === "custom" && (
        <Input placeholder="Describe your identity" {...register("customGender")} />
      )}
    </div>
  );
}

function BinaryQuestion({
  field,
  value,
  setValue,
  register,
}: {
  field: "menstruation" | "medications" | "conditions";
  value: "yes" | "no";
  setValue: (value: "yes" | "no") => void;
  register: UseFormRegister<OnboardingFormValues>;
}) {
  const label =
    field === "menstruation"
      ? "Do you menstruate?"
      : field === "medications"
        ? "Currently taking medications that interact with alcohol?"
        : "Any health conditions we should account for?";

  const detailsField = field === "medications" ? "medicationDetails" : "conditionDetails";

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-white">{label}</label>
      <ToggleGroup
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]}
        value={value}
        onChange={(next) => setValue(next as "yes" | "no")}
      />
      {field !== "menstruation" && value === "yes" && (
        <textarea
          className="w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40"
          rows={3}
          placeholder="List meds or conditions so we can tune predictions"
          {...register(detailsField as "medicationDetails" | "conditionDetails")}
        />
      )}
    </div>
  );
}

function CycleDayField({
  value,
  menstruation,
  setValue,
}: {
  value: number | null | undefined;
  menstruation: OnboardingFormValues["menstruation"];
  setValue: (value: number | null) => void;
}) {
  if (menstruation !== "yes") {
    return null;
  }

  const displayValue = value ?? 14;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-white/80">
        <span>Where are you in your cycle?</span>
        <span className="font-semibold text-white">Day {displayValue}</span>
      </div>
      <input
        type="range"
        min={1}
        max={40}
        step={1}
        value={displayValue}
        onChange={(event) => setValue(Number(event.target.value))}
        className="w-full accent-[var(--color-primary)]"
      />
      <div className="flex flex-wrap gap-3 text-xs text-white/60">
        <span>Day 1 = period starts. Day 14 ≈ ovulation.</span>
        <button type="button" className="underline" onClick={() => setValue(null)}>
          I don’t track
        </button>
      </div>
    </div>
  );
}

function ScoreSlider({
  field,
  value,
  setValue,
}: {
  field: "metabolismScore" | "toleranceScore" | "targetLevel";
  value: number;
  setValue: (value: number) => void;
}) {
  const config = {
    metabolismScore: {
      label: "How fast do you metabolize?",
      helper: "Self-reported scale from 1 (slow) to 10 (fast).",
      min: 1,
      max: 10,
    },
    toleranceScore: {
      label: "How would you rate your tolerance?",
      helper: "We use this as a starting prior and keep learning.",
      min: 1,
      max: 10,
    },
    targetLevel: {
      label: "Set your PinkDrunk target",
      helper: "Default is 5. We\'ll adjust after a few sessions.",
      min: 0,
      max: 10,
    },
  } as const;

  const { label, helper, min, max } = config[field];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-white/80">
        <span>{label}</span>
        <span className="font-semibold text-white">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        className="w-full accent-[var(--color-primary)]"
      />
      <p className="text-xs text-white/60">{helper}</p>
    </div>
  );
}

function BasicField({
  field,
  register,
  errors,
}: {
  field: "name" | "geoLocation" | "age" | "profileImageUrl";
  register: UseFormRegister<OnboardingFormValues>;
  errors: FieldErrors<OnboardingFormValues>;
}) {
  const labelMap: Record<typeof field, string> = {
    name: "Preferred name",
    geoLocation: "Primary location (city, country)",
    age: "Age",
    profileImageUrl: "Profile image URL",
  };

  const type = field === "age" ? "number" : field === "profileImageUrl" ? "url" : "text";

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-white">{labelMap[field]}</label>
      <Input type={type} {...register(field, { valueAsNumber: field === "age" })} />
      {errors[field] && (
        <p className="text-sm text-red-300">{errors[field]?.message as string}</p>
      )}
    </div>
  );
}

function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full px-4 py-2 text-sm ${value === option.value ? "bg-[var(--color-primary)] text-[var(--color-background)]" : "bg-white/10 text-white/80"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function cmFromImperial(feet?: number, inches?: number) {
  const safeFeet = Number.isFinite(feet) ? Number(feet) : 0;
  const safeInches = Number.isFinite(inches) ? Number(inches) : 0;
  return safeFeet * 30.48 + safeInches * 2.54;
}

function imperialFromCm(cm?: number) {
  const safeCm = Number.isFinite(cm) ? Number(cm) : 0;
  const totalInches = safeCm / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}

function kgToLbs(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;
  return safeValue * 2.20462;
}

function lbsToKg(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;
  return safeValue * 0.453592;
}

function formatCm(value?: number) {
  if (!Number.isFinite(value)) return "";
  return parseFloat(Number(value).toFixed(1));
}

function formatFeet(cm?: number) {
  const { feet } = imperialFromCm(cm);
  return feet;
}

function formatInches(cm?: number) {
  const { inches } = imperialFromCm(cm);
  return inches;
}

function formatKg(value?: number) {
  return parseFloat(lbsToKg(value).toFixed(1));
}

function formatLbs(value?: number) {
  return parseFloat(kgToLbs(value).toFixed(1));
}
