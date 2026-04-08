"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

const toNumber = (value: string) =>
  Number(String(value || "0").replace(/,/g, "").trim());

const formatMoney = (value: number) =>
  value.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function QuotePreviewPage() {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("what-climate-current-quote");
    if (saved) {
      setQuote(JSON.parse(saved));
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const totals = useMemo(() => {
    if (!quote) {
      return {
        subtotal: 0,
        vatAmount: 0,
        total: 0,
      };
    }

    const subtotal = toNumber(quote.totalPrice);
    const vatAmount = subtotal * (quote.vatRate / 100);
    const total = subtotal + vatAmount;

    return {
      subtotal,
      vatAmount,
      total,
    };
  }, [quote]);

  const downloadPDF = async () => {
    const element = document.getElementById("quote-pdf");
    if (!element || !quote) return;

    try {
      setIsDownloading(true);

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: 1200,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.8);

      const pdfDoc = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const scaledHeight = (canvas.height * usableWidth) / canvas.width;

      if (scaledHeight <= pageHeight - margin * 2) {
        pdfDoc.addImage(
          imgData,
          "JPEG",
          margin,
          margin,
          usableWidth,
          scaledHeight
        );
      } else {
        const imgWidth = usableWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = margin;

        pdfDoc.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdfDoc.addPage();
          pdfDoc.addImage(
            imgData,
            "JPEG",
            margin,
            position,
            imgWidth,
            imgHeight
          );
          heightLeft -= pageHeight - margin * 2;
        }
      }

      pdfDoc.save(`quote-${quote.quoteNumber}.pdf`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!quote) {
    return <p style={{ padding: 20 }}>No quote data found.</p>;
  }

  const responsivePage: CSSProperties = {
    ...page,
    padding: isMobile ? 12 : 24,
  };

  const responsiveActions: CSSProperties = {
    ...actionsRow,
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
  };

  const responsivePdf: CSSProperties = {
    ...pdf,
    padding: isMobile ? 18 : 40,
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

  const responsiveDetailsRow: CSSProperties = {
    ...row,
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? 14 : 24,
  };

  const responsiveDetailsBox: CSSProperties = {
    ...detailsBox,
    width: "100%",
  };

  const responsiveMetaBox: CSSProperties = {
    ...metaBox,
    textAlign: isMobile ? "left" : "center",
    fontSize: isMobile ? 13 : 14,
    marginTop: isMobile ? 18 : 20,
    marginBottom: isMobile ? 22 : 30,
  };

  const responsiveTotalArea: CSSProperties = {
    ...totalArea,
    alignItems: isMobile ? "stretch" : "flex-end",
  };

  const responsiveTotalsCard: CSSProperties = {
    ...totalsCard,
    width: isMobile ? "100%" : 320,
  };

  return (
    <div style={responsivePage}>
      <div style={responsiveActions}>
        <button onClick={() => (window.location.href = "/")} style={backBtn}>
          ← Back
        </button>

        <button onClick={downloadPDF} style={downloadBtn} disabled={isDownloading}>
          {isDownloading ? "Preparing PDF..." : "Download PDF"}
        </button>
      </div>

      <div id="quote-pdf" style={responsivePdf}>
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
            <div
              style={{
                marginTop: 10,
                color: "#2563eb",
                wordBreak: "break-word",
              }}
            >
              {COMPANY.email}
            </div>
          </div>
        </div>

        <h1 style={responsiveTitle}>Quotation</h1>

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

        <div style={quoteInfoBar}>
          <div>
            <strong>Quote Number:</strong> {quote.quoteNumber}
          </div>
          <div>
            <strong>Date:</strong> {quote.date}
          </div>
          <div>
            <strong>Prepared by:</strong> {quote.preparedBy}
          </div>
        </div>

        <div style={responsiveDetailsRow}>
          <div style={responsiveDetailsBox}>
            <div style={boxHeader}>Customer Details</div>
            <div style={boxBody}>
              <div>{quote.customerName || "Not provided"}</div>
            </div>
          </div>

          <div style={responsiveDetailsBox}>
            <div style={boxHeader}>Site Details</div>
            <div style={boxBody}>
              <div style={{ whiteSpace: "pre-wrap" }}>
                {quote.siteAddress || "Not provided"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={boxHeader}>Description of Works</div>
          <div style={descBox}>
            <div style={descriptionText}>
              {quote.description || "No description provided."}
            </div>

            {quote.note ? (
              <div style={noteBox}>
                <strong>Please note:</strong>
                <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                  {quote.note}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div style={responsiveTotalArea}>
          <div style={responsiveTotalsCard}>
            <div style={totalsRow}>
              <span>Subtotal</span>
              <strong>£{formatMoney(totals.subtotal)}</strong>
            </div>

            <div style={totalsRow}>
              <span>VAT ({quote.vatRate}%)</span>
              <strong>£{formatMoney(totals.vatAmount)}</strong>
            </div>

            <div style={totalsDivider} />

            <div style={grandTotalRow}>
              <span>Total</span>
              <strong>£{formatMoney(totals.total)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const page: CSSProperties = {
  background: "#eeeeee",
  minHeight: "100vh",
  padding: 24,
};

const actionsRow: CSSProperties = {
  display: "flex",
  gap: 12,
  maxWidth: 900,
  margin: "0 auto 16px",
};

const pdf: CSSProperties = {
  background: "#ffffff",
  padding: 40,
  maxWidth: 900,
  minHeight: 1123,
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
};

const company: CSSProperties = {
  textAlign: "right",
  lineHeight: 1.6,
  fontSize: 14,
};

const companyName: CSSProperties = {
  fontWeight: 700,
  fontSize: 16,
};

const title: CSSProperties = {
  textAlign: "center",
  color: "#4bb5e8",
  fontSize: 42,
  fontWeight: 700,
  marginTop: 28,
  marginBottom: 10,
};

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 24,
  marginTop: 24,
};

const detailsBox: CSSProperties = {
  flex: 1,
};

const boxHeader: CSSProperties = {
  background: "#d1d5db",
  padding: "10px 12px",
  fontWeight: 700,
  marginBottom: 0,
};

const boxBody: CSSProperties = {
  border: "1px solid #d1d5db",
  borderTop: "none",
  padding: 12,
  minHeight: 80,
  lineHeight: 1.6,
};

const quoteInfoBar: CSSProperties = {
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  padding: 12,
  marginTop: 20,
  display: "grid",
  gap: 8,
  lineHeight: 1.5,
};

const descBox: CSSProperties = {
  border: "1px solid #d1d5db",
  borderTop: "none",
  padding: 16,
  minHeight: 180,
  lineHeight: 1.7,
};

const descriptionText: CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const noteBox: CSSProperties = {
  marginTop: 18,
  padding: 12,
  background: "#fff7ed",
  border: "1px solid #fdba74",
  borderRadius: 8,
};

const totalArea: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 28,
};

const totalsCard: CSSProperties = {
  width: 320,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: 16,
  background: "#fafafa",
  boxSizing: "border-box",
};

const totalsRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
  gap: 12,
};

const totalsDivider: CSSProperties = {
  height: 1,
  background: "#d1d5db",
  margin: "12px 0",
};

const grandTotalRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  fontSize: 20,
  fontWeight: 700,
};

const metaBox: CSSProperties = {
  textAlign: "center",
  marginTop: 20,
  marginBottom: 30,
  lineHeight: 1.9,
  fontSize: 14,
};

const logoWrap: CSSProperties = {
  width: 220,
  maxWidth: "100%",
  minHeight: 60,
  display: "flex",
  alignItems: "center",
};

const logoImg: CSSProperties = {
  width: "100%",
  maxWidth: 220,
  height: "auto",
  display: "block",
};
