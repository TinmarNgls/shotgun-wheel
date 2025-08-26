import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lottie-player': {
        id?: string;
        src?: string;
        background?: string;
        style?: React.CSSProperties;
        autoplay?: string;
        loop?: string;
        ref?: React.RefObject<any>;
      };
    }
  }
}

export const LotteryWheel = ({ onComplete, onSpin, isSpinning: externalIsSpinning, result: externalResult }: LotteryWheelProps) => {
  const { toast } = useToast();
  const [internalIsSpinning, setInternalIsSpinning] = useState(false);
  const [internalResult, setInternalResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
    if (!playerRef.current || isSpinning) {
      return;
    }

    setInternalIsSpinning(true);
    
    // Reset and play the Lottie animation
    playerRef.current.stop();
    playerRef.current.play();

    // If no external handler, we need to handle result internally
    if (!onSpin) {
      // Generate a random prize after animation duration
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * prizes.length);
        const winningPrize = prizes[randomIndex];
        
        setInternalIsSpinning(false);
        setInternalResult(winningPrize.text);
        onComplete(winningPrize.value);
      }, 3000); // Approximate duration of Lottie animation
    }
  };

  const spinWheel = () => {
    if (isSpinning) return;
    
    // Call onSpin if provided, otherwise handle internally
    if (onSpin) {
      onSpin();
    } else {
      spinLottieWheel();
    }
  };

  // Handle Lottie animation complete event
  useEffect(() => {
    if (playerRef.current) {
      const player = playerRef.current;
      
      const handleComplete = () => {
        if (onSpin) {
          // External handler will manage the result
          setInternalIsSpinning(false);
        }
      };

      player.addEventListener('complete', handleComplete);
      
      return () => {
        player.removeEventListener('complete', handleComplete);
      };
    }
  }, [onSpin]);

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative w-80 h-80">
        {/* Lottie Wheel */}
        <lottie-player
          ref={playerRef}
          id="jogwheel"
          src="https://lottie.host/d8e0176d-8d74-46ed-b107-4f9a7b3d1ff5/6fhNis5qmi.lottie"
          background="transparent"
          style={{ width: '100%', height: '100%' }}
          autoplay="false"
          loop="false"
        />
      </div>
      
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