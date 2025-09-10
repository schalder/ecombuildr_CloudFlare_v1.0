import { SEOHead } from "@/components/SEOHead";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { Users, Target, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen">
      <SEOHead 
        title="About Us - Ecomflex"
        description="Learn about Ecomflex's mission to empower businesses with powerful e-commerce solutions. Discover our story and meet our team."
        keywords={["about ecomflex", "ecommerce platform", "our mission", "our team"]}
      />
      <Navbar />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                About eComBuildr
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                বাংলাদেশি উদ্যোক্তাদের জন্য তৈরি অল-ইন-ওয়ান ই-কমার্স প্ল্যাটফর্ম
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 justify-center mb-12">
                <div className="w-4 h-4 bg-primary rounded-sm"></div>
                <h2 className="text-3xl md:text-4xl font-bold">Our Story</h2>
              </div>
              <div className="text-left space-y-6">
                <p className="text-lg leading-relaxed">
                  <strong>eComBuildr</strong> জন্ম নিয়েছে একটি সহজ প্রশ্ন থেকে—বাংলাদেশে ই-কমার্স ব্যবসা এত দ্রুত বাড়ছে, 
                  কিন্তু কেন এখনো উদ্যোক্তাদেরকে জটিল ওয়েবসাইট, অসংখ্য প্লাগইন আর সার্ভার ম্যানেজমেন্টের ঝামেলায় পড়তে হয়?
                </p>
                <p className="text-lg leading-relaxed">
                  আমরা দেখেছি, শত শত উদ্যোক্তা তাদের সময়, টাকা ও এনার্জি নষ্ট করছেন শুধু ওয়েবসাইট ঠিক রাখতে। 
                  অথচ আসল ফোকাস হওয়া উচিত বিক্রি বাড়ানো ও ব্যবসা বাড়ানো।
                </p>
                <p className="text-lg leading-relaxed">
                  এই সমস্যার সমাধান দিতেই তৈরি হয়েছে <strong>eComBuildr</strong>—বাংলাদেশি উদ্যোক্তাদের জন্য তৈরি একটি 
                  অল-ইন-ওয়ান ই-কমার্স প্ল্যাটফর্ম, যেখানে eCommerce Website/store, Sales Funnel, Landing Page, Product mangement, Order management,Shipping integration —সব একসাথে।
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 justify-center mb-12">
                <div className="w-4 h-4 bg-primary rounded-sm"></div>
                <h2 className="text-3xl md:text-4xl font-bold">Our Mission</h2>
              </div>
              
              <div className="bg-card p-8 rounded-lg shadow-sm mb-8">
                <p className="text-xl font-semibold text-center mb-6">
                  "ই-কমার্স উদ্যোক্তাদের জন্য ব্যবসা শুরু ও পরিচালনাকে সহজ, দ্রুত এবং ঝামেলামুক্ত করা।"
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-start p-6 bg-card rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    👉 আমরা চাই, উদ্যোক্তারা কোডিং বা প্লাগইন আপডেট নিয়ে নয়, বরং ব্যবসা বাড়ানোর দিকে মনোযোগ দিন।
                  </p>
                </div>
                
                <div className="flex flex-col items-start p-6 bg-card rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    👉 আমরা চাই, একজন নতুন উদ্যোক্তা কয়েক মিনিটেই অনলাইন স্টোর চালু করতে পারুক।
                  </p>
                </div>
                
                <div className="flex flex-col items-start p-6 bg-card rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    👉 আমরা চাই, বাংলাদেশের ই-কমার্স ইকোসিস্টেমকে আরও শক্তিশালী করা।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 justify-center mb-8">
                <div className="w-4 h-4 bg-primary rounded-sm"></div>
                <h2 className="text-3xl md:text-4xl font-bold">Meet Our Team</h2>
              </div>
              
              <div className="text-center mb-12 max-w-4xl mx-auto">
                <p className="text-lg text-muted-foreground mb-4">
                  আমাদের টিম গঠিত হয়েছে অভিজ্ঞ টেক এক্সপার্ট, প্রোডাক্ট ডিজাইনার এবং মার্কেটিং স্ট্র্যাটেজিস্টদের নিয়ে।
                </p>
                <p className="text-lg font-medium">
                  আমরা সবাই একটি বিশ্বাসে একত্রিত হয়েছি—বাংলাদেশি উদ্যোক্তাদের হাতে বিশ্বমানের ই-কমার্স টুল তুলে দেওয়া।
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full mx-auto flex items-center justify-center relative overflow-hidden">
                      <Users className="w-12 h-12 text-primary" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Samir Chandra Halder</h3>
                    <p className="text-primary font-medium mb-3">CEO & Founder</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                    একজন অভিজ্ঞ মার্কেটার ও ওয়েবসাইট/ফানেল বিল্ডার। গত ১৪ বছর ধরে তিনি বিশ্বের শত শত ব্যবসাকে তাদের অনলাইন উপস্থিতি সহজ করতে ও বিক্রি বাড়াতে সহায়তা করেছেন।
                    </p>
                  </div>
                </div>
                
                <div className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full mx-auto flex items-center justify-center relative overflow-hidden">
                      <Users className="w-12 h-12 text-primary" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Tasneem Rahman</h3>
                    <p className="text-primary font-medium mb-3">CTO</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      টেক ভিশনারি যিনি স্কেলেবল এবং ইউজার-ফ্রেন্ডলি প্ল্যাটফর্ম তৈরিতে ফোকাসড।
                    </p>
                  </div>
                </div>
                
                <div className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full mx-auto flex items-center justify-center relative overflow-hidden">
                      <Users className="w-12 h-12 text-primary" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Mehedi Hasan</h3>
                    <p className="text-primary font-medium mb-3">Head of Customer Success</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      প্রতিটি কাস্টমার যাতে তাদের ই-কমার্স লক্ষ্য অর্জন করতে পারে সেই বিষয়ে নিবেদিত।
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-12 p-6 bg-primary/5 rounded-lg">
                <p className="text-lg">
                  📌 টিমের প্রতিটি সদস্য প্রতিদিন কাজ করছে আপনাদের ব্যবসাকে আরও সহজ করতে, যাতে 
                  <strong className="text-primary"> eComBuildr</strong> শুধু একটি সফটওয়্যার না হয়ে বরং আপনার বিশ্বস্ত ব্যবসা-সহযোগী হয়ে ওঠে।
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppWidget />
    </div>
  );
};

export default About;