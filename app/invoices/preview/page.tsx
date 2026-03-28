"use client";

import { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type InvoiceData = {
  id: string;
  customer: string;
  customerEmail: string;
  siteAddress: string;
  description: string;
  createdAt: string;
  status: "Unpaid" | "Paid";
  invoiceVatRate: 0 | 20;
  applyReverseVat: boolean;
  applyCis: boolean;
  subtotalAmount: string;
  materialsAmount: string;
  labourAmount: string;
  cisDeductionAmount: string;
  poNumber: string;
  upgradedJobNumber: string;
  paymentTerms: string;
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

  const subtotal = invoice.applyCis
    ? toNumber(invoice.materialsAmount) + toNumber(invoice.labourAmount)
    : toNumber(invoice.subtotalAmount);

  const vat =
    invoice.applyReverseVat || invoice.invoiceVatRate === 0
      ? 0
      : subtotal * (invoice.invoiceVatRate / 100);

  const cisDeduction = invoice.applyCis
    ? toNumber(invoice.cisDeductionAmount)
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
            <div>{invoice.siteAddress}</div>
            <div>{invoice.customerEmail}</div>
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
            <div>
              <strong>Upgraded Job No:</strong>{" "}
              {invoice.upgradedJobNumber || "None"}
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
            {invoice.applyCis ? (
              <>
                <div style={summaryRow}>
                  <span>Materials</span>
                  <span>{formatMoney(toNumber(invoice.materialsAmount))}</span>
                </div>
                <div style={summaryRow}>
                  <span>Labour</span>
                  <span>{formatMoney(toNumber(invoice.labourAmount))}</span>
                </div>
              </>
            ) : null}

            <div style={summaryRow}>
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>

            <div style={summaryRow}>
              <span>
                VAT{" "}
                {invoice.applyReverseVat
                  ? "(Reverse Charge)"
                  : `(${invoice.invoiceVatRate}%)`}
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

        {invoice.applyReverseVat ? (
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
const page: React.CSSProperties = {
  background: "#eee",
  padding: 40,
};

const actionBar: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  marginBottom: 10,
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
  padding: "8px 12px",
  background: "#ddd",
  color: "#000",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const downloadBtn: React.CSSProperties = {
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
  marginTop: 24,
  fontWeight: "bold",
  fontSize: 16,
};

const descBox: React.CSSProperties = {
  border: "1px dashed #ccc",
  padding: 12,
  minHeight: 140,
  lineHeight: 1.6,
};

const metaBox: React.CSSProperties = {
  textAlign: "center",
  marginTop: 20,
  marginBottom: 30,
  lineHeight: 1.9,
  fontSize: 14,
};

const noteBox: React.CSSProperties = {
  marginTop: 24,
  padding: 12,
  background: "#f7f7f7",
  borderLeft: "4px solid #f97316",
  lineHeight: 1.6,
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

const totalsWrap: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 24,
};

const summaryTable: React.CSSProperties = {
  width: 320,
};

const summaryRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  fontSize: 18,
};

const summaryGrandTotal: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 14,
  paddingTop: 14,
  borderTop: "2px solid #bbb",
  fontSize: 30,
  fontWeight: "bold",
};
const paymentBox: React.CSSProperties = {
  marginTop: 30,
  padding: 16,
  background: "#f7f7f7",
  borderRadius: 8,
  lineHeight: 1.8,
};

const paymentTitle: React.CSSProperties = {
  fontWeight: "bold",
  marginBottom: 8,
  fontSize: 16,
};
const statusText: React.CSSProperties = {
  marginTop: 40,
  fontSize: 13,
  color: "#555",
};