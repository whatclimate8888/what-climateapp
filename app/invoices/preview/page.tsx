"use client";

import { useEffect, useState, type CSSProperties } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type InvoiceData = {
  id: string;
  quoteId: string;

  customer: string;
  customerAddress: string;

  siteName: string;
  siteAddress: string;

  description: string;
  createdAt: string;

  vatRate: 0 | 20;
  reverseVat: boolean;
  applyCis: boolean;

  materials: string;
  labour: string;
  cisPercent: number;

  paymentTerms: string;
  poNumber?: string;

  status: "Unpaid" | "Paid";
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

const toNumber = (value: string) => Number(value || 0);

const formatMoney = (value: number) =>
  `£${value.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function InvoicePreviewPage() {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("what-climate-current-invoice");
    if (saved) {
      setInvoice(JSON.parse(saved));
    }
  }, []);

  const downloadPDF = async () => {
    const element = document.getElementById("invoice-pdf");
    if (!element || !invoice) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfDoc = new jsPDF("p", "mm", "a4");

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdfDoc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdfDoc.save(`${invoice.customer}-${invoice.id}-${invoice.createdAt}.pdf`);
  };

  if (!invoice) {
    return <p style={{ padding: 20 }}>No invoice data found.</p>;
  }

  const materialsValue = toNumber(invoice.materials);
  const labourValue = toNumber(invoice.labour);

  const subtotal = materialsValue + labourValue;

  const vat =
    invoice.reverseVat || invoice.vatRate === 0
      ? 0
      : subtotal * (invoice.vatRate / 100);

  const cisDeduction = invoice.applyCis
    ? labourValue * (invoice.cisPercent / 100)
    : 0;

  const total = subtotal + vat - cisDeduction;

  return (
    <div style={page}>
      <div style={actionBar}>
        <button
          onClick={() => (window.location.href = "/")}
          style={backBtn}
        >
          ← Back
        </button>

        <button onClick={downloadPDF} style={downloadBtn}>
          Download PDF
        </button>
      </div>

      <div id="invoice-pdf" style={pdf}>
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

        <h1 style={title}>Invoice</h1>

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
            <div>{invoice.customer}</div>
            <div>{invoice.customerAddress || "No address"}</div>
          </div>

          <div style={{ width: "45%" }}>
            <div style={boxHeader}>Invoice Details</div>
            <div>
              <strong>Invoice No:</strong> {invoice.id}
            </div>
            <div>
              <strong>Date:</strong> {invoice.createdAt}
            </div>
            <div>
              <strong>Payment Terms:</strong> {invoice.paymentTerms || "None"}
            </div>
            <div>
              <strong>PO / Order No:</strong> {invoice.poNumber || "None"}
            </div>
          </div>
        </div>

        <div style={bar}>DESCRIPTION</div>

        <div style={{ marginTop: 16 }}>
          <div style={descBox}>{invoice.description}</div>
        </div>

        <div style={bar}>TOTALS</div>

        <div style={totalsWrap}>
          <div style={summaryTable}>
            <div style={summaryRow}>
              <span>Materials</span>
              <span>{formatMoney(materialsValue)}</span>
            </div>

            <div style={summaryRow}>
              <span>Labour</span>
              <span>{formatMoney(labourValue)}</span>
            </div>

            <div style={summaryRow}>
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>

            <div style={summaryRow}>
              <span>
                VAT {invoice.reverseVat ? "(Reverse Charge)" : `(${invoice.vatRate}%)`}
              </span>
              <span>{formatMoney(vat)}</span>
            </div>

            {invoice.applyCis ? (
              <div style={summaryRow}>
                <span>CIS Deduction</span>
                <span>-{formatMoney(cisDeduction)}</span>
              </div>
            ) : null}

            <div style={summaryGrandTotal}>
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </div>

        {invoice.reverseVat ? (
          <div style={noteBox}>
            <strong>Reverse VAT Charge:</strong> Customer to account to HMRC
            for the reverse charge output tax on the VAT rate.
          </div>
        ) : null}

        {invoice.applyCis ? (
          <div style={noteBox}>
            <strong>CIS Deduction Applied:</strong> This invoice includes a CIS
            deduction.
          </div>
        ) : null}

        <div style={paymentBox}>
          <div style={paymentTitle}>Payment Details</div>
          <div>Bank: Lloyds Bank</div>
          <div>Account Name: What Climate Limited</div>
          <div>Sort Code: 30-96-26</div>
          <div>Account Number: 34584360</div>
        </div>

        <div style={statusText}>Status: {invoice.status}</div>
      </div>
    </div>
  );
}

/* STYLES */
const page: CSSProperties = {
  background: "#eee",
  padding: 40,
};

const actionBar: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  marginBottom: 10,
};

const pdf: CSSProperties = {
  background: "#fff",
  padding: 40,
  maxWidth: 794,
  minHeight: 1123,
  margin: "20px auto",
  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
};

const backBtn: CSSProperties = {
  padding: "8px 12px",
  background: "#ddd",
  color: "#000",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const downloadBtn: CSSProperties = {
  padding: "10px 16px",
  background: "#f97316",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const header: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const company: CSSProperties = {
  textAlign: "right",
};

const title: CSSProperties = {
  textAlign: "center",
  color: "#4bb5e8",
  fontSize: 42,
  fontWeight: "bold",
  marginTop: 28,
  marginBottom: 10,
};

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 20,
};

const boxHeader: CSSProperties = {
  background: "#d1d1d1",
  padding: 8,
  fontWeight: "bold",
  marginBottom: 8,
};

const bar: CSSProperties = {
  background: "#d1d1d1",
  padding: 12,
  marginTop: 24,
  fontWeight: "bold",
  fontSize: 16,
};

const descBox: CSSProperties = {
  border: "1px dashed #ccc",
  padding: 12,
  minHeight: 140,
  lineHeight: 1.6,
};

const metaBox: CSSProperties = {
  textAlign: "center",
  marginTop: 20,
  marginBottom: 30,
  lineHeight: 1.9,
  fontSize: 14,
};

const noteBox: CSSProperties = {
  marginTop: 24,
  padding: 12,
  background: "#f7f7f7",
  borderLeft: "4px solid #f97316",
  lineHeight: 1.6,
};

const logoWrap: CSSProperties = {
  width: 220,
  height: 60,
  display: "flex",
  alignItems: "center",
};

const logoImg: CSSProperties = {
  width: 220,
  height: "auto",
  display: "block",
};

const totalsWrap: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 24,
};

const summaryTable: CSSProperties = {
  width: 320,
};

const summaryRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  fontSize: 18,
};

const summaryGrandTotal: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 14,
  paddingTop: 14,
  borderTop: "2px solid #bbb",
  fontSize: 30,
  fontWeight: "bold",
};

const paymentBox: CSSProperties = {
  marginTop: 30,
  padding: 16,
  background: "#f7f7f7",
  borderRadius: 8,
  lineHeight: 1.8,
};

const paymentTitle: CSSProperties = {
  fontWeight: "bold",
  marginBottom: 8,
  fontSize: 16,
};

const statusText: CSSProperties = {
  marginTop: 40,
  fontSize: 13,
  color: "#555",
};
