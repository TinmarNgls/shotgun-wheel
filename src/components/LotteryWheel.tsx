import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LotteryWheelProps {
  onComplete: (result: string) => void;
  onSpin?: () => void;
  isSpinning?: boolean;
  result?: string | null;
}

const prizes = [
  { text: "15% Discount", value: "15% voucher", color: "text-accent" },
  { text: "Free Event Ticket", value: "free ticket", color: "text-secondary" },
  { text: "VIP Access", value: "vip access", color: "text-primary" },
  { text: "Try Again", value: "no prize", color: "text-muted-foreground" },
  { text: "Mystery Prize", value: "mystery prize", color: "text-success" },
  { text: "20% Discount", value: "20% voucher", color: "text-accent" },
];


export const LotteryWheel = ({ onComplete, onSpin, isSpinning: externalIsSpinning, result: externalResult }: LotteryWheelProps) => {
  const { toast } = useToast();
  const [internalIsSpinning, setInternalIsSpinning] = useState(false);
  const [internalResult, setInternalResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  
  // Use external state if provided, otherwise use internal state
  const isSpinning = externalIsSpinning !== undefined ? externalIsSpinning : internalIsSpinning;
  const result = externalResult !== undefined ? externalResult : internalResult;

  // Effect to handle external spinning state changes
  useEffect(() => {
    if (externalIsSpinning && playerRef.current) {
      spinLottieWheel();
    }
  }, [externalIsSpinning]);

  // Effect to scroll to result when it appears
  useEffect(() => {
    if (result) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [result]);

  const spinLottieWheel = () => {
    console.log("🎯 spinLottieWheel called", { 
      playerExists: !!playerRef.current, 
      isSpinning, 
      isPlayerReady 
    });
    
    if (!playerRef.current || isSpinning || !isPlayerReady) {
      console.log("❌ Can't spin - conditions not met");
      return;
    }

    console.log("✅ Starting spin animation");
    setInternalIsSpinning(true);
    
    // Stop first, then play the Lottie animation
    try {
      playerRef.current.stop();
      playerRef.current.play();
      console.log("🎬 Animation play() called");
    } catch (error) {
      console.error("❌ Error playing animation:", error);
    }

    // If no external handler, we need to handle result internally
    if (!onSpin) {
      // Generate a random prize after animation duration
      setTimeout(() => {
        console.log("🎁 Generating random prize");
        const randomIndex = Math.floor(Math.random() * prizes.length);
        const winningPrize = prizes[randomIndex];
        
        setInternalIsSpinning(false);
        setInternalResult(winningPrize.text);
        onComplete(winningPrize.value);
      }, 3000); // Approximate duration of Lottie animation
    }
  };

  const spinWheel = () => {
    console.log("🎪 spinWheel called", { isSpinning });
    if (isSpinning) return;
    
    // Call onSpin if provided, otherwise handle internally
    if (onSpin) {
      onSpin();
    } else {
      spinLottieWheel();
    }
  };

  // Debug test function - force play
  const forcePlay = () => {
    console.log("🚀 Force play called");
    if (playerRef.current) {
      try {
        playerRef.current.stop();
        playerRef.current.play();
        console.log("🎬 Force play executed");
      } catch (error) {
        console.error("❌ Force play error:", error);
      }
    }
  };

  // Handle Lottie player ready
  const handlePlayerReady = () => {
    console.log("✅ Lottie player is ready!");
    setIsPlayerReady(true);
    // Force start to bypass reduced motion
    if (playerRef.current) {
      try {
        playerRef.current.play();
        setTimeout(() => playerRef.current.stop(), 100); // Quick test
        console.log("🔄 Player test completed");
      } catch (error) {
        console.error("❌ Player ready test error:", error);
      }
    }
  };

  // Handle Lottie animation complete event
  const handleLottieComplete = () => {
    console.log("🏁 Animation completed");
    if (onSpin) {
      // External handler will manage the result
      setInternalIsSpinning(false);
    }
  };

  // Handle load error
  const handleLoadError = (error: any) => {
    console.error("❌ Lottie load error:", error);
    toast({
      title: "Animation Error",
      description: "Failed to load the wheel animation. Please try again.",
      variant: "destructive"
    });
  };

  // Handle data ready
  const handleDataReady = () => {
    console.log("📊 Lottie data ready");
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative" style={{ width: 320, height: 320 }}>
        {/* Lottie Wheel */}
        <DotLottieReact
          src="https://lottie.host/d8e0176d-8d74-46ed-b107-4f9a7b3d1ff5/6fhNis5qmi.lottie"
          loop={false}
          autoplay={false}
          style={{ width: 320, height: 320, display: "block" }}
          dotLottieRefCallback={(dotLottie) => {
            console.log("🔗 DotLottie ref callback called", { dotLottie });
            playerRef.current = dotLottie;
            if (dotLottie) {
              console.log("✅ DotLottie player is ready!");
              setIsPlayerReady(true);
              // Force start to bypass reduced motion
              try {
                dotLottie.play();
                setTimeout(() => dotLottie.stop(), 100); // Quick test
                console.log("🔄 Player test completed");
              } catch (error) {
                console.error("❌ Player ready test error:", error);
              }
            }
          }}
        />
        
        {/* Debug controls */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-0 right-0 space-x-2 bg-black/50 p-2 rounded">
            <Button size="sm" onClick={forcePlay}>
              Force Play
            </Button>
            <span className="text-white text-xs">
              Ready: {isPlayerReady ? '✅' : '❌'}
            </span>
          </div>
        )}
      </div>
      
      {/* Spin Button */}
      {!isSpinning && !result && (
        <Button 
          onClick={spinWheel}
          disabled={!isPlayerReady}
          className="px-8 py-3 text-lg font-grotesk font-bold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
        >
          {!isPlayerReady ? "Loading..." : "SPIN THE WHEEL"}
        </Button>
      )}
      
      {/* Result Display */}
      {result && (
        <div ref={resultRef} className="text-center space-y-4 animate-bounce-in">
          {result.includes("Try Again") ? (
            <>
              <div className="heading-3">You loose</div>
              <p className="body-regular">
                Sorry, this is not your lucky day this time!
              </p>
            </>
          ) : result.includes("Code:") ? (
            (() => {
              const parts = result.split("Code: ");
              const codeInfo = parts[1];
              let code = codeInfo;
              let amount = null;
              let currency = null;
              let expirationDate = null;
              
              // Try to parse additional info if it exists
              try {
                if (codeInfo.includes(" | ")) {
                  const codeParts = codeInfo.split(" | ");
                  code = codeParts[0];
                  if (codeParts[1]) {
                    const amountMatch = codeParts[1].match(/(\d+\.?\d*)\s*([A-Z]{3})/);
                    if (amountMatch) {
                      amount = parseFloat(amountMatch[1]);
                      currency = amountMatch[2];
                    }
                  }
                  if (codeParts[2]) {
                    expirationDate = codeParts[2];
                  }
                }
              } catch (e) {
                console.log("Could not parse additional code info");
              }

              const getCurrencySymbol = (currency: string) => {
                switch (currency) {
                  case 'EUR': return '€';
                  case 'USD': return '$';
                  case 'BRL': return 'R$';
                  case 'GBP': return '£';
                  case 'JPY': return '¥';
                  default: return currency;
                }
              };

              const formatAmount = (amount: number, currency: string) => {
                const symbol = getCurrencySymbol(currency);
                if (currency === 'JPY') {
                  return `${symbol}${Math.round(amount)}`;
                }
                return `${symbol}${amount.toFixed(2)}`;
              };

              const formatExpirationDate = (dateString: string) => {
                try {
                  const date = new Date(dateString);
                  return format(date, 'MMMM dd, yyyy');
                } catch (e) {
                  return dateString;
                }
              };

              return (
                <>
                  <div className="heading-3">YOU WIN 🎉</div>
                  <p className="body-regular">
                    This is your lucky day! Here is your <span style={{ color: '#B7EBEF', fontWeight: 'bold' }}>{amount && currency ? formatAmount(amount, currency) : '€5.00'}</span> code, make sure to save it
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <div 
                      className="px-6 py-3 rounded-lg font-grotesk font-bold text-lg tracking-wider"
                      style={{
                        background: 'linear-gradient(135deg, #D1A2DB 0%, #B7EBEF 50%, #75A1A7 100%)',
                        color: '#1B1B1B'
                      }}
                    >
                      {code}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(code);
                        setCopied(true);
                        toast({
                          title: "Code copied!",
                          description: "The code has been copied to your clipboard."
                        });
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="h-12 w-12 p-0 hover:bg-[#323232] hover:text-white border-border"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {expirationDate && (
                    <p className="body-regular text-muted-foreground mt-4">
                      Valid until {formatExpirationDate(expirationDate)}
                    </p>
                  )}
                </>
              );
            })()
          ) : (
            <>
              <div className="heading-3">{result}</div>
              <p className="body-regular">
                Check your email for your prize details!
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};