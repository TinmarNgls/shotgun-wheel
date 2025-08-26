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
    
    // Generate random number of rotations (5-8 full rotations + random angle)
    const spins = Math.floor(Math.random() * 4) + 5;
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
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative w-80 h-80">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 shadow-2xl">
          {/* Inner decorative ridges */}
          <div className="absolute inset-2 rounded-full border-4 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-800"></div>
        </div>
        
        {/* Blue accent ring */}
        <div className="absolute inset-3 rounded-full border-2 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
        
        {/* Wheel Container */}
        <div 
          className="absolute inset-6 rounded-full bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 overflow-hidden transition-transform ease-out"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? '4000ms' : '300ms',
            transitionTimingFunction: isSpinning ? 'cubic-bezier(0.23, 1, 0.32, 1)' : 'ease-out'
          }}
        >
          {/* Radial texture lines */}
          <div className="absolute inset-0">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-px h-6 bg-gray-500 origin-bottom"
                style={{
                  left: '50%',
                  bottom: '50%',
                  transform: `rotate(${i * 6}deg) translateX(-0.5px)`,
                  opacity: 0.3
                }}
              />
            ))}
          </div>
          
          {/* Wheel Sections */}
          {prizes.map((prize, index) => {
            const angle = (360 / prizes.length) * index;
            const nextAngle = (360 / prizes.length) * (index + 1);
            
            return (
              <div
                key={index}
                className="absolute w-full h-full"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((nextAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((nextAngle - 90) * Math.PI / 180)}%)`,
                  background: index % 2 === 0 
                    ? 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                    : 'linear-gradient(45deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 100%)'
                }}
              >
                <div 
                  className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ transform: `rotate(${angle + (360 / prizes.length) / 2}deg)` }}
                >
                  <span 
                    className="text-center px-1 leading-tight"
                    style={{ 
                      transform: 'translateY(-45px) rotate(0deg)',
                      maxWidth: '60px',
                      fontSize: '10px'
                    }}
                  >
                    {prize.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Center Hub */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full border-2 border-gray-500 shadow-lg z-10">
          {/* Center logo area */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
          </div>
        </div>
        
        {/* Pointer */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-blue-400 z-20 shadow-[0_0_10px_rgba(59,130,246,0.6)]" 
             style={{ borderLeftWidth: '6px', borderRightWidth: '6px', borderBottomWidth: '12px' }}></div>
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
                  className="px-6 py-3 rounded-lg font-bold text-lg tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, #D1A2DB 0%, #B7EBEF 50%, #75A1A7 100%)',
                    color: '#1B1B1B'
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
                  className="h-12 w-12 p-0 hover:bg-[#323232] hover:text-white border-border"
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