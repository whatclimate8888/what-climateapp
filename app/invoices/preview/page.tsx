"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type InvoiceData = {
  id: string;
  quoteId: string;
  customer: string;
  customerAddress: string;
  customerEmail?: string;
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
  const [isMobile, setIsMobile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("what-climate-current-invoice");
    if (saved) {
      setInvoice(JSON.parse(saved));
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const totals = useMemo(() => {
    if (!invoice) {
      return {
        materialsValue: 0,
        labourValue: 0,
        subtotal: 0,
        vat: 0,
        cisDeduction: 0,
        total: 0,
      };
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

    return {
      materialsValue,
      labourValue,
      subtotal,
      vat,
      cisDeduction,
      total,
    };
  }, [invoice]);

  const downloadPDF = async () => {
  const element = document.getElementById("invoice-pdf");
  if (!element || !invoice) return;

  try {
    setIsDownloading(true);

    const canvas = await html2canvas(element, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfDoc = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 6;

    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    // 🔥 KEY PART: scale to ALWAYS fit ONE page
    const ratio = Math.min(
  usableWidth / canvas.width,
  usableHeight / canvas.height
) * 1.08;

    const finalWidth = canvas.width * ratio;
    const finalHeight = canvas.height * ratio;

    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    pdfDoc.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);

    pdfDoc.save(
      `${invoice.customer}-${invoice.id}-${invoice.createdAt}.pdf`
    );
  } finally {
    setIsDownloading(false);
  }
};

  if (!invoice) {
    return <p style={{ padding: 20 }}>No invoice data found.</p>;
  }

  const responsivePage: CSSProperties = {
    ...page,
    padding: isMobile ? 12 : 24,
  };

  const responsiveActionBar: CSSProperties = {
    ...actionBar,
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
  };

  const responsivePdf: CSSProperties = {
  ...pdf,
  padding: isMobile ? 18 : 24,
  margin: isMobile ? "0 auto 20px" : "20px auto",
  minHeight: "auto",
  borderRadius: isMobile ? 12 : 0,
};

  const responsiveHeader: CSSProperties = {
    ...header,
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? 18 : 24,
    alignItems: "flex-start",
  };

  const responsiveCompany: CSSProperties = {
    ...company,
    textAlign: isMobile ? "left" : "right",
    width: isMobile ? "100%" : "auto",
  };

  const responsiveTitle: CSSProperties = {
    ...title,
    fontSize: isMobile ? 28 : 42,
    marginTop: isMobile ? 22 : 28,
    marginBottom: isMobile ? 14 : 10,
  };

  const responsiveRow: CSSProperties = {
    ...row,
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? 14 : 24,
  };

  const responsiveBox: CSSProperties = {
    ...infoBox,
    width: "100%",
  };

  const responsiveMetaBox: CSSProperties = {
    ...metaBox,
    textAlign: isMobile ? "left" : "center",
    fontSize: isMobile ? 13 : 14,
    marginTop: isMobile ? 18 : 20,
    marginBottom: isMobile ? 22 : 30,
  };

  const responsiveTotalsWrap: CSSProperties = {
    ...totalsWrap,
    justifyContent: isMobile ? "stretch" : "flex-end",
  };

  const responsiveSummaryTable: CSSProperties = {
    ...summaryTable,
    width: isMobile ? "100%" : 360,
  };

  return (
    <div style={responsivePage}>
      <div style={responsiveActionBar}>
        <button onClick={() => (window.location.href = "/")} style={backBtn}>
          ← Back
        </button>

        <button onClick={downloadPDF} style={downloadBtn} disabled={isDownloading}>
          {isDownloading ? "Preparing PDF..." : "Download PDF"}
        </button>
      </div>

      <div id="invoice-pdf" style={responsivePdf}>
        <div style={responsiveHeader}>
          <div style={logoWrap}>
            <img src="/logo.png" alt="What Climate" style={logoImg} />
          </div>

          <div style={responsiveCompany}>
            <div style={companyName}>{COMPANY.name}</div>
            <div>{COMPANY.address1}</div>
            <div>{COMPANY.address2}</div>
            <div>{COMPANY.address3}</div>

            <div style={{ marginTop: 10 }}>{COMPANY.mobile}</div>
            <div>{COMPANY.phone}</div>

            <div style={{ marginTop: 10, color: "#2563eb", wordBreak: "break-word" }}>
              {COMPANY.email}
            </div>
          </div>
        </div>

        <h1 style={responsiveTitle}>Invoice</h1>

        <div style={responsiveMetaBox}>
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

                <div style={invoiceInfoBar}>
          <div>
            <strong>Invoice No:</strong> {invoice.id}
          </div>
          <div>
            <strong>Date:</strong> {invoice.createdAt}
          </div>
        </div>

        <div style={responsiveRow}>
          <div style={responsiveBox}>
            <div style={boxHeader}>Customer Details</div>
            <div style={boxBody}>
              <div>{invoice.customer || "Not provided"}</div>
              <div style={{ whiteSpace: "pre-wrap" }}>
                {invoice.customerAddress || "No address"}
              </div>
              {invoice.customerEmail ? <div>{invoice.customerEmail}</div> : null}
            </div>
          </div>

          <div style={responsiveBox}>
            <div style={boxHeader}>Site Details</div>
            <div style={boxBody}>
              <div>{invoice.siteName || "Not provided"}</div>
              <div style={{ whiteSpace: "pre-wrap" }}>
                {invoice.siteAddress || "No address"}
              </div>
            </div>
          </div>
        </div>

        <div style={responsiveRow}>
          <div style={responsiveBox}>
            <div style={boxHeader}>Invoice Details</div>
            <div style={boxBody}>
              <div>
                <strong>Payment Terms:</strong> {invoice.paymentTerms || "None"}
              </div>
              <div>
                <strong>PO / Order No:</strong> {invoice.poNumber || "None"}
              </div>
              {invoice.quoteId ? (
                <div>
                  <strong>Quote Ref:</strong> {invoice.quoteId}
                </div>
              ) : null}
            </div>
          </div>

          <div style={responsiveBox}>
            <div style={boxHeader}>VAT / CIS Details</div>
            <div style={boxBody}>
              <div>
                <strong>VAT Rate:</strong>{" "}
                {invoice.reverseVat ? "Reverse Charge" : `${invoice.vatRate}%`}
              </div>
              <div>
                <strong>CIS Applied:</strong> {invoice.applyCis ? "Yes" : "No"}
              </div>
              {invoice.applyCis ? (
                <div>
                  <strong>CIS Rate:</strong> {invoice.cisPercent}%
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={boxHeader}>Description of Works</div>
          <div style={descBox}>
            <div style={descriptionText}>
              {invoice.description || "No description provided."}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={boxHeader}>
            {invoice.applyCis ? "Cost Breakdown" : "Amount"}
          </div>

          {invoice.applyCis ? (
            <div style={tableWrap}>
              <div style={tableHeaderRow}>
                <div>Description</div>
                <div style={{ textAlign: "right" }}>Amount</div>
              </div>

              <div style={tableRow}>
                <div>Materials</div>
                <div style={{ textAlign: "right" }}>
                  {formatMoney(totals.materialsValue)}
                </div>
              </div>

              <div style={tableRow}>
                <div>Labour</div>
                <div style={{ textAlign: "right" }}>
                  {formatMoney(totals.labourValue)}
                </div>
              </div>
            </div>
          ) : (
            <div style={amountOnlyBox}>
              <div style={amountOnlyRow}>
                <strong>Total Before VAT</strong>
                <strong>{formatMoney(totals.subtotal)}</strong>
              </div>
            </div>
          )}
        </div>

        <div style={responsiveTotalsWrap}>
          <div style={responsiveSummaryTable}>
            <div style={summaryRow}>
              <span>Subtotal</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>

            <div style={summaryRow}>
              <span>
                VAT {invoice.reverseVat ? "(Reverse Charge)" : `(${invoice.vatRate}%)`}
              </span>
              <span>{formatMoney(totals.vat)}</span>
            </div>

            {invoice.applyCis ? (
              <div style={summaryRow}>
                <span>CIS Deduction</span>
                <span>-{formatMoney(totals.cisDeduction)}</span>
              </div>
            ) : null}

            <div style={summaryGrandTotal}>
              <span>Total</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
          </div>
        </div>

        {invoice.reverseVat ? (
          <div style={noteBox}>
            <strong>Reverse VAT Charge:</strong> Customer to account to HMRC for
            the reverse charge output tax on this supply.
          </div>
        ) : null}

        {invoice.applyCis ? (
          <div style={noteBox}>
            <strong>CIS Deduction Applied:</strong> This invoice includes a CIS
            deduction from the labour element at {invoice.cisPercent}%.
          </div>
        ) : null}

        <div style={paymentBox}>
  <div style={paymentTitle}>Payment Details</div>
  <div>Bank: Lloyds Bank</div>
  <div>Account Name: What Climate Limited</div>
  <div>Sort Code: 30-96-26</div>
  <div>Account Number: 34584360</div>
</div>
      </div>
    </div>
  );
}
const page: CSSProperties = {
  background: "#ffffff",
  minHeight: "100vh",
  padding: 16,
  fontFamily: "Arial, sans-serif",
  color: "#111827",
};


const actionBar: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  maxWidth: 900,
  margin: "0 auto 16px",
};

const pdf: CSSProperties = {
  background: "#ffffff",
  padding: "40px 24px 24px 24px",
  maxWidth: 794,
  minHeight: "auto",
  margin: "20px auto",
  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  boxSizing: "border-box",
};

const backBtn: CSSProperties = {
  padding: "10px 14px",
  background: "#dddddd",
  color: "#000000",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const downloadBtn: CSSProperties = {
  padding: "10px 16px",
  background: "#f97316",
  color: "#ffffff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const header: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginTop: 10,
};

const company: CSSProperties = {
  textAlign: "right",
  lineHeight: 1.4,
  fontSize: 13,
  marginTop: 6,
};

const companyName: CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
};

const title: CSSProperties = {
  textAlign: "center",
  color: "#0284c7",
  fontSize: 34,
  fontWeight: 700,
  marginTop: 16,
  marginBottom: 6,
};

const metaBox: CSSProperties = {
  textAlign: "center",
  marginTop: 10,
  marginBottom: 18,
  lineHeight: 1.5,
  fontSize: 13,
};

const invoiceInfoBar: CSSProperties = {
  background: "#e5e7eb",
  border: "1px solid #9ca3af",
  padding: 12,
  marginTop: 20,
  display: "grid",
  gap: 8,
  lineHeight: 1.5,
};

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  marginTop: 16,
};

const infoBox: CSSProperties = {
  flex: 1,
};

const boxHeader: CSSProperties = {
  background: "#d1d5db",
  padding: "8px 10px",
  fontWeight: 700,
  fontSize: 13,
  marginBottom: 0,
};

const boxBody: CSSProperties = {
  border: "1px solid #9ca3af",
  borderTop: "none",
  padding: 10,
  minHeight: 70,
  lineHeight: 1.5,
  fontSize: 13,
};

const descBox: CSSProperties = {
  border: "1px solid #d1d5db",
  borderTop: "none",
  padding: 12,
  minHeight: 90,
  lineHeight: 1.5,
  fontSize: 13,
};

const descriptionText: CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const tableWrap: CSSProperties = {
  border: "1px solid #d1d5db",
  borderTop: "none",
};

const tableHeaderRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 120px",
  gap: 10,
  padding: "10px 12px",
  background: "#e5e7eb",
  fontWeight: 700,
  fontSize: 13,
  borderBottom: "1px solid #9ca3af",
};

const tableRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 120px",
  gap: 10,
  padding: "10px 12px",
  fontSize: 13,
  borderBottom: "1px solid #e5e7eb",
};

