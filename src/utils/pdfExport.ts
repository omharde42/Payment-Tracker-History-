import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "@/types/transaction";
import { format } from "date-fns";

export function exportToPDF(transactions: Transaction[], monthYear: string) {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text("Finance Tracker Report", 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Month: ${monthYear}`, 14, 30);
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, 14, 37);

  // Calculate totals
  const totalGiven = transactions
    .filter((t) => t.type === "given")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalTaken = transactions
    .filter((t) => t.type === "taken")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalLeftToGive = transactions
    .filter((t) => t.type === "left_to_give")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalPending = transactions.reduce((sum, t) => sum + t.pendingAmount, 0);

  // Add summary
  doc.setFontSize(10);
  doc.text(`Total Given: ₹${totalGiven.toFixed(2)}`, 14, 47);
  doc.text(`Total Taken: ₹${totalTaken.toFixed(2)}`, 14, 53);
  doc.text(`Left to Give: ₹${totalLeftToGive.toFixed(2)}`, 70, 47);
  doc.text(`Total Pending: ₹${totalPending.toFixed(2)}`, 70, 53);

  // Prepare table data
  const tableData = transactions.map((transaction) => {
    const date = new Date(transaction.date);
    const createdAt = new Date(transaction.createdAt);
    
    return [
      format(date, "dd MMM yyyy"),
      format(createdAt, "hh:mm a"),
      transaction.personName,
      transaction.type === "given" ? "Given" : transaction.type === "taken" ? "Taken" : "Left to Give",
      `₹${transaction.amount.toFixed(2)}`,
      `₹${transaction.pendingAmount.toFixed(2)}`,
      transaction.pendingAmount === 0 ? "✅" : "❌",
      transaction.note || "-",
    ];
  });

  // Add table
  autoTable(doc, {
    startY: 60,
    head: [["Date", "Time", "Person", "Type", "Amount", "Pending", "Status", "Note"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [45, 138, 129], // Teal color
      textColor: 255,
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 30 },
      3: { cellWidth: 18 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 15 },
      7: { cellWidth: 'auto' },
    },
  });

  // Save PDF
  const fileName = `finance-tracker-${monthYear.replace(" ", "-")}.pdf`;
  doc.save(fileName);
}
