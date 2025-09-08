import wheelAnimation from "./Scene-1.json";
import Lottie, { LottieRef } from "lottie-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
interface RewardData {
  code: string;
  amount?: number | null;
  currency?: string | null;
  expiration_date?: string | null;
  reward_type?: string;
  reward_name?: string;
}
interface LotteryWheelProps {
  isSpinning?: boolean;
  result?: string | RewardData | null;
  lottieRef: LottieRef;
}
export const LotteryWheel = ({
  lottieRef,
  result: externalResult
}: LotteryWheelProps) => {
  const {
    toast
  } = useToast();
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const result = externalResult !== undefined ? externalResult : null;

  // Check if result is a win (object) or loss (string)
  const isWin = result && typeof result === 'object' && result.code;
  const isLoss = result && typeof result === 'string';
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.stop();
    }
  }, [lottieRef]);
  return <div className="flex flex-col items-center space-y-8">
      <div className="relative" style={{
      width: 320,
      height: 320
    }}>
        {/* Lottie Wheel */}
        <Lottie animationData={wheelAnimation} loop={false} autoPlay={false} playsInline={false} lottieRef={lottieRef} />
      </div>

      {/* Result Display */}
      {result && <div ref={resultRef} className="text-center space-y-4 animate-bounce-in">
          {isLoss ? <>
              <div className="heading-3">YOU LOOSE</div>
              <p className="body-regular">
                Sorry, this is not your lucky day this time!
              </p>
            </> : isWin ? (() => {
        const rewardData = result as RewardData;
        const {
          code,
          amount,
          currency,
          expiration_date,
          reward_type,
          reward_name
        } = rewardData;
        const getCurrencySymbol = (currency: string) => {
          switch (currency) {
            case "EUR":
              return "€";
            case "USD":
              return "$";
            case "BRL":
              return "R$";
            case "GBP":
              return "£";
            case "JPY":
              return "¥";
            default:
              return currency;
          }
        };
        const formatAmount = (amount: number, currency: string) => {
          const symbol = getCurrencySymbol(currency);
          if (currency === "JPY") {
            return `${symbol}${Math.round(amount)}`;
          }
          return `${symbol}${amount.toFixed(2)}`;
        };
        const formatExpirationDate = (dateString: string) => {
          try {
            const date = new Date(dateString);
            return format(date, "MMMM dd, yyyy");
          } catch (e) {
            return dateString;
          }
        };

        // Render different messages based on reward type
        if (reward_type === "coupon") {
          return <>
                    <div className="heading-3">YOU WIN 🎉</div>
                    <p className="body-regular">
                      Congratulations! You won a voucher!<br />
                      Here is your{" "}
                      <span style={{
                color: "#B7EBEF",
                fontWeight: "bold"
              }}>
                        {amount && currency ? formatAmount(amount, currency) : "€5.00"}
                      </span>{" "}
                      code, make sure to save it
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <div className="px-6 py-3 rounded-lg font-grotesk font-bold text-lg tracking-wider" style={{
                background: "linear-gradient(135deg, #D1A2DB 0%, #B7EBEF 50%, #75A1A7 100%)",
                color: "#1B1B1B"
              }}>
                        {code}
                      </div>
                      <Button variant="outline" size="sm" onClick={async () => {
                await navigator.clipboard.writeText(code);
                setCopied(true);
                toast({
                  title: "Code copied!",
                  description: "The code has been copied to your clipboard."
                });
                setTimeout(() => setCopied(false), 2000);
              }} className="h-12 w-12 p-0 hover:bg-[#323232] hover:text-white border-border">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    {expiration_date && <p className="body-regular text-muted-foreground mt-4">
                        Valid until {formatExpirationDate(expiration_date)}
                      </p>}
                  </>;
        } else if (reward_type === "physical_reward") {
          return <>
                    <div className="heading-3">🎉 You've Won!</div>
                    <p className="body-regular">
                      Congrats — you've scored a{" "}
                      <span className="font-bold" style={{
                background: "linear-gradient(135deg, #D1A2DB 0%, #B7EBEF 50%, #75A1A7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                        {reward_name}
                      </span>
                      !<br /><br />
                      Pick it up at the dedicated gift point.
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <div className="px-6 py-3 rounded-lg font-grotesk font-bold text-lg tracking-wider" style={{
                background: "linear-gradient(135deg, #D1A2DB 0%, #B7EBEF 50%, #75A1A7 100%)",
                color: "#1B1B1B"
              }}>
                        {code}
                      </div>
                      <Button variant="outline" size="sm" onClick={async () => {
                await navigator.clipboard.writeText(code);
                setCopied(true);
                toast({
                  title: "Code copied!",
                  description: "The code has been copied to your clipboard."
                });
                setTimeout(() => setCopied(false), 2000);
              }} className="h-12 w-12 p-0 hover:bg-[#323232] hover:text-white border-border">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="body-regular text-muted-foreground mt-4">
                      We'll ask you to share this code and your email to retrieve your gift
                    </p>
                  </>;
        } else {
          // Fallback for unknown reward types
          return <>
                    <div className="heading-3">YOU WIN 🎉</div>
                    <p className="body-regular">
                      Congratulations! You won a prize!
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <div className="px-6 py-3 rounded-lg font-grotesk font-bold text-lg tracking-wider" style={{
                background: "linear-gradient(135deg, #D1A2DB 0%, #B7EBEF 50%, #75A1A7 100%)",
                color: "#1B1B1B"
              }}>
                        {code}
                      </div>
                      <Button variant="outline" size="sm" onClick={async () => {
                await navigator.clipboard.writeText(code);
                setCopied(true);
                toast({
                  title: "Code copied!",
                  description: "The code has been copied to your clipboard."
                });
                setTimeout(() => setCopied(false), 2000);
              }} className="h-12 w-12 p-0 hover:bg-[#323232] hover:text-white border-border">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </>;
        }
      })() : null}
        </div>}
    </div>;
};