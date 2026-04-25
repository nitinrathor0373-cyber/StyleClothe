import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { jsPDF } from 'jspdf';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
}

export const generateInvoicePDF = (order: any, customerProfile?: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('STYLECLOTHES', 20, 30);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PREMIUM CLOTHING ARCHIVE', 20, 37);
  
  doc.setFontSize(12);
  doc.text('INVOICE / RECORD', pageWidth - 60, 30);
  doc.setFontSize(10);
  doc.text(`ID: ${order.id.toUpperCase()}`, pageWidth - 60, 37);
  
  doc.line(20, 45, pageWidth - 20, 45);
  
  // Customer & Order Info
  doc.setFont('helvetica', 'bold');
  doc.text('SHIP TO:', 20, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(customerProfile?.displayName || 'Style Member', 20, 67);
  doc.text(order.shippingAddress || 'No address provided', 20, 74, { maxWidth: 80 });

  if (order.location) {
    const lat = order.location.lat;
    const lng = order.location.lng;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 20, 84);
    doc.setTextColor(0, 0, 255);
    doc.textWithLink('Link: Open in Google Maps', 20, 89, { url: `https://www.google.com/maps?q=${lat},${lng}` });
    doc.setTextColor(0);
    doc.setFontSize(10);
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER DETAILS:', pageWidth - 80, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, pageWidth - 80, 67);
  doc.text(`Status: ${order.status.toUpperCase()}`, pageWidth - 80, 74);
  doc.text(`Payment: ${order.paymentStatus.toUpperCase()}`, pageWidth - 80, 81);
  
  // Table Header
  let y = 100;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y, pageWidth - 40, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM DESCRIPTION', 25, y + 7);
  doc.text('QTY', pageWidth - 70, y + 7);
  doc.text('PRICE', pageWidth - 50, y + 7);
  doc.text('TOTAL', pageWidth - 35, y + 7);
  
  // Items
  doc.setFont('helvetica', 'normal');
  y += 18;
  order.items.forEach((item: any) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${item.name} (${item.size}${item.color ? ` / ${item.color}` : ''})`, 25, y);
    doc.text(`${item.quantity}`, pageWidth - 68, y);
    doc.text(`${item.price}`, pageWidth - 50, y);
    doc.text(`${item.price * item.quantity}`, pageWidth - 35, y); 
    y += 10;
  });
  
  // Totals
  y += 10;
  doc.line( pageWidth - 80, y, pageWidth - 20, y);
  y += 10;
  
  const subtotal = order.totalAmount;
  const gst = Math.round(subtotal * 0.12);
  
  doc.text('Subtotal:', pageWidth - 80, y);
  doc.text(`${subtotal}`, pageWidth - 25, y, { align: 'right' });
  
  y += 8;
  doc.text('GST (12% Incl):', pageWidth - 80, y);
  doc.text(`${gst}`, pageWidth - 25, y, { align: 'right' });
  
  y += 12;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL:', pageWidth - 80, y);
  doc.text(`${subtotal}`, pageWidth - 25, y, { align: 'right' });
  
  // Footer
  y = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('PAYMENT VIA UPI: styleclothes@upi', pageWidth / 2, y, { align: 'center' });
  doc.text('StyleClothes Compliance // Generated System Record', pageWidth / 2, y + 5, { align: 'center' });
  
  return doc;
};
