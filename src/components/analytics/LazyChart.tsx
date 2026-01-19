import { lazy, Suspense, useState, useEffect } from 'react';

/**
 * LazyChart - Lazy loads recharts library to reduce initial bundle size
 * 
 * This hook provides lazy-loaded recharts components. The library is only
 * loaded when charts are actually rendered, improving initial page load performance.
 * 
 * @example
 * const Recharts = useLazyRecharts();
 * if (!Recharts) return <div>Loading...</div>;
 * 
 * return (
 *   <Recharts.ResponsiveContainer width="100%" height={300}>
 *     <Recharts.LineChart data={data}>
 *       <Recharts.Line type="monotone" dataKey="value" />
 *     </Recharts.LineChart>
 *   </Recharts.ResponsiveContainer>
 * );
 */
export const useLazyRecharts = () => {
  const [recharts, setRecharts] = useState<typeof import('recharts') | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('recharts')
      .then(module => {
        setRecharts(module);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { recharts, loading };
};

/**
 * LazyPDF - Lazy loads html2canvas and jspdf libraries
 * 
 * @example
 * const { generatePDF, loading } = useLazyPDF();
 * await generatePDF(elementRef.current);
 */
export const useLazyPDF = () => {
  const [loading, setLoading] = useState(false);

  const generatePDF = async (element: HTMLElement | null, filename: string = 'document.pdf') => {
    if (!element) return;
    
    setLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: "#ffffff" 
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      
      while (position < imgHeight - pageHeight) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      }
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { generatePDF, loading };
};
