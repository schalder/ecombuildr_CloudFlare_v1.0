import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.open();
    win.document.write(`
      <html>
        <head>
          <title>Invoice - ${data?.order?.order_number || ''}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            @page { margin: 12mm; }
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; color: #000; }
            .avoid-break { break-inside: avoid; }
            .totals { width: 256px; margin-left: auto; }
            hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
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
            {Array.isArray(data?.order?.custom_fields) && data?.order?.custom_fields?.length > 0 && (
              <div className="mt-4 text-sm">
                <div className="font-medium mb-1">Additional Information</div>
                <div className="space-y-1">
                  {data!.order!.custom_fields.map((cf: any, i: number) => (
                    <div key={i}><strong>{cf.label || cf.id}:</strong> {String(cf.value)}</div>
                  ))}
                </div>
              </div>
            )}
            {!Array.isArray(data?.order?.custom_fields) && data?.order?.custom_fields && (
              <div className="mt-4 text-sm">
                <div className="font-medium mb-1">Additional Information</div>
                <div className="space-y-1">
                  {Object.entries(data!.order!.custom_fields).map(([k, v]: any) => (
                    <div key={k}><strong>{k}:</strong> {String(v)}</div>
                  ))}
                </div>
              </div>
            )}
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
                    <div className="col-span-6">{it.product_name}</div>
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
