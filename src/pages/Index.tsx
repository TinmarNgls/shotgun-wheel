import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, ExternalLink, Mail, Download, Target } from 'lucide-react';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { AppStoreBadges } from '@/components/AppStoreBadges';
import { LotteryWheel } from '@/components/LotteryWheel';
import shotgunLogo from '/lovable-uploads/f73cf581-d949-480b-9d60-76d7f8bc289d.png';

type StepStatus = 'pending' | 'active' | 'completed' | 'error';

interface Step {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [finalResult, setFinalResult] = useState<string | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: 'Download Shotgun',
      description: 'Get the app from your app store',
      status: 'active'
    },
    {
      id: 2,
      title: 'Follow & Enable Notifications',
      description: 'Follow Shotgun and turn on notifications',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Submit Your Email',
      description: 'Enter your Shotgun account email',
      status: 'pending'
    },
    {
      id: 4,
      title: 'Account Verification',
      description: 'We verify your account status',
      status: 'pending'
    },
    {
      id: 5,
      title: 'Spin the Wheel',
      description: 'Win amazing prizes!',
      status: 'pending'
    }
  ]);

  const updateStepStatus = (stepId: number, status: StepStatus) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
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
      // Mock webhook call - replace with actual webhook URL
      const response = await fetch('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      
      // Since we're using a dummy URL, simulate responses
      const mockSuccess = Math.random() > 0.3; // 70% success rate for demo
      
      if (mockSuccess) {
        updateStepStatus(4, 'completed');
        setCurrentStep(5);
        updateStepStatus(5, 'active');
      } else {
        const errorMessages = [
          "You didn't follow Shotgun yet. Please follow us first!",
          "We couldn't find this email in our system.",
          "Please enable notifications to continue."
        ];
        const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        setVerificationError(randomError);
        updateStepStatus(4, 'error');
        setCurrentStep(2); // Go back to follow step
        updateStepStatus(2, 'active');
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
    updateStepStatus(5, 'completed');
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

  return (
    <div className="min-h-screen py-8 px-4 relative">
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="max-w-2xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <img 
              src={shotgunLogo} 
              alt="Shotgun App" 
              className="w-20 h-20 rounded-xl shadow-glow bg-white p-2"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Win Amazing Prizes!
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Complete these simple steps and spin our lottery wheel for a chance to win exclusive discounts and prizes!
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} totalSteps={5} />

        {/* Step 1: Download */}
        {currentStep === 1 && (
          <Card className="step-card active">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
                <Download className="w-8 h-8 text-primary" />
                <span>Download Shotgun</span>
              </div>
              <p className="text-muted-foreground">
                First, download the Shotgun app from your device's app store
              </p>
              <AppStoreBadges onDownload={handleDownload} />
            </div>
          </Card>
        )}

        {/* Step 2: Follow */}
        {currentStep === 2 && (
          <Card className="step-card active">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
                <Target className="w-8 h-8 text-secondary" />
                <span>Follow & Enable Notifications</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Open the Shotgun app, follow our official page, and enable email + push notifications
              </p>
              
              <a
                href="https://shotgun.live/en/venues/shotgun"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 secondary-button"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Go to Shotgun Page</span>
              </a>
              
              <div className="mt-6">
                <Button 
                  onClick={handleFollowComplete}
                  className="cta-button"
                >
                  ✓ I've Followed & Enabled Notifications
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Email Input */}
        {currentStep === 3 && (
          <Card className="step-card active">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
                <Mail className="w-8 h-8 text-accent" />
                <span>Submit Your Email</span>
              </div>
              <p className="text-muted-foreground">
                Enter the email address associated with your Shotgun account
              </p>
              
              <div className="space-y-4 max-w-sm mx-auto">
                <Input
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-center bg-input border-border focus:border-primary"
                />
                <Button 
                  onClick={handleEmailSubmit}
                  disabled={!email.trim()}
                  className="cta-button w-full"
                >
                  Done
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Verification */}
        {currentStep === 4 && (
          <Card className="step-card active">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
                <CheckCircle className="w-8 h-8 text-success" />
                <span>Verifying Your Account</span>
              </div>
              
              {isVerifying ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">
                    Checking your account status...
                  </p>
                </div>
              ) : verificationError ? (
                <div className="space-y-4">
                  <XCircle className="w-12 h-12 mx-auto text-destructive" />
                  <p className="text-destructive font-medium">
                    {verificationError}
                  </p>
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    className="secondary-button"
                  >
                    Try Again
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        )}

        {/* Step 5: Lottery Wheel */}
        {currentStep === 5 && (
          <Card className="step-card active">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
                <Target className="w-8 h-8 text-primary" />
                <span>Spin the Wheel!</span>
              </div>
              <p className="text-muted-foreground">
                Congratulations! You're eligible to spin our lottery wheel
              </p>
              
              <LotteryWheel onComplete={handleLotteryComplete} />
            </div>
          </Card>
        )}

        {/* Completion Message */}
        {finalResult && (
          <Card className="step-card completed">
            <div className="text-center space-y-6">
              <div className="text-3xl font-bold text-success">
                🎉 Congratulations!
              </div>
              <p className="text-lg text-muted-foreground">
                You've successfully completed the challenge!
              </p>
              <Button 
                onClick={resetProcess}
                className="secondary-button"
              >
                🔄 Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {verificationError && currentStep !== 4 && (
          <Card className="border-destructive bg-destructive/10">
            <div className="text-center space-y-4">
              <XCircle className="w-8 h-8 mx-auto text-destructive" />
              <p className="text-destructive font-medium">
                {verificationError}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;