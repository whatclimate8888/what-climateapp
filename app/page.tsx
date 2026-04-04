"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Job = {
  id: string;
  text: string;
  time: string;
  done: boolean;
  day: string;
  customer: string;
};

type Unit = {
  manufacturer: string;
  model: string;
  serial: string;
  unitType: "Internal" | "External" | "";
  refrigerantType: string;
  refrigerantCharge: string;
  location: string;
  co2Equivalent: string;
};

type Customer = {
  name: string;
  address: string;
  email: string;
  phone: string;
  serviceCost: string;
  annualServiceDueDate: string;
  units: Unit[];
};

type Quote = {
  id: string;
  customer: string;
  customerAddress: string;
  customerEmail: string;
  siteCustomer: string;
  siteName: string;
  siteAddress: string;
  description: string;
  note: string;
  amount: string;
  vatRate: 0 | 20;
  status: "Draft" | "Sent" | "Approved" | "Invoiced";
  createdAt: string;
  archived: boolean;
};

type Invoice = {
  id: string;
  quoteId: string;
  customer: string;
  customerAddress: string;
  customerEmail: string;
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
  poNumber: string;
  status: "Unpaid" | "Paid";
  archived: boolean;
};

type QuotePreviewData = {
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

type QuoteDraft = {
  quoteCustomer: string;
  quoteSiteCustomer: string;
  quoteDescription: string;
  quoteNote: string;
  quoteAmount: string;
  quoteVatRate: 0 | 20;
  quoteStatus: Quote["status"];
  editingQuoteId: string | null;
};

type FGasUnitReport = {
  id: string;
  manufacturer: string;
  model: string;
  serial: string;
  location: string;
  unitType: "Internal" | "External" | "";
  refrigerantType: string;
  refrigerantCharge: string;
  co2Equivalent: string;
  leakCheckCompleted: string;
  leakDetected: string;
  refrigerantAdded: string;
  refrigerantRecovered: string;
  actionsTaken: string;
  notes: string;
};

type FGasReportDraft = {
  customer: string;
  reportDate: string;
  engineerName: string;
  engineerCertificate: string;
  companyCertificate: string;
  visitNotes: string;
  leakCheckResult: string;
  workCarriedOut: string;
  unitReports: FGasUnitReport[];
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MANUFACTURERS = [
  "Daikin",
  "Mitsubishi Electric",
  "Mitsubishi Heavy Industries",
  "Fujitsu",
  "Panasonic",
  "Midea",
  "Hitachi",
  "LG",
  "Other",
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toNumber = (value: string) => Number(value || 0);

const emptyUnit = (): Unit => ({
  manufacturer: "",
  model: "",
  serial: "",
  unitType: "",
  refrigerantType: "",
  refrigerantCharge: "",
  location: "",
  co2Equivalent: "",
});

const createFgasUnitReport = (unit: Unit): FGasUnitReport => ({
  id: createId(),
  manufacturer: unit.manufacturer,
  model: unit.model,
  serial: unit.serial,
  location: unit.location,
  unitType: unit.unitType,
  refrigerantType: unit.refrigerantType,
  refrigerantCharge: unit.refrigerantCharge,
  co2Equivalent: unit.co2Equivalent,
  leakCheckCompleted: "Yes",
  leakDetected: "No",
  refrigerantAdded: "",
  refrigerantRecovered: "",
  actionsTaken: "",
  notes: "",
});

const formatMoney = (value: number) =>
  `£${value.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const getInvoiceValues = (invoice: Invoice) => {
  const materialsVal = Number(invoice.materials || 0);
  const labourVal = Number(invoice.labour || 0);
  const subtotal = materialsVal + labourVal;

  const cis = invoice.applyCis
    ? labourVal * (invoice.cisPercent / 100)
    : 0;

  const vat =
    invoice.reverseVat || invoice.vatRate === 0
      ? 0
      : subtotal * (invoice.vatRate / 100);

  const total = subtotal + vat - cis;

  return { subtotal, vat, cis, total };
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export default function Home() {
  const APP_PASSWORD = "0070";

  const [passwordInput, setPasswordInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const [selectedDay, setSelectedDay] = useState("Monday");
  const [activeSection, setActiveSection] = useState<
    "jobs" | "customers" | "quotes" | "invoices" | "fgas"
  >("jobs");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobText, setJobText] = useState("");
  const [jobTime, setJobTime] = useState("");
  const [jobCustomer, setJobCustomer] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("All");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceCost, setServiceCost] = useState("");
  const [annualServiceDueDate, setAnnualServiceDueDate] = useState("");
  const [units, setUnits] = useState<Unit[]>([emptyUnit()]);
  const [editingCustomerName, setEditingCustomerName] = useState<string | null>(
    null
  );

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteCustomer, setQuoteCustomer] = useState("");
  const [quoteSiteCustomer, setQuoteSiteCustomer] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [quoteNote, setQuoteNote] = useState("Please note:");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteVatRate, setQuoteVatRate] = useState<0 | 20>(20);
  const [quoteStatus, setQuoteStatus] = useState<Quote["status"]>("Draft");
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceCustomer, setInvoiceCustomer] = useState("");
  const [invoiceCustomerAddress, setInvoiceCustomerAddress] = useState("");
  const [invoiceCustomerEmail, setInvoiceCustomerEmail] = useState("");
  const [invoiceSiteName, setInvoiceSiteName] = useState("");
  const [invoiceSiteAddress, setInvoiceSiteAddress] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [materials, setMaterials] = useState("");
  const [labour, setLabour] = useState("");
  const [invoiceVatRate, setInvoiceVatRate] = useState<0 | 20>(20);
  const [reverseVat, setReverseVat] = useState(false);
  const [applyCis, setApplyCis] = useState(false);
  const [cisPercent, setCisPercent] = useState(20);
  const [invoicePaymentTerms, setInvoicePaymentTerms] = useState("30 Days");
  const [poNumber, setPoNumber] = useState("");
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  const [fgasCustomer, setFgasCustomer] = useState("");
  const [fgasReportDate, setFgasReportDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [fgasEngineerName, setFgasEngineerName] = useState("");
  const [fgasEngineerCertificate, setFgasEngineerCertificate] = useState("");
  const [fgasCompanyCertificate, setFgasCompanyCertificate] = useState("");
  const [fgasVisitNotes, setFgasVisitNotes] = useState("");
  const [fgasLeakCheckResult, setFgasLeakCheckResult] = useState("No leaks found");
  const [fgasWorkCarriedOut, setFgasWorkCarriedOut] = useState("");
  const [fgasUnitReports, setFgasUnitReports] = useState<FGasUnitReport[]>([]);
  const [savedFgasReports, setSavedFgasReports] = useState<
    Record<string, FGasReportDraft>
  >({});

  const [pendingDeleteJobId, setPendingDeleteJobId] = useState<string | null>(
    null
  );
  const [pendingDeleteCustomerName, setPendingDeleteCustomerName] = useState<
    string | null
  >(null);
  const [pendingDeleteQuoteId, setPendingDeleteQuoteId] = useState<string | null>(
    null
  );
  const [pendingDeleteInvoiceId, setPendingDeleteInvoiceId] = useState<
    string | null
  >(null);

  const [isMobile, setIsMobile] = useState(false);
  const [loaded, setLoaded] = useState(false);

    const jobsSectionRef = useRef<HTMLElement | null>(null);
  const customersSectionRef = useRef<HTMLElement | null>(null);
  const quotesSectionRef = useRef<HTMLElement | null>(null);
  const invoicesSectionRef = useRef<HTMLElement | null>(null);
  const fgasSectionRef = useRef<HTMLElement | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    try {
      const savedJobs = localStorage.getItem("what-climate-jobs");
      const savedCustomers = localStorage.getItem("what-climate-customers");
      const savedQuotes = localStorage.getItem("what-climate-quotes");
      const savedInvoices = localStorage.getItem("what-climate-invoices");
      const savedQuoteDraft = localStorage.getItem("what-climate-quote-draft");
      const savedFgasReportsData = localStorage.getItem("what-climate-fgas-reports");

            if (savedJobs) setJobs(JSON.parse(savedJobs));
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      if (savedQuotes) {
        const parsedQuotes = JSON.parse(savedQuotes);
        setQuotes(
          Array.isArray(parsedQuotes)
            ? parsedQuotes.map((quote) => ({
                ...quote,
                archived: quote.archived ?? false,
              }))
            : []
        );
      }
      if (savedInvoices) {
        const parsedInvoices = JSON.parse(savedInvoices);
        setInvoices(
          Array.isArray(parsedInvoices)
            ? parsedInvoices.map((invoice) => ({
                ...invoice,
                archived: invoice.archived ?? false,
              }))
            : []
        );
      }
      if (savedFgasReportsData) setSavedFgasReports(JSON.parse(savedFgasReportsData));

      if (savedQuoteDraft) {
        const parsedDraft: QuoteDraft = JSON.parse(savedQuoteDraft);
        setQuoteCustomer(parsedDraft.quoteCustomer || "");
        setQuoteSiteCustomer(parsedDraft.quoteSiteCustomer || "");
        setQuoteDescription(parsedDraft.quoteDescription || "");
        setQuoteNote(parsedDraft.quoteNote || "Please note:");
        setQuoteAmount(parsedDraft.quoteAmount || "");
        setQuoteVatRate(parsedDraft.quoteVatRate ?? 20);
        setQuoteStatus(parsedDraft.quoteStatus || "Draft");
        setEditingQuoteId(parsedDraft.editingQuoteId || null);

        if (
          parsedDraft.quoteCustomer ||
          parsedDraft.quoteDescription ||
          parsedDraft.quoteAmount ||
          parsedDraft.editingQuoteId
        ) {
          setActiveSection("quotes");
        }
      }
    } catch (error) {
      console.error("Failed to load saved data", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("what-climate-jobs", JSON.stringify(jobs));
  }, [jobs, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("what-climate-customers", JSON.stringify(customers));
  }, [customers, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("what-climate-quotes", JSON.stringify(quotes));
  }, [quotes, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("what-climate-invoices", JSON.stringify(invoices));
  }, [invoices, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      "what-climate-fgas-reports",
      JSON.stringify(savedFgasReports)
    );
  }, [savedFgasReports, loaded]);

  useEffect(() => {
    if (!loaded) return;

    const quoteDraft: QuoteDraft = {
      quoteCustomer,
      quoteSiteCustomer,
      quoteDescription,
      quoteNote,
      quoteAmount,
      quoteVatRate,
      quoteStatus,
      editingQuoteId,
    };

    localStorage.setItem("what-climate-quote-draft", JSON.stringify(quoteDraft));
  }, [
    loaded,
    quoteCustomer,
    quoteSiteCustomer,
    quoteDescription,
    quoteNote,
    quoteAmount,
    quoteVatRate,
    quoteStatus,
    editingQuoteId,
  ]);

  const sortedCustomers = useMemo(() => {
    return customers.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [customers]);

  const selectedFgasCustomer = useMemo(() => {
    return customers.find((customer) => customer.name === fgasCustomer) || null;
  }, [customers, fgasCustomer]);

  useEffect(() => {
    const matchedCustomer = customers.find(
      (customer) => customer.name === invoiceCustomer
    );

    if (!matchedCustomer) {
      if (!editingInvoiceId) {
        setInvoiceCustomerAddress("");
        setInvoiceCustomerEmail("");
      }
      return;
    }

    setInvoiceCustomerAddress(matchedCustomer.address || "");
    setInvoiceCustomerEmail(matchedCustomer.email || "");
  }, [invoiceCustomer, customers, editingInvoiceId]);

         useEffect(() => {
    if (!selectedFgasCustomer) {
      setFgasUnitReports([]);
      return;
    }

    const allUnits = selectedFgasCustomer.units;
    const savedReport = savedFgasReports[selectedFgasCustomer.name];

    if (savedReport) {
      const mergedUnitReports = allUnits.map((unit) => {
        const matchedSavedUnit =
          savedReport.unitReports.find(
            (savedUnit) =>
              (savedUnit.serial &&
                unit.serial &&
                savedUnit.serial === unit.serial) ||
              (savedUnit.model === unit.model &&
                savedUnit.location === unit.location &&
                savedUnit.manufacturer === unit.manufacturer)
          ) || null;

        return {
          id: matchedSavedUnit?.id || createId(),
          manufacturer: unit.manufacturer || "",
          model: unit.model || "",
          serial: unit.serial || "",
          location: unit.location || "",
          unitType: unit.unitType || "",
          refrigerantType:
            unit.unitType === "External" ? unit.refrigerantType || "" : "",
          refrigerantCharge:
            unit.unitType === "External" ? unit.refrigerantCharge || "" : "",
          co2Equivalent:
            unit.unitType === "External" ? unit.co2Equivalent || "" : "",
          leakCheckCompleted: matchedSavedUnit?.leakCheckCompleted || "Yes",
          leakDetected: matchedSavedUnit?.leakDetected || "No",
          refrigerantAdded:
            unit.unitType === "External"
              ? matchedSavedUnit?.refrigerantAdded || ""
              : "",
          refrigerantRecovered:
            unit.unitType === "External"
              ? matchedSavedUnit?.refrigerantRecovered || ""
              : "",
          actionsTaken: matchedSavedUnit?.actionsTaken || "",
          notes: matchedSavedUnit?.notes || "",
        };
      });

      setFgasReportDate(
        savedReport.reportDate || new Date().toISOString().slice(0, 10)
      );
      setFgasEngineerName(savedReport.engineerName || "");
      setFgasEngineerCertificate(savedReport.engineerCertificate || "");
      setFgasCompanyCertificate(savedReport.companyCertificate || "");
      setFgasVisitNotes(savedReport.visitNotes || "");
      setFgasLeakCheckResult(savedReport.leakCheckResult || "No leaks found");
      setFgasWorkCarriedOut(savedReport.workCarriedOut || "");
      setFgasUnitReports(mergedUnitReports);
      return;
    }

    const allUnitReports = allUnits.map((unit) => ({
      id: createId(),
      manufacturer: unit.manufacturer || "",
      model: unit.model || "",
      serial: unit.serial || "",
      location: unit.location || "",
      unitType: unit.unitType || "",
      refrigerantType:
        unit.unitType === "External" ? unit.refrigerantType || "" : "",
      refrigerantCharge:
        unit.unitType === "External" ? unit.refrigerantCharge || "" : "",
      co2Equivalent:
        unit.unitType === "External" ? unit.co2Equivalent || "" : "",
      leakCheckCompleted: "Yes",
      leakDetected: "No",
      refrigerantAdded: "",
      refrigerantRecovered: "",
      actionsTaken: "",
      notes: "",
    }));

    setFgasReportDate(new Date().toISOString().slice(0, 10));
    setFgasEngineerName("");
    setFgasEngineerCertificate("");
    setFgasCompanyCertificate("");
    setFgasVisitNotes("");
    setFgasLeakCheckResult("No leaks found");
    setFgasWorkCarriedOut("");
    setFgasUnitReports(allUnitReports);
  }, [selectedFgasCustomer, savedFgasReports]);
    

    useEffect(() => {
    if (!loaded || !fgasCustomer) return;

    const timeout = window.setTimeout(() => {
      const nextReport: FGasReportDraft = {
        customer: fgasCustomer,
        reportDate: fgasReportDate,
        engineerName: fgasEngineerName,
        engineerCertificate: fgasEngineerCertificate,
        companyCertificate: fgasCompanyCertificate,
        visitNotes: fgasVisitNotes,
        leakCheckResult: fgasLeakCheckResult,
        workCarriedOut: fgasWorkCarriedOut,
        unitReports: fgasUnitReports,
      };

      setSavedFgasReports((prev) => {
        const currentReport = prev[fgasCustomer];

        if (JSON.stringify(currentReport) === JSON.stringify(nextReport)) {
          return prev;
        }

        return {
          ...prev,
          [fgasCustomer]: nextReport,
        };
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [
    loaded,
    fgasCustomer,
    fgasReportDate,
    fgasEngineerName,
    fgasEngineerCertificate,
    fgasCompanyCertificate,
    fgasVisitNotes,
    fgasLeakCheckResult,
    fgasWorkCarriedOut,
    fgasUnitReports,
  ]);

  const getNextQuoteId = () => {
    const lastNumber = quotes.length
      ? Math.max(
          ...quotes.map((quote) => {
            const numericPart = Number(quote.id.replace("Q-", ""));
            return Number.isNaN(numericPart) ? 0 : numericPart;
          })
        )
      : 0;

    return `Q-${String(lastNumber + 1).padStart(3, "0")}`;
  };

  const getNextInvoiceId = () => {
    const lastNumber = invoices.length
      ? Math.max(
          ...invoices.map((invoice) => {
            const numericPart = Number(invoice.id.replace("INV-", ""));
            return Number.isNaN(numericPart) ? 0 : numericPart;
          })
        )
      : 0;

    return `INV-${String(lastNumber + 1).padStart(3, "0")}`;
  };

  const resetCustomerForm = () => {
    setName("");
    setAddress("");
    setEmail("");
    setPhone("");
    setServiceCost("");
    setAnnualServiceDueDate("");
    setUnits([emptyUnit()]);
    setEditingCustomerName(null);
  };

  const resetQuoteForm = () => {
    setQuoteCustomer("");
    setQuoteSiteCustomer("");
    setQuoteDescription("");
    setQuoteNote("Please note:");
    setQuoteAmount("");
    setQuoteVatRate(20);
    setQuoteStatus("Draft");
    setEditingQuoteId(null);
    localStorage.removeItem("what-climate-quote-draft");
  };

  const resetInvoiceForm = () => {
    setInvoiceCustomer("");
    setInvoiceCustomerAddress("");
    setInvoiceCustomerEmail("");
    setInvoiceSiteName("");
    setInvoiceSiteAddress("");
    setInvoiceDescription("");
    setInvoiceVatRate(20);
    setReverseVat(false);
    setApplyCis(false);
    setMaterials("");
    setLabour("");
    setCisPercent(20);
    setInvoicePaymentTerms("30 Days");
    setPoNumber("");
    setEditingInvoiceId(null);
  };

  const serviceDueCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (!customer.annualServiceDueDate) return false;

      const dueDate = new Date(customer.annualServiceDueDate);
      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);

      return dueDate <= in30Days;
    });
  }, [customers]);

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => job.day === selectedDay)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [jobs, selectedDay]);

  const visibleCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        const q = customerSearch.toLowerCase();
        const matchesSearch =
          customer.name.toLowerCase().includes(q) ||
          customer.address.toLowerCase().includes(q) ||
          customer.phone.toLowerCase().includes(q) ||
          customer.email.toLowerCase().includes(q);

        const firstLetter = customer.name.charAt(0).toUpperCase();
        const matchesLetter =
          selectedLetter === "All" || firstLetter === selectedLetter;

        return matchesSearch && matchesLetter;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, customerSearch, selectedLetter]);

  const todaysCompleted = useMemo(
    () => filteredJobs.filter((job) => job.done).length,
    [filteredJobs]
  );

  const todaysTotal = filteredJobs.length;

    const invoiceValue = useMemo(() => {
    return invoices.reduce(
      (sum, invoice) => sum + getInvoiceValues(invoice).total,
      0
    );
  }, [invoices]);

  const activeQuotes = useMemo(
    () => quotes.filter((quote) => !quote.archived),
    [quotes]
  );

  const archivedQuotes = useMemo(
    () => quotes.filter((quote) => quote.archived),
    [quotes]
  );

  const activeInvoices = useMemo(
    () => invoices.filter((invoice) => !invoice.archived),
    [invoices]
  );

  const archivedInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.archived),
    [invoices]
  );

  const previewQuote = () => {
    if (!quoteCustomer.trim() || !quoteDescription.trim() || !quoteAmount.trim()) {
      alert("Please complete customer, description and amount before previewing.");
      return;
    }

    const matchedSiteCustomer = customers.find(
      (customer) => customer.name === quoteSiteCustomer
    );

    const quoteNumber = editingQuoteId
      ? editingQuoteId.replace("Q-", "")
      : getNextQuoteId().replace("Q-", "");

    const quote: QuotePreviewData = {
      quoteNumber,
      date: new Date().toLocaleDateString("en-GB"),
      preparedBy: "Luke Page",
      customerName: quoteCustomer || "No customer selected",
      siteAddress: matchedSiteCustomer?.address || "No site address",
      description: quoteDescription || "No description",
      note: quoteNote || "Please note:",
      totalPrice: quoteAmount || "0",
      vatRate: quoteVatRate,
    };

    const quoteDraft: QuoteDraft = {
      quoteCustomer,
      quoteSiteCustomer,
      quoteDescription,
      quoteNote,
      quoteAmount,
      quoteVatRate,
      quoteStatus,
      editingQuoteId,
    };

    localStorage.setItem("what-climate-quote-draft", JSON.stringify(quoteDraft));
    localStorage.setItem("what-climate-current-quote", JSON.stringify(quote));
    window.location.href = "/quotes/preview";
  };

  const previewSavedQuote = (quote: Quote) => {
    const previewData: QuotePreviewData = {
      quoteNumber: quote.id.replace("Q-", ""),
      date: quote.createdAt,
      preparedBy: "Luke Page",
      customerName: quote.customer,
      siteAddress: quote.siteAddress || "No site address",
      description: quote.description,
      note: quote.note || "",
      totalPrice: quote.amount,
      vatRate: quote.vatRate,
    };

    localStorage.setItem("what-climate-current-quote", JSON.stringify(previewData));
    window.location.href = "/quotes/preview";
  };

  const previewInvoice = (invoice: Invoice) => {
    localStorage.setItem("what-climate-current-invoice", JSON.stringify(invoice));
    window.location.href = "/invoices/preview";
  };

  const updateFgasUnitReport = (
    index: number,
    field: keyof FGasUnitReport,
    value: string
  ) => {
    setFgasUnitReports((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

   const saveFgasPdf = async () => {
  if (!selectedFgasCustomer) return;

  const element = document.createElement("div");
  element.style.position = "fixed";
  element.style.left = "-9999px";
  element.style.top = "0";
  element.style.width = "800px";
  element.style.background = "#ffffff";
  element.style.padding = "24px";
  element.style.fontFamily = "Arial, sans-serif";
  element.style.color = "#111";

  element.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h1 style="margin: 0 0 16px 0; font-size: 28px;">F-Gas Inspection Report</h1>

      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;margin-bottom:16px;">
        <div><strong>Customer:</strong> ${escapeHtml(selectedFgasCustomer.name || "Not set")}</div>
        <div><strong>Report Date:</strong> ${escapeHtml(fgasReportDate || "Not set")}</div>
        <div><strong>Customer Address:</strong> ${escapeHtml(selectedFgasCustomer.address || "Not set")}</div>
        <div><strong>Customer Email:</strong> ${escapeHtml(selectedFgasCustomer.email || "Not set")}</div>
        <div><strong>Customer Phone:</strong> ${escapeHtml(selectedFgasCustomer.phone || "Not set")}</div>
        <div><strong>Engineer:</strong> ${escapeHtml(fgasEngineerName || "Not set")}</div>
        <div><strong>Engineer Cert:</strong> ${escapeHtml(fgasEngineerCertificate || "Not set")}</div>
        <div><strong>Company Cert:</strong> ${escapeHtml(fgasCompanyCertificate || "Not set")}</div>
        <div><strong>Company Name:</strong> What Climate Limited</div>
        <div><strong>Company Address:</strong> 8 The Dales, Harwich, Essex, CO12 4XH</div>
        <div><strong>Overall Leak Check Result:</strong> ${escapeHtml(fgasLeakCheckResult || "Not set")}</div>
      </div>

      <h2 style="margin: 24px 0 12px 0; font-size: 18px;">Work Carried Out</h2>
      <div style="border:1px solid #ddd;border-radius:10px;padding:12px;min-height:50px;white-space:pre-wrap;">
        ${escapeHtml(fgasWorkCarriedOut || "No work recorded.")}
      </div>

      <h2 style="margin: 24px 0 12px 0; font-size: 18px;">Visit Notes</h2>
      <div style="border:1px solid #ddd;border-radius:10px;padding:12px;min-height:50px;white-space:pre-wrap;">
        ${escapeHtml(fgasVisitNotes || "No notes recorded.")}
      </div>

      <h2 style="margin: 24px 0 12px 0; font-size: 18px;">System Register</h2>
      ${
        fgasUnitReports.length === 0
          ? `<div style="border:1px solid #ddd;border-radius:10px;padding:12px;">No units found for this customer.</div>`
          : fgasUnitReports
              .map(
                (unit, index) => `
                  <div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin-bottom:12px;font-size:13px;line-height:1.45;page-break-inside:avoid;break-inside:avoid;">
                    <div style="font-weight:700;font-size:15px;margin-bottom:8px;">
                      System ${index + 1} - ${escapeHtml(unit.unitType || "Not set")}
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 16px;">
                      <div><strong>Location:</strong> ${escapeHtml(unit.location || "Not set")}</div>
                      <div><strong>Manufacturer:</strong> ${escapeHtml(unit.manufacturer || "Not set")}</div>
                      <div><strong>Model:</strong> ${escapeHtml(unit.model || "Not set")}</div>
                      <div><strong>Serial:</strong> ${escapeHtml(unit.serial || "Not set")}</div>
                      ${
                        unit.unitType === "External"
                          ? `
                            <div><strong>Refrigerant Type:</strong> ${escapeHtml(unit.refrigerantType || "Not set")}</div>
                            <div><strong>Refrigerant Charge:</strong> ${escapeHtml(unit.refrigerantCharge || "Not set")} kg</div>
                            <div><strong>CO2 Equivalent:</strong> ${escapeHtml(unit.co2Equivalent || "Not set")} tCO2e</div>
                          `
                          : ""
                      }
                      <div><strong>Leak Check Completed:</strong> ${escapeHtml(unit.leakCheckCompleted || "Not set")}</div>
                      <div><strong>Leak Detected:</strong> ${escapeHtml(unit.leakDetected || "Not set")}</div>
                      <div><strong>Actions Taken:</strong> ${escapeHtml(unit.actionsTaken || "None")}</div>
                      <div><strong>System Notes:</strong> ${escapeHtml(unit.notes || "None")}</div>
                    </div>
                  </div>
                `
              )
              .join("")
      }
    </div>
  `;

  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(
      `fgas-report-${selectedFgasCustomer.name
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()}.pdf`
    );
  } finally {
    document.body.removeChild(element);
  }
};
  const openFgasForCustomer = (customerName: string) => {
    setFgasCustomer(customerName);
    setActiveSection("fgas");

    requestAnimationFrame(() => {
      fgasSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const exportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      jobs,
      customers,
      quotes,
      invoices,
      savedFgasReports,
      quoteDraft: {
        quoteCustomer,
        quoteSiteCustomer,
        quoteDescription,
        quoteNote,
        quoteAmount,
        quoteVatRate,
        quoteStatus,
        editingQuoteId,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    a.href = url;
    a.download = `what-climate-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== "object") {
          alert("Invalid backup file");
          return;
        }

        setJobs(Array.isArray(parsed.jobs) ? parsed.jobs : []);
        setCustomers(Array.isArray(parsed.customers) ? parsed.customers : []);
        setQuotes(
  Array.isArray(parsed.quotes)
    ? parsed.quotes.map((quote) => ({
        ...quote,
        archived: quote.archived ?? false,
      }))
    : []
);

setInvoices(
  Array.isArray(parsed.invoices)
    ? parsed.invoices.map((invoice) => ({
        ...invoice,
        archived: invoice.archived ?? false,
      }))
    : []
);
        setSavedFgasReports(
          parsed.savedFgasReports && typeof parsed.savedFgasReports === "object"
            ? parsed.savedFgasReports
            : {}
        );

        const draft = parsed.quoteDraft || {};
        setQuoteCustomer(draft.quoteCustomer || "");
        setQuoteSiteCustomer(draft.quoteSiteCustomer || "");
        setQuoteDescription(draft.quoteDescription || "");
        setQuoteNote(draft.quoteNote || "Please note:");
        setQuoteAmount(draft.quoteAmount || "");
        setQuoteVatRate(draft.quoteVatRate ?? 20);
        setQuoteStatus(draft.quoteStatus || "Draft");
        setEditingQuoteId(draft.editingQuoteId || null);

        alert("Backup imported successfully");
      } catch (error) {
        console.error("Failed to import backup", error);
        alert("Could not import backup file");
      } finally {
        if (backupFileInputRef.current) {
          backupFileInputRef.current.value = "";
        }
      }
    };

    reader.readAsText(file);
  };

  const addJob = () => {
    if (!jobText.trim()) return;

    const newJob: Job = {
      id: createId(),
      text: jobText,
      time: jobTime,
      done: false,
      day: selectedDay,
      customer: jobCustomer,
    };

    setJobs((prev) => [...prev, newJob]);
    setJobText("");
    setJobTime("");
    setJobCustomer("");
    setActiveSection("jobs");
  };

  const toggleJob = (id: string) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, done: !job.done } : job))
    );
  };

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
    setPendingDeleteJobId(null);
  };

  const addUnit = () => {
    setUnits((prev) => [...prev, emptyUnit()]);
  };

  const removeUnit = (index: number) => {
    setUnits((prev) => prev.filter((_, i) => i !== index));
  };

  const updateUnit = (index: number, field: keyof Unit, value: string) => {
    setUnits((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const saveCustomer = () => {
    if (!name.trim()) return;

    const cleanedUnits = units.filter(
      (unit) =>
        unit.manufacturer ||
        unit.model ||
        unit.serial ||
        unit.unitType ||
        unit.refrigerantType ||
        unit.refrigerantCharge ||
        unit.location ||
        unit.co2Equivalent
    );

    const customerData: Customer = {
      name,
      address,
      email,
      phone,
      serviceCost,
      annualServiceDueDate,
      units: cleanedUnits,
    };

    if (editingCustomerName) {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.name === editingCustomerName ? customerData : customer
        )
      );

      setJobs((prev) =>
        prev.map((job) =>
          job.customer === editingCustomerName ? { ...job, customer: name } : job
        )
      );

      setQuotes((prev) =>
        prev.map((quote) => {
          if (quote.customer === editingCustomerName) {
            return {
              ...quote,
              customer: name,
              customerAddress: address,
              customerEmail: email,
            };
          }

          if (quote.siteCustomer === editingCustomerName) {
            return {
              ...quote,
              siteCustomer: name,
              siteAddress: address,
            };
          }

          return quote;
        })
      );

      setInvoices((prev) =>
        prev.map((invoice) =>
          invoice.customer === editingCustomerName
            ? {
                ...invoice,
                customer: name,
                customerAddress: address,
                customerEmail: email,
              }
            : invoice
        )
      );

      if (fgasCustomer === editingCustomerName) {
        setFgasCustomer(name);
      }

      setSavedFgasReports((prev) => {
        if (!prev[editingCustomerName]) return prev;

        const updated = { ...prev };
        updated[name] = {
          ...updated[editingCustomerName],
          customer: name,
        };
        if (name !== editingCustomerName) {
          delete updated[editingCustomerName];
        }
        return updated;
      });
    } else {
      setCustomers((prev) => [...prev, customerData]);
    }

    resetCustomerForm();
    setActiveSection("customers");
  };

  const startEditCustomer = (customer: Customer) => {
    setEditingCustomerName(customer.name);
    setName(customer.name);
    setAddress(customer.address);
    setEmail(customer.email);
    setPhone(customer.phone);
    setServiceCost(customer.serviceCost);
    setAnnualServiceDueDate(customer.annualServiceDueDate);
    setUnits(
      customer.units.length
        ? customer.units.map((unit) => ({ ...unit }))
        : [emptyUnit()]
    );
    setActiveSection("customers");

    requestAnimationFrame(() => {
      customersSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const deleteCustomer = (customerName: string) => {
    setCustomers((prev) =>
      prev.filter((customer) => customer.name !== customerName)
    );

    setJobs((prev) =>
      prev.map((job) =>
        job.customer === customerName ? { ...job, customer: "" } : job
      )
    );

    setQuotes((prev) =>
      prev.filter(
        (quote) =>
          quote.customer !== customerName && quote.siteCustomer !== customerName
      )
    );

    setInvoices((prev) =>
      prev.filter((invoice) => invoice.customer !== customerName)
    );

    setSavedFgasReports((prev) => {
      const updated = { ...prev };
      delete updated[customerName];
      return updated;
    });

    if (editingCustomerName === customerName) {
      resetCustomerForm();
    }

    if (fgasCustomer === customerName) {
      setFgasCustomer("");
    }

    setPendingDeleteCustomerName(null);
  };

  const saveQuote = () => {
    if (!quoteCustomer.trim() || !quoteDescription.trim() || !quoteAmount.trim()) {
      alert("Please complete customer, description and amount.");
      return;
    }

    const matchedCustomer = customers.find(
      (customer) => customer.name === quoteCustomer
    );
    const matchedSiteCustomer = customers.find(
      (customer) => customer.name === quoteSiteCustomer
    );

        if (editingQuoteId) {
      setQuotes((prev) =>
        prev.map((quote) =>
          quote.id === editingQuoteId
            ? {
                ...quote,
                customer: quoteCustomer,
                customerAddress: matchedCustomer?.address || "",
                customerEmail: matchedCustomer?.email || "",
                siteCustomer: quoteSiteCustomer,
                siteName: quoteSiteCustomer,
                siteAddress: matchedSiteCustomer?.address || "",
                description: quoteDescription,
                note: quoteNote,
                amount: quoteAmount,
                vatRate: quoteVatRate,
                status: quoteStatus,
              }
            : quote
        )
      );
    } else {
      const newQuote: Quote = {
        id: getNextQuoteId(),
        customer: quoteCustomer,
        customerAddress: matchedCustomer?.address || "",
        customerEmail: matchedCustomer?.email || "",
        siteCustomer: quoteSiteCustomer,
        siteName: quoteSiteCustomer,
        siteAddress: matchedSiteCustomer?.address || "",
        description: quoteDescription,
        note: quoteNote,
        amount: quoteAmount,
        vatRate: quoteVatRate,
        status: quoteStatus,
        createdAt: new Date().toLocaleDateString("en-GB"),
        archived: false,
      };

      setQuotes((prev) => [newQuote, ...prev]);
    }

    resetQuoteForm();
    setActiveSection("quotes");
  };

  const startEditQuote = (quote: Quote) => {
    setEditingQuoteId(quote.id);
    setQuoteCustomer(quote.customer);
    setQuoteSiteCustomer(quote.siteCustomer || "");
    setQuoteDescription(quote.description);
    setQuoteNote(quote.note);
    setQuoteAmount(quote.amount);
    setQuoteVatRate(quote.vatRate);
    setQuoteStatus(quote.status);
    setActiveSection("quotes");

    requestAnimationFrame(() => {
      quotesSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const updateQuoteStatus = (id: string, status: Quote["status"]) => {
    setQuotes((prev) =>
      prev.map((quote) => (quote.id === id ? { ...quote, status } : quote))
    );
  };

  const deleteQuote = (id: string) => {
    setQuotes((prev) => prev.filter((quote) => quote.id !== id));
    if (editingQuoteId === id) {
      resetQuoteForm();
    }
    setPendingDeleteQuoteId(null);
  };

  const saveInvoice = () => {
    if (!invoiceCustomer.trim() || !invoiceDescription.trim()) {
      alert("Please complete customer and description.");
      return;
    }

    const existingInvoice = editingInvoiceId
      ? invoices.find((invoice) => invoice.id === editingInvoiceId)
      : null;

        const invoiceToSave: Invoice = {
      id: editingInvoiceId || getNextInvoiceId(),
      quoteId: existingInvoice?.quoteId || "",
      customer: invoiceCustomer,
      customerAddress: invoiceCustomerAddress,
      customerEmail: invoiceCustomerEmail,
      siteName: invoiceSiteName,
      siteAddress: invoiceSiteAddress,
      description: invoiceDescription,
      createdAt:
        existingInvoice?.createdAt || new Date().toLocaleDateString("en-GB"),
      vatRate: reverseVat ? 0 : invoiceVatRate,
      reverseVat,
      applyCis,
      materials,
      labour,
      cisPercent,
      paymentTerms: invoicePaymentTerms,
      poNumber,
      status: existingInvoice?.status || "Unpaid",
      archived: existingInvoice?.archived ?? false,
    };

    if (editingInvoiceId) {
      setInvoices((prev) =>
        prev.map((invoice) =>
          invoice.id === editingInvoiceId ? invoiceToSave : invoice
        )
      );
    } else {
      setInvoices((prev) => [invoiceToSave, ...prev]);
    }

    resetInvoiceForm();
    setActiveSection("invoices");
  };

  const startEditInvoice = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id);
    setInvoiceCustomer(invoice.customer);
    setInvoiceCustomerAddress(invoice.customerAddress || "");
    setInvoiceCustomerEmail(invoice.customerEmail || "");
    setInvoiceSiteName(invoice.siteName || "");
    setInvoiceSiteAddress(invoice.siteAddress || "");
    setInvoiceDescription(invoice.description);
    setMaterials(invoice.materials || "");
    setLabour(invoice.labour || "");
    setInvoiceVatRate(invoice.vatRate);
    setReverseVat(invoice.reverseVat);
    setApplyCis(invoice.applyCis);
    setCisPercent(invoice.cisPercent || 20);
    setInvoicePaymentTerms(invoice.paymentTerms || "30 Days");
    setPoNumber(invoice.poNumber || "");
    setActiveSection("invoices");

    requestAnimationFrame(() => {
      invoicesSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const convertQuoteToInvoice = (quote: Quote) => {
    const existingInvoice = invoices.find(
      (invoice) => invoice.quoteId === quote.id
    );

    if (existingInvoice) {
      setActiveSection("invoices");
      requestAnimationFrame(() => {
        invoicesSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
      return;
    }

        const newInvoice: Invoice = {
      id: getNextInvoiceId(),
      quoteId: quote.id,
      customer: quote.customer,
      customerAddress: quote.customerAddress || "",
      customerEmail: quote.customerEmail || "",
      siteName: quote.siteName || quote.siteCustomer || "",
      siteAddress: quote.siteAddress || "",
      description: quote.description,
      createdAt: new Date().toLocaleDateString("en-GB"),
      vatRate: quote.vatRate,
      reverseVat: false,
      applyCis: false,
      materials: quote.amount || "",
      labour: "",
      cisPercent: 20,
      paymentTerms: "30 Days",
      poNumber: "",
      status: "Unpaid",
      archived: false,
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    setQuotes((prev) =>
      prev.map((currentQuote) =>
        currentQuote.id === quote.id
          ? { ...currentQuote, status: "Invoiced" }
          : currentQuote
      )
    );
    setActiveSection("invoices");

    requestAnimationFrame(() => {
      invoicesSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
  const toggleInvoicePaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((invoice) => {
        if (invoice.id !== id) return invoice;

        const isCurrentlyPaid = invoice.status === "Paid";

        return {
          ...invoice,
          status: isCurrentlyPaid ? "Unpaid" : "Paid",
          archived: isCurrentlyPaid ? false : true,
        };
      })
    );
  };
  
     const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((invoice) => invoice.id !== id));
    if (editingInvoiceId === id) {
      resetInvoiceForm();
    }
    setPendingDeleteInvoiceId(null);
  };

  const markServiceComplete = (customerName: string) => {
    setCustomers((prev) =>
      prev.map((customer) => {
        if (customer.name !== customerName) return customer;

        const baseDate = customer.annualServiceDueDate
          ? new Date(customer.annualServiceDueDate)
          : new Date();

        const nextDueDate = new Date(baseDate);
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);

        return {
          ...customer,
          annualServiceDueDate: nextDueDate.toISOString().slice(0, 10),
        };
      })
    );
  };

  const archiveQuote = (id: string) => {
    setQuotes((prev) =>
      prev.map((quote) =>
        quote.id === id ? { ...quote, archived: true } : quote
      )
    );
    if (editingQuoteId === id) {
      resetQuoteForm();
    }
  };

  const unarchiveQuote = (id: string) => {
    setQuotes((prev) =>
      prev.map((quote) =>
        quote.id === id ? { ...quote, archived: false } : quote
      )
    );
  };

  const archiveInvoice = (id: string) => {
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === id ? { ...invoice, archived: true } : invoice
      )
    );
    if (editingInvoiceId === id) {
      resetInvoiceForm();
    }
  };

  const unarchiveInvoice = (id: string) => {
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === id
          ? { ...invoice, archived: false, status: "Unpaid" }
          : invoice
      )
    );
  };

  const goToSection = (
    section: "jobs" | "customers" | "quotes" | "invoices" | "fgas"
  ) => {
    setActiveSection(section);

    requestAnimationFrame(() => {
      if (section === "jobs") {
        jobsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      if (section === "customers") {
        customersSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      if (section === "quotes") {
        quotesSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      if (section === "invoices") {
        invoicesSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      if (section === "fgas") {
        fgasSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  };  

  const responsivePage: CSSProperties = {
  
    ...page,
    padding: isMobile ? 12 : 20,
  };

  const responsiveContainer: CSSProperties = {
    ...container,
    maxWidth: isMobile ? "100%" : 1100,
  };

  const responsiveTopBar: CSSProperties = {
    ...topBar,
    alignItems: isMobile ? "flex-start" : "center",
    marginBottom: isMobile ? 16 : 20,
  };

  const responsiveGrid: CSSProperties = {
    ...grid,
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(320px, 1fr))",
    gap: isMobile ? 14 : 20,
  };

  const responsiveStatsGrid: CSSProperties = {
    ...statsGrid,
    gridTemplateColumns: isMobile
      ? "repeat(2, minmax(0, 1fr))"
      : statsGrid.gridTemplateColumns,
    gap: isMobile ? 10 : 14,
    marginBottom: isMobile ? 16 : 20,
  };

  const responsiveCard: CSSProperties = {
    ...card,
    padding: isMobile ? 14 : 18,
    borderRadius: isMobile ? 10 : 12,
  };

  const responsiveQuoteBox: CSSProperties = {
    ...quoteBox,
    padding: isMobile ? 10 : 12,
  };

  const responsiveCustomerBox: CSSProperties = {
    ...customerBox,
    padding: isMobile ? 10 : 12,
  };

  const responsiveUnitBox: CSSProperties = {
    ...unitBox,
    padding: isMobile ? 10 : 12,
  };

  const responsiveInput: CSSProperties = {
    ...input,
    padding: isMobile ? 12 : 10,
    fontSize: 16,
  };

  const stackedButtonRow: CSSProperties = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: isMobile ? "stretch" : "center",
    flexDirection: isMobile ? "column" : "row",
  };

  const responsiveCheckboxRow: CSSProperties = {
    display: "flex",
    gap: isMobile ? 10 : 16,
    flexWrap: "wrap",
    alignItems: isMobile ? "flex-start" : "center",
    marginBottom: 12,
    flexDirection: isMobile ? "column" : "row",
  };

  const responsiveCustomerHeader: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "flex-start",
  };

  const fullWidthBtn: CSSProperties = {
    ...btn,
    width: isMobile ? "100%" : "auto",
    textAlign: "center",
  };

  const fullWidthBtnSecondary: CSSProperties = {
    ...btnSecondary,
    width: isMobile ? "100%" : "auto",
    textAlign: "center",
  };

  const fullWidthSmallBtn: CSSProperties = {
    ...smallBtn,
    width: isMobile ? "100%" : "auto",
    textAlign: "center",
  };

  const responsiveDeleteBtn: CSSProperties = {
    ...deleteBtn,
    width: isMobile ? "100%" : "auto",
  };

  const responsiveJobItem: CSSProperties = {
    ...jobItem,
    padding: isMobile ? 12 : 10,
  };

  if (!loaded) {
    return (
      <div style={responsivePage}>
        <div style={responsiveContainer}>
          <img
            src="/logo.png"
            alt="What Climate"
            style={{ height: 50, marginBottom: 20, maxWidth: "100%" }}
          />
          <p style={muted}>Loading saved data...</p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-2">What Climate</h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Enter password to access the app
          </p>

          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (passwordInput === APP_PASSWORD) {
                  setUnlocked(true);
                } else {
                  alert("Incorrect password");
                }
              }
            }}
            placeholder="Enter password"
            className="w-full border rounded-lg px-4 py-3 mb-4"
          />

          <button
            onClick={() => {
              if (passwordInput === APP_PASSWORD) {
                setUnlocked(true);
              } else {
                alert("Incorrect password");
              }
            }}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700"
          >
            Unlock App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={responsivePage}>
      <div style={responsiveContainer}>
        <div style={responsiveTopBar}>
          <div style={{ minWidth: 0 }}>
            <img
              src="/logo.png"
              alt="What Climate"
              style={{ height: 50, maxWidth: "100%" }}
            />
            <p style={{ ...muted, margin: "8px 0 0 0" }}>
              Jobs, customers, quotes, invoices and F-Gas reporting in one place
            </p>
          </div>
        </div>

        <div style={responsiveStatsGrid}>
          <div style={statCard}>
            <div style={statLabel}>Jobs for {selectedDay}</div>
            <div style={statValue}>{todaysTotal}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Completed</div>
            <div style={statValue}>{todaysCompleted}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Customers</div>
            <div style={statValue}>{customers.length}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Quotes</div>
            <div style={statValue}>{quotes.length}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Invoices</div>
            <div style={statValue}>{invoices.length}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Invoice Value</div>
            <div style={statValue}>{formatMoney(invoiceValue)}</div>
          </div>
        </div>

        <div style={responsiveGrid}>
                    <section style={responsiveCard}>
            <h2 style={heading}>Quick Actions</h2>
            <div style={stackedButtonRow}>
              <button style={fullWidthBtn} onClick={() => goToSection("jobs")}>
                Add Job
              </button>
              <button
                style={fullWidthBtn}
                onClick={() => goToSection("customers")}
              >
                Customer Database
              </button>
              <button
                style={fullWidthBtn}
                onClick={() => goToSection("quotes")}
              >
                Add Quote
              </button>
              <button
                style={fullWidthBtn}
                onClick={() => goToSection("invoices")}
              >
                Invoices
              </button>
              <button style={fullWidthBtn} onClick={() => goToSection("fgas")}>
                F-Gas Reports
              </button>
            </div>
          </section>

          <section style={responsiveCard}>
            <h2 style={heading}>Backup & Restore</h2>
            <p style={{ ...muted, marginBottom: 12 }}>
              Export your app data to a backup file, or import a previous backup.
            </p>

            <div style={stackedButtonRow}>
              <button onClick={exportBackup} style={fullWidthBtn}>
                Export Backup
              </button>

              <button
                onClick={() => backupFileInputRef.current?.click()}
                style={fullWidthBtnSecondary}
              >
                Import Backup
              </button>
            </div>

            <input
              ref={backupFileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={importBackup}
              style={{ display: "none" }}
            />
          </section>

          <section style={responsiveCard}>
            <h2 style={heading}>Annual Services Due</h2>

                        {serviceDueCustomers.length === 0 ? (
              <p style={muted}>No services due in the next 30 days.</p>
            ) : (
              serviceDueCustomers.map((customer) => (
                <div key={customer.name} style={responsiveQuoteBox}>
                  <strong>{customer.name}</strong>
                  <div>{customer.address}</div>
                  <div>Due: {customer.annualServiceDueDate}</div>
                  <div>{customer.phone}</div>

                  <div style={{ ...stackedButtonRow, marginTop: 12 }}>
                    <button
                      onClick={() => markServiceComplete(customer.name)}
                      style={fullWidthBtnSecondary}
                    >
                      Mark Service Complete
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section style={responsiveCard}>
            <h2 style={heading}>Week View</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    background: selectedDay === day ? "#f97316" : "#eee",
                    color: selectedDay === day ? "#fff" : "#000",
                    flex: isMobile ? "1 1 calc(50% - 8px)" : "0 0 auto",
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </section>

                    <section
            ref={jobsSectionRef}
            style={{
              ...responsiveCard,
              border:
                activeSection === "jobs"
                  ? "2px solid #f97316"
                  : "2px solid transparent",
            }}
          >
            <h2 style={heading}>Add Job</h2>

            <input
              type="time"
              value={jobTime}
              onChange={(e) => setJobTime(e.target.value)}
              style={responsiveInput}
            />

            <input
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Enter job..."
              style={responsiveInput}
            />

            <select
              value={jobCustomer}
              onChange={(e) => setJobCustomer(e.target.value)}
              style={responsiveInput}
            >
              <option value="">Select Customer</option>
              {sortedCustomers.map((customer) => (
                <option key={customer.name} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>

            <button onClick={addJob} style={fullWidthBtn}>
              Save Job
            </button>
          </section>

          <section style={responsiveCard}>
            <h2 style={heading}>{selectedDay} Jobs</h2>

            {filteredJobs.length === 0 && (
              <p style={muted}>No jobs added for this day yet.</p>
            )}

            {filteredJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  ...responsiveJobItem,
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "stretch" : "center",
                  textDecoration: job.done ? "line-through" : "none",
                  opacity: job.done ? 0.6 : 1,
                  gap: 12,
                }}
              >
                <div
                  onClick={() => toggleJob(job.id)}
                  style={{ cursor: "pointer", flex: 1 }}
                >
                  <strong>{job.time || "No time"}</strong> — {job.text}
                  {job.customer ? (
                    <div style={{ marginTop: 6, color: "#555" }}>
                      Customer: {job.customer}
                    </div>
                  ) : null}
                </div>

                <div style={deleteActionRow}>
                  {pendingDeleteJobId === job.id ? (
                    <>
                      <button
                        onClick={() => deleteJob(job.id)}
                        style={confirmDeleteBtn}
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setPendingDeleteJobId(null)}
                        style={cancelDeleteBtn}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setPendingDeleteJobId(job.id)}
                      style={responsiveDeleteBtn}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section
            ref={customersSectionRef}
            style={{
              ...responsiveCard,
              border:
                activeSection === "customers"
                  ? "2px solid #f97316"
                  : "2px solid transparent",
            }}
          >
            <h2 style={heading}>
              {editingCustomerName
                ? `Edit Customer ${editingCustomerName}`
                : "Add to Customer Database"}
            </h2>

            {editingCustomerName ? (
              <div style={editBanner}>
                You are editing customer {editingCustomerName}
              </div>
            ) : null}

            <input
              placeholder="Contact Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={responsiveInput}
            />
            <input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={responsiveInput}
            />
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={responsiveInput}
            />
            <input
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={responsiveInput}
            />
            <input
              placeholder="Service Cost per Visit (£)"
              value={serviceCost}
              onChange={(e) => setServiceCost(e.target.value)}
              style={responsiveInput}
            />

            <label style={{ display: "block", marginBottom: 6 }}>
              Annual Service Due Date
            </label>
            <input
              type="date"
              value={annualServiceDueDate}
              onChange={(e) => setAnnualServiceDueDate(e.target.value)}
              style={responsiveInput}
            />

            <h3 style={subheading}>Units</h3>

            {units.map((unit, index) => (
              <div key={index} style={responsiveUnitBox}>
                <div style={unitTitle}>Unit {index + 1}</div>

                <select
                  value={unit.manufacturer}
                  onChange={(e) =>
                    updateUnit(index, "manufacturer", e.target.value)
                  }
                  style={responsiveInput}
                >
                  <option value="">Select Manufacturer</option>
                  {MANUFACTURERS.map((manufacturer) => (
                    <option key={manufacturer}>{manufacturer}</option>
                  ))}
                </select>

                <select
                  value={unit.unitType}
                  onChange={(e) =>
                    updateUnit(
                      index,
                      "unitType",
                      e.target.value as Unit["unitType"]
                    )
                  }
                  style={responsiveInput}
                >
                  <option value="">Select Unit Type</option>
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
                </select>

                <input
                  placeholder="Unit Location / Area"
                  value={unit.location}
                  onChange={(e) => updateUnit(index, "location", e.target.value)}
                  style={responsiveInput}
                />

                <input
                  placeholder="Model Number"
                  value={unit.model}
                  onChange={(e) => updateUnit(index, "model", e.target.value)}
                  style={responsiveInput}
                />

                <input
                  placeholder="Serial Number"
                  value={unit.serial}
                  onChange={(e) => updateUnit(index, "serial", e.target.value)}
                  style={responsiveInput}
                />

                {unit.unitType === "External" ? (
                  <>
                    <input
                      placeholder="Refrigerant Type"
                      value={unit.refrigerantType}
                      onChange={(e) =>
                        updateUnit(index, "refrigerantType", e.target.value)
                      }
                      style={responsiveInput}
                    />

                    <input
                      placeholder="Refrigerant Charge (kg)"
                      value={unit.refrigerantCharge}
                      onChange={(e) =>
                        updateUnit(index, "refrigerantCharge", e.target.value)
                      }
                      style={responsiveInput}
                    />

                    <input
                      placeholder="CO2 Equivalent (tCO2e)"
                      value={unit.co2Equivalent}
                      onChange={(e) =>
                        updateUnit(index, "co2Equivalent", e.target.value)
                      }
                      style={responsiveInput}
                    />
                  </>
                ) : null}

                {units.length > 1 ? (
                  <button onClick={() => removeUnit(index)} style={btnGhost}>
                    Remove Unit
                  </button>
                ) : null}
              </div>
            ))}

            <div style={stackedButtonRow}>
              <button onClick={addUnit} style={fullWidthBtnSecondary}>
                + Add Another Unit
              </button>
              <button onClick={saveCustomer} style={fullWidthBtn}>
                {editingCustomerName ? "Update Customer" : "Save Customer"}
              </button>
              {editingCustomerName ? (
                <button onClick={resetCustomerForm} style={fullWidthBtnSecondary}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </section>

          <section style={responsiveCard}>
            <h2 style={heading}>Customer Database</h2>

            <input
              placeholder="Search customers by name, address, phone, or email"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              style={responsiveInput}
            />

            <div style={{ ...stackedButtonRow, marginBottom: 12 }}>
              <button
                onClick={() => setSelectedLetter("All")}
                style={{
                  ...letterBtn,
                  width: isMobile ? "100%" : "auto",
                  background: selectedLetter === "All" ? "#f97316" : "#eee",
                  color: selectedLetter === "All" ? "#fff" : "#000",
                }}
              >
                All
              </button>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                {ALPHABET.map((letter) => (
                  <button
                    key={letter}
                    onClick={() => setSelectedLetter(letter)}
                    style={{
                      ...letterBtn,
                      flex: isMobile ? "1 1 calc(20% - 8px)" : "0 0 auto",
                      background: selectedLetter === letter ? "#f97316" : "#eee",
                      color: selectedLetter === letter ? "#fff" : "#000",
                    }}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            {visibleCustomers.length === 0 ? (
              <p style={muted}>No matching customers found.</p>
            ) : (
              <div style={customerListBox}>
                {visibleCustomers.map((customer) => (
                  <div key={customer.name} style={responsiveCustomerBox}>
                    <div style={responsiveCustomerHeader}>
                      <strong>{customer.name}</strong>
                      <div style={deleteActionRow}>
                        {pendingDeleteCustomerName === customer.name ? (
                          <>
                            <button
                              onClick={() => deleteCustomer(customer.name)}
                              style={confirmDeleteBtn}
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setPendingDeleteCustomerName(null)}
                              style={cancelDeleteBtn}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setPendingDeleteCustomerName(customer.name)}
                            style={responsiveDeleteBtn}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div>{customer.address}</div>
                    <div>{customer.email}</div>
                    <div>{customer.phone}</div>
                    <div>Service Cost: £{customer.serviceCost || "0"}</div>
                    <div>
                      Annual Service Due:{" "}
                      {customer.annualServiceDueDate || "Not set"}
                    </div>

                    {customer.units.length > 0 ? (
                      customer.units.map((unit, index) => (
                        <div key={index} style={unitLine}>
                          - {unit.unitType || "No type"} |{" "}
                          {unit.location || "No location"} |{" "}
                          {unit.manufacturer || "No manufacturer"} |{" "}
                          {unit.model || "No model"} |{" "}
                          {unit.serial || "No serial"}
                          {unit.unitType === "External" ? (
                            <>
                              {" "}
                              | Ref: {unit.refrigerantType || "Not set"} | Charge:{" "}
                              {unit.refrigerantCharge || "Not set"} kg | CO2e:{" "}
                              {unit.co2Equivalent || "Not set"}
                            </>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div style={unitLine}>No units added</div>
                    )}

                    <div style={{ ...stackedButtonRow, marginTop: 12 }}>
                      <button
                        style={fullWidthBtnSecondary}
                        onClick={() => startEditCustomer(customer)}
                      >
                        Edit Customer
                      </button>
                      <button
                        style={fullWidthBtnSecondary}
                        onClick={() => openFgasForCustomer(customer.name)}
                      >
                        F-Gas Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            ref={fgasSectionRef}
            style={{
              ...responsiveCard,
              border:
                activeSection === "fgas"
                  ? "2px solid #f97316"
                  : "2px solid transparent",
            }}
          >
            <h2 style={heading}>F-Gas Report Sheet</h2>

            <select
              value={fgasCustomer}
              onChange={(e) => setFgasCustomer(e.target.value)}
              style={responsiveInput}
            >
              <option value="">Select Customer</option>
              {sortedCustomers.map((customer) => (
                <option key={customer.name} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fgasReportDate}
              onChange={(e) => setFgasReportDate(e.target.value)}
              style={responsiveInput}
            />

            <input
              placeholder="Engineer Name"
              value={fgasEngineerName}
              onChange={(e) => setFgasEngineerName(e.target.value)}
              style={responsiveInput}
            />

            <input
              placeholder="Engineer Certificate Number"
              value={fgasEngineerCertificate}
              onChange={(e) => setFgasEngineerCertificate(e.target.value)}
              style={responsiveInput}
            />

            <input
              placeholder="Company Certificate Number"
              value={fgasCompanyCertificate}
              onChange={(e) => setFgasCompanyCertificate(e.target.value)}
              style={responsiveInput}
            />

            <input
              placeholder="Overall Leak Check Result"
              value={fgasLeakCheckResult}
              onChange={(e) => setFgasLeakCheckResult(e.target.value)}
              style={responsiveInput}
            />

            <textarea
              placeholder="Work Carried Out"
              value={fgasWorkCarriedOut}
              onChange={(e) => setFgasWorkCarriedOut(e.target.value)}
              style={{ ...responsiveInput, minHeight: 90, resize: "vertical" }}
            />

            <textarea
              placeholder="Visit Notes"
              value={fgasVisitNotes}
              onChange={(e) => setFgasVisitNotes(e.target.value)}
              style={{ ...responsiveInput, minHeight: 90, resize: "vertical" }}
            />

            {selectedFgasCustomer ? (
              <div style={{ marginTop: 16 }}>
                <h3 style={subheading}>Editable System Details</h3>

                {fgasUnitReports.length === 0 ? (
                                   <p style={muted}>
                    No units found for this customer. Add unit details in the
                    customer database first.
                  </p> 
                ) : (
                  fgasUnitReports.map((unit, index) => (
                    <div key={unit.id} style={responsiveUnitBox}>
                      <div style={unitTitle}>System {index + 1}</div>

                      <input
                        placeholder="Location"
                        value={unit.location}
                        onChange={(e) =>
                          updateFgasUnitReport(index, "location", e.target.value)
                        }
                        style={responsiveInput}
                      />
                      <input
                        placeholder="Manufacturer"
                        value={unit.manufacturer}
                        onChange={(e) =>
                          updateFgasUnitReport(index, "manufacturer", e.target.value)
                        }
                        style={responsiveInput}
                      />
                      <input
                        placeholder="Model"
                        value={unit.model}
                        onChange={(e) =>
                          updateFgasUnitReport(index, "model", e.target.value)
                        }
                        style={responsiveInput}
                      />
                      <input
                        placeholder="Serial"
                        value={unit.serial}
                        onChange={(e) =>
                          updateFgasUnitReport(index, "serial", e.target.value)
                        }
                        style={responsiveInput}
                      />
                     
                      {unit.unitType === "External" ? (
  <>
    <input
      placeholder="Refrigerant Type"
      value={unit.refrigerantType}
      onChange={(e) =>
        updateFgasUnitReport(index, "refrigerantType", e.target.value)
      }
      style={responsiveInput}
    />
    <input
      placeholder="Refrigerant Charge (kg)"
      value={unit.refrigerantCharge}
      onChange={(e) =>
        updateFgasUnitReport(index, "refrigerantCharge", e.target.value)
      }
      style={responsiveInput}
    />
    <input
      placeholder="CO2 Equivalent (tCO2e)"
      value={unit.co2Equivalent}
      onChange={(e) =>
        updateFgasUnitReport(index, "co2Equivalent", e.target.value)
      }
      style={responsiveInput}
    />
    <input
      placeholder="Refrigerant Added (kg)"
      value={unit.refrigerantAdded}
      onChange={(e) =>
        updateFgasUnitReport(index, "refrigerantAdded", e.target.value)
      }
      style={responsiveInput}
    />
    <input
      placeholder="Refrigerant Recovered (kg)"
      value={unit.refrigerantRecovered}
      onChange={(e) =>
        updateFgasUnitReport(index, "refrigerantRecovered", e.target.value)
      }
      style={responsiveInput}
    />
  </>
) : null}
                     

                      <select
                        value={unit.leakCheckCompleted}
                        onChange={(e) =>
                          updateFgasUnitReport(index, "leakCheckCompleted", e.target.value)
                        }
                        style={responsiveInput}
                      >
                        <option value="Yes">Leak Check Completed: Yes</option>
                        <option value="No">Leak Check Completed: No</option>
                      </select>

                      <select
                        value={unit.leakDetected}
                        onChange={(e) =>
                          updateFgasUnitReport(index, "leakDetected", e.target.value)
                        }
                        style={responsiveInput}
                      >
                        <option value="No">Leak Detected: No</option>
                        <option value="Yes">Leak Detected: Yes</option>
                      </select>

                     

                      
                      <textarea
                        placeholder="Actions Taken"
                        value={unit.actionsTaken}
                        onChange={(e) =>
                          updateFgasUnitReport(index, "actionsTaken", e.target.value)
                        }
                        style={{ ...responsiveInput, minHeight: 80, resize: "vertical" }}
                      />

                      <textarea
                        placeholder="System Notes"
                        value={unit.notes}
                        onChange={(e) =>
                          updateFgasUnitReport(index, "notes", e.target.value)
                        }
                        style={{ ...responsiveInput, minHeight: 80, resize: "vertical" }}
                      />
                    </div>
                  ))
                )}
              </div>
            ) : null}

            <div style={stackedButtonRow}>
              <button
                onClick={saveFgasPdf}
                style={fullWidthBtn}
                disabled={!selectedFgasCustomer}
              >
                Save F-Gas PDF
              </button>
            </div>

            {!selectedFgasCustomer ? (
              <p style={{ ...muted, marginTop: 12 }}>
                Select a customer to generate a pre-filled editable F-Gas report.
              </p>
            ) : (
              <div style={{ marginTop: 18 }}>
                <div style={reportCard}>
                  <div style={reportTitle}>F-Gas Inspection Report Preview</div>

                                    <div style={reportGrid}>
                    <div>
                      <strong>Customer:</strong> {selectedFgasCustomer.name}
                    </div>
                    <div>
                      <strong>Report Date:</strong> {fgasReportDate || "Not set"}
                    </div>
                    <div>
                      <strong>Customer Address:</strong>{" "}
                      {selectedFgasCustomer.address || "Not set"}
                    </div>
                    <div>
                      <strong>Customer Email:</strong>{" "}
                      {selectedFgasCustomer.email || "Not set"}
                    </div>
                    <div>
                      <strong>Customer Phone:</strong>{" "}
                      {selectedFgasCustomer.phone || "Not set"}
                    </div>
                    <div>
                      <strong>Engineer:</strong> {fgasEngineerName || "Not set"}
                    </div>
                    <div>
                      <strong>Engineer Cert:</strong>{" "}
                      {fgasEngineerCertificate || "Not set"}
                    </div>
                    <div>
                      <strong>Company Cert:</strong>{" "}
                      {fgasCompanyCertificate || "Not set"}
                    </div>
                    <div>
                      <strong>Company Name:</strong> What Climate Limited
                    </div>
                    <div>
                      <strong>Company Address:</strong> 8 The Dales, Harwich, Essex, CO12 4XH
                    </div>
                    <div>
                      <strong>Overall Leak Check Result:</strong>{" "}
                      {fgasLeakCheckResult || "Not set"}
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <strong>Work Carried Out:</strong>
                    <div style={reportTextBox}>
                      {fgasWorkCarriedOut || "No work recorded."}
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <strong>Visit Notes:</strong>
                    <div style={reportTextBox}>
                      {fgasVisitNotes || "No notes recorded."}
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <strong>System Register</strong>

                    {fgasUnitReports.length === 0 ? (
                      <div style={{ ...reportTextBox, marginTop: 10 }}>
                        No units found for this customer. Add unit
                        details in the customer database to generate the F-Gas sheet.
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                        {fgasUnitReports.map((unit, index) => (
                                                    <div key={unit.id} style={reportUnitCard}>
                            <div style={unitTitle}>
                              System {index + 1} - {unit.unitType || "Not set"}
                            </div>
                            <div><strong>Location:</strong> {unit.location || "Not set"}</div>
                            <div><strong>Manufacturer:</strong> {unit.manufacturer || "Not set"}</div>
                            <div><strong>Model:</strong> {unit.model || "Not set"}</div>
                            <div><strong>Serial:</strong> {unit.serial || "Not set"}</div>

                            {unit.unitType === "External" ? (
                              <>
                                <div><strong>Refrigerant Type:</strong> {unit.refrigerantType || "Not set"}</div>
                                <div><strong>Refrigerant Charge:</strong> {unit.refrigerantCharge || "Not set"} kg</div>
                                <div><strong>CO2 Equivalent:</strong> {unit.co2Equivalent || "Not set"} tCO2e</div>
                              </>
                            ) : null}

                            <div><strong>Leak Check Completed:</strong> {unit.leakCheckCompleted || "Not set"}</div>
                            <div><strong>Leak Detected:</strong> {unit.leakDetected || "Not set"}</div>
                            <div><strong>Actions Taken:</strong> {unit.actionsTaken || "None"}</div>
                            <div><strong>System Notes:</strong> {unit.notes || "None"}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section
            ref={quotesSectionRef}
            style={{
              ...responsiveCard,
              border:
                activeSection === "quotes"
                  ? "2px solid #f97316"
                  : "2px solid transparent",
            }}
          >
            <h2 style={heading}>
              {editingQuoteId ? `Edit Quote ${editingQuoteId}` : "Quotes"}
            </h2>

            {editingQuoteId ? (
              <div style={editBanner}>
                You are editing quote {editingQuoteId}
              </div>
            ) : null}

            <select
              value={quoteCustomer}
              onChange={(e) => setQuoteCustomer(e.target.value)}
              style={responsiveInput}
            >
              <option value="">Select Customer</option>
              {sortedCustomers.map((customer) => (
                <option key={customer.name} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>

            <select
              value={quoteSiteCustomer}
              onChange={(e) => setQuoteSiteCustomer(e.target.value)}
              style={responsiveInput}
            >
              <option value="">Select Site Details</option>
              {sortedCustomers.map((customer) => (
                <option key={customer.name} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Quote description"
              value={quoteDescription}
              onChange={(e) => setQuoteDescription(e.target.value)}
              style={responsiveInput}
            />

            <textarea
              placeholder="Please note"
              value={quoteNote}
              onChange={(e) => setQuoteNote(e.target.value)}
              style={{ ...responsiveInput, minHeight: 100, resize: "vertical" }}
            />

            <input
              placeholder="Quote amount (£)"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              style={responsiveInput}
            />

            <select
              value={quoteVatRate}
              onChange={(e) => setQuoteVatRate(Number(e.target.value) as 0 | 20)}
              style={responsiveInput}
            >
              <option value={0}>0% VAT</option>
              <option value={20}>20% VAT</option>
            </select>

            <select
              value={quoteStatus}
              onChange={(e) => setQuoteStatus(e.target.value as Quote["status"])}
              style={responsiveInput}
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Approved">Approved</option>
              <option value="Invoiced">Invoiced</option>
            </select>

            <div style={stackedButtonRow}>
              <button onClick={saveQuote} style={fullWidthBtn}>
                {editingQuoteId ? "Update Quote" : "Save Quote"}
              </button>

              <button onClick={previewQuote} style={fullWidthBtnSecondary}>
                Preview Quote
              </button>

              {editingQuoteId ? (
                <button onClick={resetQuoteForm} style={fullWidthBtnSecondary}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
            <div style={{ marginTop: 16 }}>
              <h3 style={subheading}>Active Quotes</h3>

              {activeQuotes.length === 0 ? (
                <p style={muted}>No active quotes.</p>
              ) : (
                activeQuotes.map((quote) => (
                  <div key={quote.id} style={responsiveQuoteBox}>
                    <div style={responsiveCustomerHeader}>
                      <div>
                        <strong>{quote.id}</strong>
                        <div style={{ color: "#555", marginTop: 4 }}>
                          {quote.customer}
                        </div>
                      </div>
                      <div style={deleteActionRow}>
                        {pendingDeleteQuoteId === quote.id ? (
                          <>
                            <button
                              onClick={() => deleteQuote(quote.id)}
                              style={confirmDeleteBtn}
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setPendingDeleteQuoteId(null)}
                              style={cancelDeleteBtn}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setPendingDeleteQuoteId(quote.id)}
                            style={responsiveDeleteBtn}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 8 }}>{quote.description}</div>
                    <div style={{ marginTop: 8 }}>Amount: £{quote.amount}</div>
                    <div style={{ marginTop: 8 }}>VAT: {quote.vatRate}%</div>
                    <div style={{ marginTop: 8 }}>
                      Notes: {quote.note || "None"}
                    </div>
                    <div style={{ marginTop: 8 }}>Created: {quote.createdAt}</div>
                    <div style={{ marginTop: 8 }}>
                      Email: {quote.customerEmail || "No email"}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      Address: {quote.siteAddress || "No address"}
                    </div>

                    <div style={{ ...stackedButtonRow, marginTop: 12 }}>
                      <button
                        style={fullWidthSmallBtn}
                        onClick={() => updateQuoteStatus(quote.id, "Draft")}
                      >
                        Draft
                      </button>
                      <button
                        style={fullWidthSmallBtn}
                        onClick={() => updateQuoteStatus(quote.id, "Sent")}
                      >
                        Sent
                      </button>
                      <button
                        style={fullWidthSmallBtn}
                        onClick={() => updateQuoteStatus(quote.id, "Approved")}
                      >
                        Approved
                      </button>

                      <button
                        style={fullWidthBtnSecondary}
                        onClick={() => startEditQuote(quote)}
                      >
                        Edit
                      </button>

                      <button
                        style={fullWidthBtnSecondary}
                        onClick={() => previewSavedQuote(quote)}
                      >
                        Preview
                      </button>

                      <button
                        style={fullWidthBtnSecondary}
                        onClick={() => convertQuoteToInvoice(quote)}
                        disabled={quote.status === "Invoiced"}
                      >
                        Convert to Invoice
                      </button>

                      <button
                        style={fullWidthBtnSecondary}
                        onClick={() => archiveQuote(quote.id)}
                      >
                        Archive
                      </button>

                      <span
                        style={{
                          ...statusPill(quote.status),
                          justifyContent: "center",
                          width: isMobile ? "100%" : "auto",
                        }}
                      >
                        {quote.status}
                      </span>
                    </div>
                  </div>
                ))
              )}

              <h3 style={{ ...subheading, marginTop: 24 }}>Archived Quotes</h3>

              {archivedQuotes.length === 0 ? (
                <p style={muted}>No archived quotes.</p>
              ) : (
                archivedQuotes.map((quote) => (
                  <div key={quote.id} style={responsiveQuoteBox}>
                    <div style={responsiveCustomerHeader}>
                      <div>
                        <strong>{quote.id}</strong>
                        <div style={{ color: "#555", marginTop: 4 }}>
                          {quote.customer}
                        </div>
                      </div>
                      <span
                        style={{
                          ...statusPill("Archived"),
                          justifyContent: "center",
                          width: isMobile ? "100%" : "auto",
                        }}
                      >
                        Archived
                      </span>
                    </div>

                    <div style={{ marginTop: 8 }}>{quote.description}</div>
                    <div style={{ marginTop: 8 }}>Amount: £{quote.amount}</div>
                    <div style={{ marginTop: 8 }}>Created: {quote.createdAt}</div>

                    <div style={{ ...stackedButtonRow, marginTop: 12 }}>
                      <button
                        style={fullWidthBtnSecondary}
                        onClick={() => previewSavedQuote(quote)}
                      >
                        Preview
                      </button>

                      <button
                        style={fullWidthBtnSecondary}
                        onClick={() => unarchiveQuote(quote.id)}
                      >
                        Unarchive
                      </button>

                      <button
                        style={fullWidthBtnSecondary}
                        onClick={() => startEditQuote(quote)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
          </section>

               <section
            ref={invoicesSectionRef}
            style={{
              ...responsiveCard,
              border:
                activeSection === "invoices"
                  ? "2px solid #f97316"
                  : "2px solid transparent",
            }}
          >
            <h2 style={heading}>
              {editingInvoiceId ? `Edit Invoice ${editingInvoiceId}` : "Invoices"}
            </h2>

            {editingInvoiceId ? (
              <div style={editBanner}>
                You are editing invoice {editingInvoiceId}
              </div>
            ) : null}

            <select
              value={invoiceCustomer}
              onChange={(e) => setInvoiceCustomer(e.target.value)}
              style={responsiveInput}
            >
              <option value="">Select Customer</option>
              {sortedCustomers.map((customer) => (
                <option key={customer.name} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Customer Address"
              value={invoiceCustomerAddress}
              onChange={(e) => setInvoiceCustomerAddress(e.target.value)}
              style={responsiveInput}
            />

            <input
              placeholder="Site Name"
              value={invoiceSiteName}
              onChange={(e) => setInvoiceSiteName(e.target.value)}
              style={responsiveInput}
            />

            <input
              placeholder="Site Address"
              value={invoiceSiteAddress}
              onChange={(e) => setInvoiceSiteAddress(e.target.value)}
              style={responsiveInput}
            />

            <textarea
              placeholder="Invoice description"
              value={invoiceDescription}
              onChange={(e) => setInvoiceDescription(e.target.value)}
              style={{ ...responsiveInput, minHeight: 90, resize: "vertical" }}
            />

            <div style={responsiveCheckboxRow}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={reverseVat}
                  onChange={(e) => setReverseVat(e.target.checked)}
                />
                Reverse VAT
              </label>

              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={applyCis}
                  onChange={(e) => setApplyCis(e.target.checked)}
                />
                CIS Deduction
              </label>

              <select
                value={invoiceVatRate}
                onChange={(e) =>
                  setInvoiceVatRate(Number(e.target.value) as 0 | 20)
                }
                style={responsiveInput}
                disabled={reverseVat}
              >
                <option value={0}>0% VAT</option>
                <option value={20}>20% VAT</option>
              </select>
            </div>

            {!applyCis ? (
              <input
                placeholder="Subtotal (£)"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                style={responsiveInput}
              />
            ) : (
              <>
                <input
                  placeholder="Materials (£)"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  style={responsiveInput}
                />

                <input
                  placeholder="Labour (£)"
                  value={labour}
                  onChange={(e) => setLabour(e.target.value)}
                  style={responsiveInput}
                />

                <input
                  placeholder="CIS %"
                  value={cisPercent}
                  onChange={(e) => setCisPercent(Number(e.target.value))}
                  style={responsiveInput}
                />
              </>
            )}

            <input
              placeholder="Payment Terms"
              value={invoicePaymentTerms}
              onChange={(e) => setInvoicePaymentTerms(e.target.value)}
              style={responsiveInput}
            />

            <input
              placeholder="PO Number"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              style={responsiveInput}
            />

            <div style={stackedButtonRow}>
              <button onClick={saveInvoice} style={fullWidthBtn}>
                {editingInvoiceId ? "Update Invoice" : "Save Invoice"}
              </button>

              {editingInvoiceId ? (
                <button onClick={resetInvoiceForm} style={fullWidthBtnSecondary}>
                  Cancel Edit
                </button>
              ) : null}
            </div>

            <div style={{ marginTop: 16 }}>
              <h3 style={subheading}>Active Invoices</h3>

              {activeInvoices.length === 0 ? (
                <p style={muted}>No active invoices.</p>
              ) : (
                activeInvoices.map((invoice) => {
                  const values = getInvoiceValues(invoice);

                  return (
                    <div key={invoice.id} style={responsiveQuoteBox}>
                      <div style={responsiveCustomerHeader}>
                        <div>
                          <strong>{invoice.id}</strong>
                          <div style={{ color: "#555", marginTop: 4 }}>
                            {invoice.customer}
                          </div>
                        </div>
                        <div style={deleteActionRow}>
                          {pendingDeleteInvoiceId === invoice.id ? (
                            <>
                              <button
                                onClick={() => deleteInvoice(invoice.id)}
                                style={confirmDeleteBtn}
                              >
                                Confirm Delete
                              </button>
                              <button
                                onClick={() => setPendingDeleteInvoiceId(null)}
                                style={cancelDeleteBtn}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setPendingDeleteInvoiceId(invoice.id)}
                              style={responsiveDeleteBtn}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        Description: {invoice.description || "None"}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        VAT Rate: {invoice.vatRate}%
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Reverse VAT: {invoice.reverseVat ? "Yes" : "No"}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        CIS Applied: {invoice.applyCis ? "Yes" : "No"}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Materials: {formatMoney(toNumber(invoice.materials))}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Labour: {formatMoney(toNumber(invoice.labour))}
                      </div>

                      {invoice.applyCis && (
                        <div style={{ marginTop: 8 }}>
                          CIS Deduction: -{formatMoney(values.cis)}
                        </div>
                      )}

                      <div style={{ marginTop: 8 }}>
                        Subtotal: {formatMoney(values.subtotal)}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        VAT: {formatMoney(values.vat)}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Total: {formatMoney(values.total)}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Created: {invoice.createdAt}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Email: {invoice.customerEmail || "No email"}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Address: {invoice.siteAddress || invoice.customerAddress || "No address"}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Payment Terms: {invoice.paymentTerms || "30 Days"}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        PO Number: {invoice.poNumber || "None"}
                      </div>

                      {invoice.reverseVat && (
                        <div style={{ marginTop: 8 }}>
                          Reverse charge wording will show on the invoice preview.
                        </div>
                      )}

                      <div style={{ ...stackedButtonRow, marginTop: 12 }}>
                        <button
                          style={fullWidthSmallBtn}
                          onClick={() => toggleInvoicePaid(invoice.id)}
                        >
                          Mark {invoice.status === "Paid" ? "Unpaid" : "Paid"}
                        </button>

                        <button
                          style={fullWidthBtnSecondary}
                          onClick={() => startEditInvoice(invoice)}
                        >
                          Edit
                        </button>

                        <button
                          style={fullWidthBtnSecondary}
                          onClick={() => previewInvoice(invoice)}
                        >
                          Preview Invoice
                        </button>

                        <button
                          style={fullWidthBtnSecondary}
                          onClick={() => archiveInvoice(invoice.id)}
                        >
                          Archive
                        </button>

                        <span
                          style={{
                            ...statusPill(invoice.status),
                            justifyContent: "center",
                            width: isMobile ? "100%" : "auto",
                          }}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              <h3 style={{ ...subheading, marginTop: 24 }}>Archived Invoices</h3>

              {archivedInvoices.length === 0 ? (
                <p style={muted}>No archived invoices.</p>
              ) : (
                archivedInvoices.map((invoice) => {
                  const values = getInvoiceValues(invoice);

                  return (
                    <div key={invoice.id} style={responsiveQuoteBox}>
                      <div style={responsiveCustomerHeader}>
                        <div>
                          <strong>{invoice.id}</strong>
                          <div style={{ color: "#555", marginTop: 4 }}>
                            {invoice.customer}
                          </div>
                        </div>
                        <span
                          style={{
                            ...statusPill("Archived"),
                            justifyContent: "center",
                            width: isMobile ? "100%" : "auto",
                          }}
                        >
                          Archived
                        </span>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        Description: {invoice.description || "None"}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Total: {formatMoney(values.total)}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        Created: {invoice.createdAt}
                      </div>

                      <div style={{ ...stackedButtonRow, marginTop: 12 }}>
                        <button
                          style={fullWidthBtnSecondary}
                          onClick={() => previewInvoice(invoice)}
                        >
                          Preview Invoice
                        </button>

                        <button
                          style={fullWidthBtnSecondary}
                          onClick={() => unarchiveInvoice(invoice.id)}
                        >
                          Unarchive
                        </button>

                        <button
                          style={fullWidthBtnSecondary}
                          onClick={() => startEditInvoice(invoice)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}     


const page: CSSProperties = {
  background: "#f5f5f5",
  minHeight: "100vh",
  padding: 20,
  fontFamily: "Arial, sans-serif",
};

const container: CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
};

const topBar: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 20,
  flexWrap: "wrap",
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 20,
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
  marginBottom: 20,
};

const statCard: CSSProperties = {
  background: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
};

const statLabel: CSSProperties = {
  fontSize: 13,
  color: "#666",
  marginBottom: 8,
};

const statValue: CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  color: "#111",
};

const card: CSSProperties = {
  background: "#ffffff",
  borderRadius: 12,
  padding: 18,
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
};

const heading: CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
};

const subheading: CSSProperties = {
  marginTop: 18,
  marginBottom: 10,
};

const input: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  marginBottom: 10,
  border: "1px solid #ddd",
  borderRadius: 8,
};

const btn: CSSProperties = {
  background: "#f97316",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
};

const btnSecondary: CSSProperties = {
  background: "#fff",
  color: "#f97316",
  border: "1px solid #f97316",
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
};

const btnGhost: CSSProperties = {
  background: "transparent",
  color: "#d9480f",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

const smallBtn: CSSProperties = {
  background: "#fff7ed",
  color: "#c2410c",
  border: "1px solid #fdba74",
  padding: "6px 10px",
  borderRadius: 8,
  cursor: "pointer",
};

const deleteBtn: CSSProperties = {
  background: "red",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
};

const confirmDeleteBtn: CSSProperties = {
  background: "#b91c1c",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
};

const cancelDeleteBtn: CSSProperties = {
  background: "#fff",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
};

const deleteActionRow: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const letterBtn: CSSProperties = {
  border: "none",
  borderRadius: 6,
  padding: "8px 10px",
  cursor: "pointer",
  minWidth: 36,
};

const checkboxLabel: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const jobItem: CSSProperties = {
  padding: 10,
  marginBottom: 8,
  background: "#f1f1f1",
  borderRadius: 8,
};

const unitBox: CSSProperties = {
  background: "#f7f7f7",
  padding: 12,
  borderRadius: 10,
  marginBottom: 12,
};

const customerListBox: CSSProperties = {
  maxHeight: 420,
  overflowY: "auto",
};

const customerBox: CSSProperties = {
  background: "#f7f7f7",
  padding: 12,
  borderRadius: 10,
  marginBottom: 12,
};

const quoteBox: CSSProperties = {
  background: "#f7f7f7",
  padding: 12,
  borderRadius: 10,
  marginBottom: 12,
};

const unitLine: CSSProperties = {
  marginTop: 6,
  marginLeft: 8,
  fontSize: 14,
  wordBreak: "break-word",
};

const muted: CSSProperties = {
  color: "#666",
};

const editBanner: CSSProperties = {
  background: "#fff7ed",
  color: "#c2410c",
  border: "1px solid #fdba74",
  borderRadius: 8,
  padding: "10px 12px",
  marginBottom: 12,
  fontWeight: 600,
};

const unitTitle: CSSProperties = {
  fontWeight: 700,
  marginBottom: 10,
  color: "#111",
};

const reportCard: CSSProperties = {
  background: "#fafafa",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
};

const reportTitle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 16,
};

const reportGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
};

const reportTextBox: CSSProperties = {
  marginTop: 8,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 10,
  minHeight: 48,
  whiteSpace: "pre-wrap",
};

const reportUnitCard: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
  display: "grid",
  gap: 6,
};

const statusPill = (status: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background:
    status === "Approved"
      ? "#dcfce7"
      : status === "Sent"
      ? "#dbeafe"
      : status === "Invoiced"
      ? "#ede9fe"
      : status === "Paid"
      ? "#dcfce7"
      : "#f3f4f6",
  color:
    status === "Approved"
      ? "#166534"
      : status === "Sent"
      ? "#1d4ed8"
      : status === "Invoiced"
      ? "#6d28d9"
      : status === "Paid"
      ? "#166534"
      : "#374151",
  fontSize: 13,
  fontWeight: 600,
});
