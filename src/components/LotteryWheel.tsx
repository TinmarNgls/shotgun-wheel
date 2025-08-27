import wheelAnimation from "./Scene-1.json";
import Lottie, { LottieRef } from "lottie-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LotteryWheelProps {
  isSpinning?: boolean;
  result?: string | null;
  lottieRef: LottieRef;
}

export const LotteryWheel = ({
  lottieRef,
  result: externalResult,
}: LotteryWheelProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const result = externalResult !== undefined ? externalResult : null;

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.stop();
    }
  }, [lottieRef]);

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative" style={{ width: 320, height: 320 }}>
        {/* Lottie Wheel */}
        <Lottie
          animationData={wheelAnimation}
          loop={false}
          autoPlay={false}
          playsInline={false}
          lottieRef={lottieRef}
        />
      </div>

      {/* Result Display */}
      {result && (
        <div
          ref={resultRef}
          className="text-center space-y-4 animate-bounce-in"
        >
          {result.includes("Try Again") || result.includes("no prize") ? (
            <>
              <div className="heading-3">You lose</div>
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
                    const amountMatch = codeParts[1].match(
                      /(\d+\.?\d*)\s*([A-Z]{3})/
                    );
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

              return (
                <>
                  <div className="heading-3">YOU WIN 🎉</div>
                  <p className="body-regular">
                    This is your lucky day! Here is your{" "}
                    <span style={{ color: "#B7EBEF", fontWeight: "bold" }}>
                      {amount && currency
                        ? formatAmount(amount, currency)
                        : "€5.00"}
                    </span>{" "}
                    code, make sure to save it
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <div
                      className="px-6 py-3 rounded-lg font-grotesk font-bold text-lg tracking-wider"
                      style={{
                        background:
                          "linear-gradient(135deg, #D1A2DB 0%, #B7EBEF 50%, #75A1A7 100%)",
                        color: "#1B1B1B",
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
                          description:
                            "The code has been copied to your clipboard.",
                        });
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="h-12 w-12 p-0 hover:bg-[#323232] hover:text-white border-border"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
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
              <div className="heading-3">You lose</div>
              <p className="body-regular">
                Sorry, this is not your lucky day this time!
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
