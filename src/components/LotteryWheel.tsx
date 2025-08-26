import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LotteryWheelProps {
  onComplete: (result: string) => void;
  onSpin?: () => void;
  isSpinning?: boolean;
  result?: string | null;
}

const prizes = [
  { text: "🎉 15% Discount!", value: "15% voucher", color: "text-accent" },
  { text: "🎫 Free Event Ticket", value: "free ticket", color: "text-secondary" },
  { text: "🎵 VIP Access", value: "vip access", color: "text-primary" },
  { text: "🙃 Try Again", value: "no prize", color: "text-muted-foreground" },
  { text: "🎁 Mystery Prize", value: "mystery prize", color: "text-success" },
  { text: "🎊 20% Discount!", value: "20% voucher", color: "text-accent" },
];

export const LotteryWheel = ({ onComplete, onSpin, isSpinning: externalIsSpinning, result: externalResult }: LotteryWheelProps) => {
  const { toast } = useToast();
  const [internalIsSpinning, setInternalIsSpinning] = useState(false);
  const [internalResult, setInternalResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isSpinning = externalIsSpinning !== undefined ? externalIsSpinning : internalIsSpinning;
  const result = externalResult !== undefined ? externalResult : internalResult;

  const spinWheel = () => {
    if (isSpinning) return;
    
    if (onSpin) {
      onSpin();
      return;
    }
    
    setInternalIsSpinning(true);
    setInternalResult(null);
    
    // Generate random number of rotations (3-6 full rotations + random angle)
    const spins = Math.floor(Math.random() * 3) + 3;
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = spins * 360 + randomAngle;
    
    setRotation(prev => prev + totalRotation);
    
    // Determine winning prize based on final angle
    const finalAngle = (rotation + totalRotation) % 360;
    const sectionSize = 360 / prizes.length;
    const winningIndex = Math.floor(finalAngle / sectionSize);
    const winningPrize = prizes[winningIndex];
    
    setTimeout(() => {
      setInternalIsSpinning(false);
      setInternalResult(winningPrize.text);
      onComplete(winningPrize.value);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative w-64 h-64">
        {/* Wheel Container */}
        <div 
          className={`w-full h-full rounded-full border-4 border-primary relative overflow-hidden transition-transform duration-3000 ease-out ${isSpinning ? 'animate-spin-slow' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Wheel Sections */}
          {prizes.map((prize, index) => {
            const angle = (360 / prizes.length) * index;
            const nextAngle = (360 / prizes.length) * (index + 1);
            
            return (
              <div
                key={index}
                className={`absolute w-full h-full ${index % 2 === 0 ? 'bg-primary/20' : 'bg-secondary/20'}`}
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((nextAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((nextAngle - 90) * Math.PI / 180)}%)`
                }}
              >
                <div 
                  className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground"
                  style={{ transform: `rotate(${angle + (360 / prizes.length) / 2}deg)` }}
                >
                  <span style={{ transform: 'translateY(-60px)' }}>
                    {prize.text.split(' ')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Center Pin */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-accent rounded-full border-2 border-background z-10"></div>
        
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-accent z-20"></div>
      </div>
      
      {/* Spin Button removed - now handled by parent */}
      
      {/* Result Display */}
      {result && (
        <div className="text-center space-y-4 animate-bounce-in">
          {result.includes("Try Again") ? (
            <>
              <div className="heading-3">You loose</div>
              <p className="body-regular">
                Sorry, this is not your lucky day this time!
              </p>
            </>
          ) : result.includes("Code:") ? (
            <>
              <div className="heading-3">YOU WIN 🎉</div>
              <p className="body-regular">
                This is your lucky day ! Here is your 5€ code, make sure to save it
              </p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <div 
                  className="px-6 py-3 rounded-lg text-white font-bold text-lg tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, #D1A2DB 0%, #B7EBEF 50%, #75A1A7 100%)'
                  }}
                >
                  {result.split("Code: ")[1]}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const code = result.split("Code: ")[1];
                    await navigator.clipboard.writeText(code);
                    setCopied(true);
                    toast({
                      title: "Code copied!",
                      description: "The code has been copied to your clipboard."
                    });
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="h-12 w-12 p-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </>
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