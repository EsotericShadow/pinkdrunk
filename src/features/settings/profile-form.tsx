"use client";

import { useTransition, useState } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { OnboardingField } from "@/features/onboarding/onboarding-field";
import {
  onboardingSchema,
  type OnboardingFieldKey,
  type OnboardingFormValues,
} from "@/features/onboarding/schema";
import { postProfile } from "@/features/onboarding/submit-profile";

const profileFieldGroups: Array<{ title: string; description: string; fields: OnboardingFieldKey[] }> = [
  {
    title: "Identity",
    description: "Name, location, and optional avatar.",
    fields: ["name", "profileImageUrl", "geoLocation"],
  },
  {
    title: "Body stats",
    description: "Update your baseline physiology.",
    fields: ["height", "weight", "age", "genderIdentity", "menstruation", "cycleDay"],
  },
  {
    title: "Health context",
    description: "Medications and conditions adjust predictions.",
    fields: ["medications", "medicationDetails", "conditions", "conditionDetails"],
  },
  {
    title: "Calibration",
    description: "Tell us how your body handles alcohol.",
    fields: ["metabolismScore", "toleranceScore", "targetLevel"],
  },
];

export type ProfileFormProps = {
  initialValues: OnboardingFormValues;
};

export function ProfileForm({ initialValues }: ProfileFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema) as Resolver<OnboardingFormValues>,
    defaultValues: initialValues,
  });

  const onSubmit: SubmitHandler<OnboardingFormValues> = (values) => {
    setMessage(null);
    startTransition(async () => {
      const response = await postProfile(values);
      if (!response.ok) {
        setMessage("Could not save profile. Check your inputs.");
        return;
      }
      setMessage("Saved");
      reset(values);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {profileFieldGroups.map((group) => (
        <section
          key={group.title}
          className="space-y-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 backdrop-blur"
        >
          <header>
            <h2 className="text-lg font-semibold text-white">{group.title}</h2>
            <p className="text-sm text-white/60">{group.description}</p>
          </header>
          <div className="space-y-4">
            {group.fields.map((fieldKey) => (
              <OnboardingField
                key={fieldKey}
                fieldKey={fieldKey}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
            ))}
          </div>
        </section>
      ))}

      {message && (
        <p className={`text-sm ${message === "Saved" ? "text-emerald-300" : "text-red-300"}`}>{message}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
