import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { nameWithVariant } from '@/lib/utils';

interface InvoiceData {
  order: any;
  items: any[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: InvoiceData | null;
}

export const InvoiceDialog: React.FC<Props> = ({ open, onOpenChange, data }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const totals = useMemo(() => {
    const subtotal = Number(data?.order?.subtotal ?? 0);
    const shipping = Number(data?.order?.shipping_cost ?? 0);
    const discount = Number(data?.order?.discount_amount ?? 0);
    const total = Number(data?.order?.total ?? subtotal + shipping - discount);
    return { subtotal, shipping, discount, total };
  }, [data]);

  const handlePrint = async () => {
    if (!printRef.current) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Build a clean printable document
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Invoice - ${data?.order?.order_number || ''}</title><style>@page{margin:12mm;} body{background:#fff;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial;} .avoid-break{break-inside:avoid}</style></head><body></body></html>`);
    doc.close();

    // Clone all styles (Tailwind + tokens) into the iframe so it looks identical
    const head = doc.head;
    const sourceStyleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')) as HTMLElement[];
    const loadPromises: Promise<void>[] = [];

    sourceStyleNodes.forEach((node) => {
      const cloned = node.cloneNode(true) as HTMLElement;
      head.appendChild(cloned);
      if (cloned.tagName.toLowerCase() === 'link') {
        const link = cloned as HTMLLinkElement;
        if (!link.sheet) {
          loadPromises.push(new Promise<void>((resolve) => {
            link.addEventListener('load', () => resolve(), { once: true });
            link.addEventListener('error', () => resolve(), { once: true });
          }));
        }
      }
    });

    // Inject invoice HTML
    doc.body.innerHTML = printRef.current.innerHTML;

    // Wait for stylesheets to be ready, then print
    try { await Promise.all(loadPromises); } catch {}

    const win = iframe.contentWindow;
    if (!win) return;

    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 50);
    }, 50);
  };
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 0;

      if (imgHeight < pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      } else {
        let remainingHeight = imgHeight;
        let sourceY = 0;
        const canvasPage = document.createElement("canvas");
        const ctx = canvasPage.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");
        const pageCanvasHeight = Math.floor((canvas.width * pageHeight) / pageWidth);
        canvasPage.width = canvas.width;
        canvasPage.height = pageCanvasHeight;

        while (remainingHeight > 0) {
          ctx.clearRect(0, 0, canvas.width, pageCanvasHeight);
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            pageCanvasHeight,
            0,
            0,
            canvas.width,
            pageCanvasHeight
          );
          const pageData = canvasPage.toDataURL("image/png");
          pdf.addImage(pageData, "PNG", 0, position, imgWidth, pageHeight);
          remainingHeight -= pageHeight;
          sourceY += pageCanvasHeight;
          if (remainingHeight > 0) pdf.addPage();
        }
      }

      pdf.save(`invoice-${data?.order?.order_number || data?.order?.id}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Invoice - #{data?.order?.order_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2 justify-end print:hidden">
            <Button variant="outline" onClick={handlePrint}>Print</Button>
            <Button onClick={handleDownloadPdf} disabled={downloading}>{downloading ? "Generating..." : "Download PDF"}</Button>
          </div>
          <div ref={printRef} className="bg-white text-foreground p-6 rounded border shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Invoice</h2>
                <p className="text-sm text-muted-foreground">Order #{data?.order?.order_number}</p>
                <p className="text-xs text-muted-foreground">Date: {data?.order?.created_at ? new Date(data.order.created_at).toLocaleString() : ""}</p>
              </div>
              <div className="text-right text-sm">
                <div className="font-medium">Customer</div>
                <div>{data?.order?.customer_name}</div>
                <div>{data?.order?.customer_phone}</div>
                <div>{data?.order?.customer_email}</div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium mb-1">Billing / Shipping</div>
                <div>{data?.order?.shipping_address}</div>
                <div>{data?.order?.shipping_city}{data?.order?.shipping_area ? `, ${data?.order?.shipping_area}` : ''}</div>
              </div>
              <div>
                <div className="font-medium mb-1">Payment</div>
                <div className="capitalize">{data?.order?.payment_method}</div>
                {data?.order?.notes && (
                  <div className="mt-2">
                    <div className="font-medium">Notes</div>
                    <div className="text-muted-foreground">{data?.order?.notes}</div>
                  </div>
                )}
              </div>
            </div>
            {(() => {
              if (Array.isArray(data?.order?.custom_fields)) {
                const filteredFields = data.order.custom_fields.filter((cf: any) => 
                  (cf.label || cf.id)?.toLowerCase() !== 'order_access_token'
                );
                return filteredFields.length > 0 && (
                  <div className="mt-4 text-sm">
                    <div className="font-medium mb-1">Additional Information</div>
                    <div className="space-y-1">
                      {filteredFields.map((cf: any, i: number) => (
                        <div key={i}><strong>{cf.label || cf.id}:</strong> {String(cf.value)}</div>
                      ))}
                    </div>
                  </div>
                );
              } else if (data?.order?.custom_fields) {
                const filteredEntries = Object.entries(data.order.custom_fields).filter(([k]) => 
                  k.toLowerCase() !== 'order_access_token'
                );
                return filteredEntries.length > 0 && (
                  <div className="mt-4 text-sm">
                    <div className="font-medium mb-1">Additional Information</div>
                    <div className="space-y-1">
                      {filteredEntries.map(([k, v]: any) => (
                        <div key={k}><strong>{k}:</strong> {String(v)}</div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            <Separator className="my-4" />
            <div>
              <div className="font-medium mb-2">Items</div>
              <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              <div className="mt-1 space-y-1 text-sm">
                {data?.items?.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12">
                    <div className="col-span-6">{nameWithVariant(it.product_name, (it as any).variation)}</div>
                    <div className="col-span-2 text-right">৳{Number(it.price).toFixed(2)}</div>
                    <div className="col-span-2 text-right">{it.quantity}</div>
                    <div className="col-span-2 text-right">৳{Number(it.total).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="ml-auto w-64 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>৳{totals.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>৳{totals.shipping.toFixed(2)}</span></div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>- ৳{totals.discount.toFixed(2)}</span></div>
                )}
                <Separator />
                <div className="flex justify-between font-bold"><span>Total</span><span>৳{totals.total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
