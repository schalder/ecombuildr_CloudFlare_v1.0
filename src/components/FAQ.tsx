import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    question: "কোডিং না জানলেও কি আমি নিজের ই-কমার্স সাইট বানাতে পারবো?",
    answer: "অবশ্যই পারবেন! আমাদের ড্র্যাগ-এন্ড-ড্রপ বিল্ডার আর তৈরি টেমপ্লেট ব্যবহার করে একদম কোড ছাড়া সাইট বানিয়ে ফেলুন। ডোমেইন কানেক্ট করুন, চেকআউট ও শিপিং সেট করুন—তারপর বিক্রি শুরু করে দিন।"
  },
  {
    question: "ল্যান্ডিং পেজ টেমপ্লেট কি বাংলায় পাওয়া যাবে?",
    answer: "হ্যাঁ, নিশ্চয়ই! আমাদের টেমপ্লেটগুলো বাংলা-রেডি। আপনি চাইলে লেখাগুলো নিজে এডিট করতে পারবেন, এমনকি নতুন কন্টেন্ট যোগ করতে বা রিমুভ করতে পারবেন ।"
  },
  {
    question: "সেলস ফানেল আবার কী জিনিস?",
    answer: "সেলস ফানেল মানে হলো এমন কিছু পেজের সিকোয়েন্স—ল্যান্ডিং → চেকআউট → Post Purchase অফার—যা গ্রাহককে ধাপে ধাপে গাইড করে কেনাকাটা শেষ করতে। এর ফলে কনভার্সন বাড়ে আর অর্ডারের ভ্যালুও বাড়ে।"
  },
  {
    question: "অর্ডার বাম্প আর ওয়ান-ক্লিক আপসেল/ডাউনসেল বলতে কী বোঝায়?",
    answer: "অর্ডার বাম্প হলো চেকআউট পেজে দেওয়া ছোট্ট একটা অ্যাড-অন অফার। আর ওয়ান-ক্লিক আপসেল/ডাউনসেল হলো পেমেন্টের পর গ্রাহককে দেওয়া অফার, যা এক ক্লিকেই নেওয়া যাবে—কোনো ঝামেলা ছাড়া।"
  },
  {
    question: "একাধিক আপসেল ও ডাউনসেল যোগ করা যাবে?",
    answer: "হ্যাঁ, পারবেন। যত খুশি আপসেল ও ডাউনসেল চেইন করতে পারবেন চেকআউটের পর। প্রতিটি অফার কাস্টমাইজ করা যাবে আর পারফরম্যান্সও ট্র্যাক করা যাবে।"
  },
  {
    question: "আলাদা হোস্টিং কিনতে হবে? বা ওয়ার্ডপ্রেস প্লাগইন ইন্সটল করতে হবে?",
    answer: "না, এসব ঝামেলা নেই। আমাদের সিস্টেমেই সবকিছু হোস্টেড থাকে—অটো SSL, ফাস্ট লোডিং, সিকিউরিটি সব রেডি।"
  },
  {
    question: "ল্যান্ডিং পেজ কত দ্রুত পাবলিশ করা যাবে?",
    answer: "মাত্র কয়েক মিনিটে! টেমপ্লেট সিলেক্ট করুন, নিজের মতো কাস্টমাইজ করুন আর মোবাইল-অপ্টিমাইজড পেজ সাথে সাথেই লাইভ করুন।"
  },
  {
    question: "কাস্টম ডোমেইন কানেক্ট করা কতটা সহজ?",
    answer: "খুবই সহজ। গাইডলাইন ফলো করে DNS সেট করুন, বাকি সব—SSL থেকে HTTPS রিডিরেক্ট—আমরা হ্যান্ডেল করবো।"
  },
  {
    question: "গ্রাহকদের জন্য চেকআউট কতটা স্মুথ?",
    answer: "ওয়ান-পেজ চেকআউট, গেস্ট অপশন, একাধিক পেমেন্ট মেথড আর শিপিং অপশন—সবকিছুই ফাস্ট ও ইজি।"
  },
  {
    question: "সাইট কি ফাস্ট ও সিকিউর থাকবে?",
    answer: "অবশ্যই। আমাদের মডার্ন স্ট্যাকে হোস্টেড, অটো SSL আর গ্লোবাল ডেলিভারি সাপোর্ট—সব মিলিয়ে পারফরম্যান্স নিয়ে কোনো দুশ্চিন্তা নেই।"
  },
  {
    question: "SEO কি হেল্প করবে?",
    answer: "হ্যাঁ। মেটা টাইটেল, ডেসক্রিপশন, সোশ্যাল ইমেজ, সাইটম্যাপ—সব ম্যানেজ করতে পারবেন। দ্রুত লোডিং আর ক্লিন URL এর কারণে সার্চ র‌্যাংকিংও ভালো হবে।"
  },
  {
    question: "ট্রেনিং ও সাপোর্ট কি পাবো?",
    answer: "হ্যাঁ, পাবেন। ই-কমার্স গ্রোথ ট্রেনিং, মার্কেটিং কোর্স, লাইভ ওয়ার্কশপ, কমিউনিটি সাপোর্ট—সব একসাথে।"
  }
];

export const FAQ = () => {
  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            আপনার সবচেয়ে গুরুত্বপুর্ন প্রশ্নগুলোর উত্তর পাবেন এখানে
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqData.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-primary text-base font-medium py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};