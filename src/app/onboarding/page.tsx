"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { OnboardingField } from "@/features/onboarding/onboarding-field";
import {
  onboardingSchema,
  onboardingSteps,
  type OnboardingFormValues,
} from "@/features/onboarding/schema";
import { postProfile } from "@/features/onboarding/submit-profile";

const formDefaults: OnboardingFormValues = {
  name: "",
  geoLocation: "",
  profileImageUrl: "",
  heightUnit: "cm",
  heightCm: 170,
  heightFeet: 5,
  heightInches: 6,
  weightUnit: "kg",
  weightValue: 65,
  age: 28,
  genderIdentity: "female",
  customGender: "",
  menstruation: "yes",
  cycleDay: 14,
  medications: "no",
  medicationDetails: "",
  conditions: "no",
  conditionDetails: "",
  metabolismScore: 5,
  toleranceScore: 5,
  targetLevel: 5,
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema) as Resolver<OnboardingFormValues>,
    defaultValues: formDefaults,
  });

  const currentStep = onboardingSteps[step];

  const onFinalSubmit: SubmitHandler<OnboardingFormValues> = (values) => {
    startTransition(async () => {
      setServerError(null);

      const response = await postProfile(values);

      if (!response.ok) {
        setServerError("Could not save your profile. Try again.");
        return;
      }

      router.replace("/today");
    });
  };

  const goNext = handleSubmit(() => {
    if (step < onboardingSteps.length - 1) {
      setStep((prev) => prev + 1);
    }
  });

  const goBack = () => setStep((prev) => Math.max(prev - 1, 0));

  const progress = useMemo(() => ((step + 1) / onboardingSteps.length) * 100, [step]);

  return (
    <main className="flex min-h-screen justify-center px-6 py-16">
      <div className="w-full max-w-3xl space-y-10">
        <header className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--color-accent)]">Onboarding</p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">{currentStep.title}</h1>
              <p className="mt-2 text-sm text-white/70">{currentStep.description}</p>
            </div>
            <div className="text-right text-sm text-white/60">
              Step {step + 1} of {onboardingSteps.length}
            </div>
          </div>
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${progress}%` }} />
          </div>
        </header>

        <form
          className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-10 backdrop-blur"
          onSubmit={handleSubmit(onFinalSubmit)}
        >
          <div className="space-y-6">
            {currentStep.fields.map((fieldKey) => (
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

          {serverError && (
            <p className="mt-6 rounded-md border border-red-400 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {serverError}
            </p>
          )}

          <div className="mt-10 flex flex-col gap-3 md:flex-row md:justify-between">
            <Button type="button" variant="ghost" className="md:w-auto" onClick={goBack} disabled={step === 0 || isPending}>
              Back
            </Button>
            {step < onboardingSteps.length - 1 ? (
              <Button type="button" onClick={goNext} disabled={isPending}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                Save profile & start session
              </Button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
