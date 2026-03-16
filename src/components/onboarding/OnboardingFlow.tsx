import React, { useState } from 'react';
import { WelcomeScreen } from './WelcomeScreen';
import { CompanyEssentials } from './CompanyEssentials';
import { FirstOffice } from './FirstOffice';
import { InviteTeam } from './InviteTeam';
import { SuccessCelebration } from './SuccessCelebration';

interface OnboardingFlowProps {
  onComplete: () => void;
  adminName: string;
}

export function OnboardingFlow({ onComplete, adminName }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    companyName: '',
    companySize: '',
    sector: '',
    language: 'English',
    timezone: 'UTC',
    logo: null as File | null,
    officeName: '',
    officeAddress: '',
    currency: 'EUR',
    officeTimezone: 'UTC',
    workingHours: { start: '09:00', end: '18:00' },
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    teamMembers: [] as Array<{ email: string; role: string; name?: string }>
  });

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const steps = [
    <WelcomeScreen key="welcome" adminName={adminName} onNext={nextStep} />,
    <CompanyEssentials 
      key="company" 
      data={formData} 
      onUpdate={updateFormData}
      onNext={nextStep}
      onBack={prevStep}
    />,
    <FirstOffice 
      key="office"
      data={formData}
      onUpdate={updateFormData}
      onNext={nextStep}
      onBack={prevStep}
    />,
    <InviteTeam 
      key="team"
      data={formData}
      onUpdate={updateFormData}
      onNext={nextStep}
      onBack={prevStep}
    />,
    <SuccessCelebration 
      key="success"
      companyName={formData.companyName}
      onComplete={onComplete}
    />
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] to-[#E0E9FF] flex items-center justify-center p-4">
      {steps[currentStep]}
    </div>
  );
}
