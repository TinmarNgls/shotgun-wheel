import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, ExternalLink, Mail, Download, Target } from 'lucide-react';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { AppStoreBadges } from '@/components/AppStoreBadges';
import { LotteryWheel } from '@/components/LotteryWheel';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import shotgunLogo from '/lovable-uploads/0b1ac01c-62e0-4f48-97e9-be38dda9a59a.png';
type StepStatus = 'pending' | 'active' | 'completed' | 'error';
interface Step {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
}
const Index = () => {
  const {
    toast
  } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [shotgunerId, setShotgunerId] = useState<number | null>(null);
  const [spinError, setSpinError] = useState('');
  const [isCheckingSpinEligibility, setIsCheckingSpinEligibility] = useState(false);
  const [steps, setSteps] = useState<Step[]>([{
    id: 1,
    title: 'Download Shotgun',
    description: 'Get the app from your app store',
    status: 'active'
  }, {
    id: 2,
    title: 'Follow & Enable Notifications',
    description: 'Follow Shotgun and turn on notifications',
    status: 'pending'
  }, {
    id: 3,
    title: 'Submit Your Email',
    description: 'Enter your Shotgun account email',
    status: 'pending'
  }, {
    id: 4,
    title: 'Account Verification',
    description: 'We verify your account status',
    status: 'pending'
  }, {
    id: 5,
    title: 'Spin the Wheel',
    description: 'Win amazing prizes!',
    status: 'pending'
  }]);
  const updateStepStatus = (stepId: number, status: StepStatus) => {
    setSteps(prev => prev.map(step => step.id === stepId ? {
      ...step,
      status
    } : step));
  };
  const handleDownload = () => {
    updateStepStatus(1, 'completed');
    setCurrentStep(2);
    updateStepStatus(2, 'active');
  };
  const handleFollowComplete = () => {
    updateStepStatus(2, 'completed');
    setCurrentStep(3);
    updateStepStatus(3, 'active');
  };
  const handleEmailSubmit = async () => {
    if (!email.trim()) return;
    updateStepStatus(3, 'completed');
    setCurrentStep(4);
    updateStepStatus(4, 'active');
    setIsVerifying(true);
    setVerificationError('');
    try {
      // Webhook call to Make.com
      const response = await fetch('https://hook.eu1.make.com/v47hppeo14q2w5klcrfgpjdsv3ohv3ah', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim()
        })
      });
      const responseText = await response.text();

      // Try to parse JSON response to get shotguner_id
      let webhookData = null;
      try {
        webhookData = JSON.parse(responseText);
      } catch (e) {
        // Fallback to text response for legacy support
      }
      if (responseText === 'OK' || webhookData && webhookData.status === 'OK') {
        setIsVerified(true);

        // Extract shotguner_id if available in JSON response
        if (webhookData && webhookData.shotguner_id) {
          setShotgunerId(webhookData.shotguner_id);
        }
        updateStepStatus(4, 'completed');
        setCurrentStep(5);
        updateStepStatus(5, 'active');
      } else {
        setIsVerified(false);
        const errorMessage = responseText === 'Accepted' || !responseText.trim() ? 'missing error code' : responseText;
        setVerificationError(errorMessage);
        updateStepStatus(4, 'error');
      }
    } catch (error) {
      setVerificationError('Something went wrong. Please try again.');
      updateStepStatus(4, 'error');
    } finally {
      setIsVerifying(false);
    }
  };
  const handleLotteryComplete = (result: string) => {
    setFinalResult(result);
    setWheelResult(result);
    setIsSpinning(false);
    updateStepStatus(5, 'completed');
  };
  const handleSpin = async () => {
    if (isSpinning || isCheckingSpinEligibility) return;

    // Check if we have shotgunerId, create a unique fallback based on email for testing
    const userShotgunerId = shotgunerId || Math.abs(email.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0));
    setIsCheckingSpinEligibility(true);
    setSpinError('');
    try {
      // Call our backend spin function
      const {
        data,
        error
      } = await supabase.functions.invoke('spin-wheel', {
        body: {
          shotguner_id: userShotgunerId,
          shotguner_email: email
        }
      });
      console.log('Spin response - data:', data);
      console.log('Spin response - error:', error);

      // Handle network/connection errors
      if (error) {
        console.log('Network error:', JSON.stringify(error, null, 2));
        setSpinError('Network error. Please check your connection and try again.');
        setIsCheckingSpinEligibility(false);
        return;
      }

      // Handle successful response with potential error status in data
      if (data && data.error) {
        if (data.error === 'already_spun') {
          setSpinError('You have already spun the wheel. Only one spin per user is allowed.');
        } else {
          setSpinError(data.message || 'Something went wrong. Please try again.');
        }
        setIsCheckingSpinEligibility(false);
        return;
      }

      // Backend determined the result, now animate the wheel
      setIsSpinning(true);
      setIsCheckingSpinEligibility(false);

      // Simulate wheel spinning animation
      setTimeout(() => {
        let displayResult = '';
        if (data.result === 'win') {
          displayResult = `🎉 Winner! Code: ${data.winning_code}`;
        } else {
          displayResult = '🙃 Try Again';
        }
        handleLotteryComplete(displayResult);
      }, 3000);
    } catch (error) {
      console.error('Network error spinning wheel:', error);
      setSpinError('Network error. Please check your connection and try again.');
      setIsCheckingSpinEligibility(false);
    }
  };
  const resetProcess = () => {
    setCurrentStep(1);
    setEmail('');
    setVerificationError('');
    setFinalResult(null);
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index === 0 ? 'active' : 'pending'
    })));
  };
  const goToNextStep = () => {
    if (currentStep === 4 && !isVerified) {
      // If verification failed, go back to email step
      setCurrentStep(3);
      updateStepStatus(3, 'active');
      updateStepStatus(4, 'pending');
      setVerificationError('');
    } else if (currentStep < 5 && !finalResult) {
      setCurrentStep(currentStep + 1);
      updateStepStatus(currentStep + 1, 'active');
    }
  };
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      // If on step 5 (wheel), go back to step 3 (email) to skip verification screen
      const targetStep = currentStep === 5 ? 3 : currentStep - 1;
      setCurrentStep(targetStep);
      updateStepStatus(targetStep, 'active');

      // Clear any verification errors when going back
      if (verificationError) {
        setVerificationError('');
      }

      // Reset wheel-related states when going back from wheel step
      if (currentStep === 5) {
        setFinalResult(null);
        setWheelResult(null);
        setIsSpinning(false);
        setSpinError('');
        setIsVerified(false);
        setShotgunerId(null);
      }
    }
  };
  return <div className="min-h-screen py-8 px-4 pb-24 relative">
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="max-w-2xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <img src={shotgunLogo} alt="Shotgun App" className="w-20 h-20 rounded-xl shadow-glow" />
          </div>
          <h1 className="heading-1">Shotgun Lucky Jogwheel</h1>
          <p className="body-regular max-w-lg mx-auto px-6">Complete these steps  for a chance to win a prize!</p>
        </div>

        {/* 4-Step Progress Stepper */}
        <div className="flex justify-center items-center space-x-3 mb-8">
          {[1, 2, 3, 4].map((step) => {
            const stepMapping = {
              1: 1, // Download
              2: 2, // Follow
              3: Math.max(3, 4), // Email/Verification combined
              4: 5, // Spin
            };
            const mappedStep = stepMapping[step as keyof typeof stepMapping];
            const isCompleted = currentStep > mappedStep;
            const isActive = currentStep === mappedStep || (step === 3 && (currentStep === 3 || currentStep === 4));
            
            return (
              <div
                key={step}
                className={`w-16 h-2 rounded-full transition-all duration-300 ${
                  isCompleted || isActive
                    ? 'bg-gradient-to-r from-[#8C7FFF] via-[#F26AF2] to-[#FFC478]'
                    : 'bg-white/10'
                }`}
              />
            );
          })}
        </div>

        {/* Step 1: Download */}
        {currentStep === 1 && <Card className="step-card active">
            <div className="text-center space-y-6 py-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="heading-3">Download Shotgun App</span>
              </div>
              
              <AppStoreBadges onDownload={handleDownload} />
              
              
            </div>
          </Card>}

        {/* Step 2: Follow */}
        {currentStep === 2 && <Card className="step-card active">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <span className="heading-3">Follow & Enable Notifications</span>
              </div>
              <p className="body-regular mb-4">
                From the app, follow Shotgun page and enable push & emails
              </p>
              
              <Button asChild variant="cta" className="inline-flex items-center space-x-2">
                <a href="https://shotgun.live/en/venues/shotgun" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-5 h-5" />
                  <span>Go to Shotgun Page</span>
                </a>
              </Button>
              
              
            </div>
          </Card>}

        {/* Step 3: Email Input */}
        {currentStep === 3 && <Card className="step-card active">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <span className="heading-3">Submit Your Email</span>
              </div>
              <p className="body-regular">
                Enter the email address associated with your Shotgun account
              </p>
              
              <div className="space-y-4 max-w-sm mx-auto">
                <Input type="email" placeholder="your-email@example.com" value={email} onChange={e => setEmail(e.target.value)} className="text-center bg-input border-border focus:border-primary" />
                <Button onClick={handleEmailSubmit} disabled={!email.trim() || isVerifying} variant="cta" className="w-full">
                  {isVerifying ? <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </> : "Verify my account"}
                </Button>
              </div>
            </div>
          </Card>}

        {/* Step 4: Verification */}
        {currentStep === 4 && <Card className="step-card active">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <span className="heading-3">Verifying Your Account</span>
              </div>
              
              {isVerifying ? <div className="space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                </div> : verificationError ? <div className="space-y-4">
                  <XCircle className="w-12 h-12 mx-auto text-destructive" />
                  <p className="text-destructive font-medium font-grotesk">
                    {verificationError}
                  </p>
                  <Button onClick={() => setCurrentStep(3)} variant="cta">
                    Try Again
                  </Button>
                </div> : null}
            </div>
          </Card>}

        {/* Step 5: Lottery Wheel */}
        {currentStep === 5 && <Card className="step-card active">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <span className="heading-3">take your chance</span>
              </div>
              <p className="body-regular">You're eligible to spin our lottery jogwheel</p>
              
              <LotteryWheel onComplete={handleLotteryComplete} isSpinning={isSpinning} result={wheelResult} />
              
              {spinError && <div className="mt-4 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm font-grotesk">{spinError}</p>
                </div>}
            </div>
          </Card>}

        {/* Error Display - Removed */}
      </div>

      {/* Sticky Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
        <div className="max-w-2xl mx-auto flex justify-between gap-4">
          {currentStep > 1 && <Button onClick={goToPreviousStep} variant="secondary-cta" className="flex-1">
              Previous
            </Button>}
          {!finalResult && <>
              {currentStep < 5 && <Button onClick={goToNextStep} variant="cta" className={`flex-1 ${currentStep === 1 ? 'w-full' : ''}`} disabled={currentStep === 3 && !isVerified || currentStep === 4 && !isVerified}>
                  Next
                </Button>}
              {currentStep === 5 && !wheelResult && <Button onClick={handleSpin} disabled={isSpinning || isCheckingSpinEligibility} variant="cta" className="flex-1">
                  {isCheckingSpinEligibility ? <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Checking...
                    </> : isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
                </Button>}
            </>}
        </div>
      </div>
    </div>;
};
export default Index;