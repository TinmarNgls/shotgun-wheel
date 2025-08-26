
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

export const LotteryWheel = ({ onComplete, onSpin, isSpinning: externalIsSpinning, result: externalResult }: LotteryWheelProps) => {
  const { toast } = useToast();
  const [internalIsSpinning, setInternalIsSpinning] = useState(false);
  const [internalResult, setInternalResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<Animation | null>(null);
  const wheelRef = useRef<HTMLImageElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  
  // Use external state if provided, otherwise use internal state
  const isSpinning = externalIsSpinning !== undefined ? externalIsSpinning : internalIsSpinning;
  const result = externalResult !== undefined ? externalResult : internalResult;

  // Effect to handle external spinning state changes
  useEffect(() => {
    if (externalIsSpinning && wheelRef.current) {
      spinWheelWithWebAPI();
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

  const spinWheelWithWebAPI = () => {
    if (!wheelRef.current || isSpinning) return;
    
    console.log('🎯 Starting Web Animations API spin');
    setInternalIsSpinning(true);
    setInternalResult(null);
    
    // Stop any existing animation
    if (currentAnimation) {
      currentAnimation.cancel();
      setCurrentAnimation(null);
    }
    
    // Calculate spin parameters for realistic wheel behavior
    const spins = 7 + Math.floor(Math.random() * 3); // 7-9 full rotations
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = spins * 360 + randomAngle;
    
    console.log('🎲 Spin details:', { spins, randomAngle, totalRotation });
    
    // Calculate winning prize based on final angle
    const finalAngle = totalRotation % 360;
    const sectionSize = 360 / prizes.length;
    const winningIndex = Math.floor(finalAngle / sectionSize);
    const winningPrize = prizes[winningIndex];
    
    console.log('🏆 Winning prize calculated:', winningPrize);
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Start the Web Animations API animation
    const animation = wheelRef.current.animate(
      [
        { transform: `rotate(${rotation}deg)` },
        { transform: `rotate(${rotation + totalRotation}deg)` }
      ],
      {
        duration: prefersReducedMotion ? 100 : 3500,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      }
    );
    
    setCurrentAnimation(animation);
    console.log('🎨 Web Animation started');
    
    // Handle animation completion
    animation.finished.then(() => {
      console.log('✅ Web Animation completed');
      setRotation((rotation + totalRotation) % 360);
      setInternalIsSpinning(false);
      setCurrentAnimation(null);
      
      // Handle result based on whether there's an external handler
      if (onSpin) {
        console.log('🔄 External handler will manage result');
      } else {
        setInternalResult(winningPrize.text);
        onComplete(winningPrize.value);
        console.log('🎊 Internal result set:', winningPrize.text);
      }
    }).catch((error) => {
      console.error('❌ Animation failed:', error);
      setInternalIsSpinning(false);
      setCurrentAnimation(null);
    });
  };

  const spinWheel = () => {
    console.log('spinWheel called, isSpinning:', isSpinning);
    if (isSpinning) return;
    
    // Call onSpin if provided, otherwise handle internally
    if (onSpin) {
      onSpin();
    } else {
      spinWheelWithWebAPI();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative w-80 h-80">
        {/* Wheel Container */}
        <img 
          ref={wheelRef}
          src="/lovable-uploads/f73cf581-d949-480b-9d60-76d7f8bc289d.png" 
          alt="Jogwheel" 
          className="w-full h-full object-contain"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            willChange: 'transform',
            filter: isSpinning ? 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))' : 'none'
          }}
        />
        
        {/* Pointer */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-blue-400 z-20 shadow-[0_0_10px_rgba(59,130,246,0.6)]" 
             style={{ borderLeftWidth: '6px', borderRightWidth: '6px', borderBottomWidth: '12px' }}></div>
      </div>
      
      {/* Spin Button removed - now handled by parent */}
      
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
                    <p className="body-small text-muted-foreground mt-4">
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
