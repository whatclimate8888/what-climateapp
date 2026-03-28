"use client";

import { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type QuoteData = {
  quoteNumber: string;
  date: string;
  preparedBy: string;
  customerName: string;
  siteAddress: string;
  description: string;
  note: string;
  totalPrice: string;
  vatRate: 0 | 20;
};

const COMPANY = {
  name: "WHAT CLIMATE LIMITED",
  address1: "8 THE DALES",
  address2: "HARWICH, ESSEX",
  address3: "CO12 4XH",
  mobile: "07544176555",
  phone: "01255 520 312",
  email: "luke@whatclimate.co.uk",
  companyNumber: "11063787",
  vatNumber: "398712154",
  utr: "8171026093",
};

export default function QuotePreviewPage() {
  const [quote, setQuote] = useState<QuoteData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("what-climate-current-quote");
    if (saved) {
      setQuote(JSON.parse(saved));
    }
  }, []);

  const downloadPDF = async () => {
    const element = document.getElementById("quote-pdf");
    if (!element || !quote) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfDoc = new jsPDF("p", "mm", "a4");

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdfDoc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdfDoc.save(`quote-${quote.quoteNumber}.pdf`);
  };

  if (!quote) {
    return <p style={{ padding: 20 }}>No quote data found.</p>;
  }

  return (
    <div style={page}>
      <button
        onClick={() => (window.location.href = "/")}
        style={backBtn}
      >
        ← Back
      </button>

      <button onClick={downloadPDF} style={downloadBtn}>
        Download PDF
      </button>

      <div id="quote-pdf" style={pdf}>
        <div style={header}>
          <div style={logoWrap}>
            <img src="/logo.png" alt="What Climate" style={logoImg} />
          </div>

          <div style={company}>
            <div>{COMPANY.name}</div>
            <div>{COMPANY.address1}</div>
            <div>{COMPANY.address2}</div>
            <div>{COMPANY.address3}</div>

            <div style={{ marginTop: 10 }}>{COMPANY.mobile}</div>
            <div>{COMPANY.phone}</div>

            <div style={{ marginTop: 10, color: "blue" }}>
              {COMPANY.email}
            </div>
          </div>
        </div>

        <h1 style={title}>Quotation</h1>

        <div style={metaBox}>
          <div>
            <strong>Company Number:</strong> {COMPANY.companyNumber}
          </div>
          <div>
            <strong>VAT Number:</strong> {COMPANY.vatNumber}
          </div>
          <div>
            <strong>UTR:</strong> {COMPANY.utr}
          </div>
        </div>

        <div style={row}>
          <div style={{ width: "45%" }}>
            <div style={boxHeader}>Customer Details</div>
            <div>{quote.customerName}</div>
          </div>

          <div style={{ width: "45%" }}>
            <div style={boxHeader}>Site Details</div>
            <div>{quote.siteAddress}</div>
          </div>
        </div>

        <div style={bar}>QUOTE: {quote.quoteNumber}</div>

        <div style={{ marginTop: 20 }}>
          <div>
            <strong>Date:</strong> {quote.date}
          </div>
          <div>
            <strong>Prepared by:</strong> {quote.preparedBy}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={boxHeader}>Description</div>
          <div style={descBox}>
            <div>{quote.description}</div>
            {quote.note ? <div style={{ marginTop: 12 }}>{quote.note}</div> : null}
          </div>
        </div>

        <div style={total}>
          £{quote.totalPrice} {quote.vatRate === 20 ? "+ VAT" : "0% VAT"}
        </div>
      </div>
    </div>
  );
}

/* STYLES */
const page: React.CSSProperties = {
  background: "#eee",
  padding: 40,
};

const pdf: React.CSSProperties = {
  background: "#fff",
  padding: 40,
  maxWidth: 794,
  minHeight: 1123,
  margin: "20px auto",
  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
};

const backBtn: React.CSSProperties = {
  marginBottom: 10,
  marginRight: 10,
  padding: "8px 12px",
  background: "#ddd",
  color: "#000",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const downloadBtn: React.CSSProperties = {
  marginBottom: 20,
  padding: "10px 16px",
  background: "#f97316",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const company: React.CSSProperties = {
  textAlign: "right",
};

const title: React.CSSProperties = {
  textAlign: "center",
  color: "#4bb5e8",
  fontSize: 42,
  fontWeight: "bold",
  marginTop: 28,
  marginBottom: 10,
};

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 20,
};

const boxHeader: React.CSSProperties = {
  background: "#d1d1d1",
  padding: 8,
  fontWeight: "bold",
  marginBottom: 8,
};

const bar: React.CSSProperties = {
  background: "#d1d1d1",
  padding: 12,
  marginTop: 20,
  fontWeight: "bold",
  fontSize: 16,
};

const descBox: React.CSSProperties = {
  border: "1px dashed #ccc",
  padding: 12,
  minHeight: 140,
  lineHeight: 1.6,
};

const total: React.CSSProperties = {
  textAlign: "right",
  marginTop: 40,
  fontSize: 22,
  fontWeight: "bold",
};

const metaBox: React.CSSProperties = {
  textAlign: "center",
  marginTop: 20,
  marginBottom: 30,
  lineHeight: 1.9,
  fontSize: 14,
};

const logoWrap: React.CSSProperties = {
  width: 220,
  height: 60,
  display: "flex",
  alignItems: "center",
};

const logoImg: React.CSSProperties = {
  width: 220,
  height: "auto",
  display: "block",
};