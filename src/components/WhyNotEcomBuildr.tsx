import { Card } from "@/components/ui/card";
import { X, Check } from "lucide-react";

export const WhyNotEcomBuildr = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Not <span className="text-accent">eComBuildr?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            আমরা জানি—সব টুল সবার জন্য না।<br />
            তাই সোজাসুজি বলি—
          </p>
        </div>

        {/* Not For Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="space-y-6">
            <Card className="p-6 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center mt-1">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    আপনি যদি কোডিং করতে ভালোবাসেন
                  </h3>
                  <p className="text-muted-foreground">
                    নিজে নিজে সার্ভার, প্লাগইন, কাস্টম ডেভেলপমেন্ট করতে চান—<br />
                    <span className="font-medium text-foreground">এইটা আপনার জন্য না।</span>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center mt-1">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    আপনি যদি শুধু ওয়েবসাইট বানাতে চান, বিক্রি না
                  </h3>
                  <p className="text-muted-foreground">
                    আমরা ফোকাস করি conversion ও order flow-এ।<br />
                    <span className="font-medium text-foreground">শুধু ডিজাইন দেখাতে চাইলে অন্য টুল ভালো।</span>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center mt-1">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    আপনি যদি নিজে কিছু করতে না চান
                  </h3>
                  <p className="text-muted-foreground">
                    এই প্ল্যাটফর্ম আপনার কাজ সহজ করে,<br />
                    <span className="font-medium text-foreground">কিন্তু আপনার হয়ে ব্যবসা চালায় না।</span>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="border-t border-border"></div>
        </div>

        {/* But If Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              কিন্তু আপনি যদি—
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card className="p-5 border-success/30 bg-success/5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                  <Check className="h-4 w-4 text-success" />
                </div>
                <p className="text-foreground font-medium">
                  নতুন উদ্যোক্তা হন
                </p>
              </div>
            </Card>

            <Card className="p-5 border-success/30 bg-success/5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                  <Check className="h-4 w-4 text-success" />
                </div>
                <p className="text-foreground font-medium">
                  COD বা অনলাইন প্রোডাক্ট বিক্রি করতে চান
                </p>
              </div>
            </Card>

            <Card className="p-5 border-success/30 bg-success/5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                  <Check className="h-4 w-4 text-success" />
                </div>
                <p className="text-foreground font-medium">
                  টেকনিক্যাল ঝামেলা ছাড়াই অর্ডার চান
                </p>
              </div>
            </Card>

            <Card className="p-5 border-success/30 bg-success/5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                  <Check className="h-4 w-4 text-success" />
                </div>
                <p className="text-foreground font-medium">
                  এক জায়গায় সবকিছু চান
                </p>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold text-foreground mb-6">
              তাহলে eComBuildr আপনার জন্য।
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-muted-foreground">
              <span className="text-lg">👉 ব্যবহার করে দেখুন।</span>
              <span className="text-lg">👉 সিদ্ধান্ত নিজেই নিন।</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
