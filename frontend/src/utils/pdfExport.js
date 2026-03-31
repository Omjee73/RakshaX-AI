import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportNodeAsPdf(node, fileName = "RakshaX-AI-Analysis-Report.pdf") {
  const canvas = await html2canvas(node, { scale: 2 });
  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  pdf.setProperties({
    title: "RakshaX AI Analysis Report",
    subject: "Scam analysis report",
    author: "RakshaX AI"
  });

  const pageWidth = 210;
  const margin = 10;
  const width = pageWidth - margin * 2;
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(imageData, "PNG", margin, margin, width, height);
  pdf.save(fileName);
}