const amountOnlyBox: CSSProperties = {
  border: "1px solid #d1d5db",
  borderTop: "none",
  padding: 12,
  background: "#ffffff",
};

const amountOnlyRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  fontSize: 16,
};

const totalsWrap: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 16,
};
const summaryTable: CSSProperties = {
  width: 320,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: 12,
  background: "#ffffff",
  boxSizing: "border-box",
};

const summaryRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 0",
  gap: 12,
  fontSize: 14,
};

const summaryGrandTotal: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 10,
  paddingTop: 10,
  borderTop: "2px solid #bbb",
  gap: 12,
  fontSize: 20,
  fontWeight: 700,
};

const noteBox: CSSProperties = {
  marginTop: 16,
  padding: 10,
  background: "#f3f4f6",
  borderLeft: "4px solid #ea580c",
  lineHeight: 1.5,
  fontSize: 12,
};

const paymentBox: CSSProperties = {
  marginTop: 18,
  padding: 12,
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  lineHeight: 1.5,
  fontSize: 13,
};

const paymentTitle: CSSProperties = {
  fontWeight: 700,
  marginBottom: 6,
  fontSize: 14,
};


const statusText: CSSProperties = {
  marginTop: 40,
  fontSize: 13,
  color: "#555555",
};

const logoWrap: CSSProperties = {
  width: 260,
  maxWidth: "100%",
  minHeight: 50,
  display: "flex",
  alignItems: "center",
  marginTop: 6,
};

const logoImg: CSSProperties = {
  width: "100%",
  maxWidth: 260,
  height: "auto",
  display: "block",
};
