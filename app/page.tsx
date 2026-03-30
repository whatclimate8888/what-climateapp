"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = {
  name: string;
  address: string;
  email: string;
  phone: string;
};

type Quote = {
  id: string;
  customer: string;
  customerAddress: string;
  siteName: string;
  siteAddress: string;
  description: string;
  amount: string;
  vatRate: 0 | 20;
  status: string;
};

type Invoice = {
  id: string;
  customer: string;
  customerAddress: string;
  siteName: string;
  siteAddress: string;
  description: string;
  materials: string;
  labour: string;
  vatRate: 0 | 20;
  reverseVat: boolean;
  applyCis: boolean;
  cisPercent: number;
  status: string;
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 12,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 16,
};

const btn: React.CSSProperties = {
  width: "100%",
  padding: 12,
  background: "#f97316",
  color: "#fff",
  border: "none",
  borderRadius: 8,
};

export default function Home() {
  // ---------------- CUSTOMERS ----------------
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  // ---------------- QUOTES ----------------
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteCustomer, setQuoteCustomer] = useState("");
  const [quoteCustomerAddress, setQuoteCustomerAddress] = useState("");
  const [quoteSiteName, setQuoteSiteName] = useState("");
  const [quoteSiteAddress, setQuoteSiteAddress] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteVatRate, setQuoteVatRate] = useState<0 | 20>(20);

  // ---------------- INVOICES ----------------
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceCustomer, setInvoiceCustomer] = useState("");
  const [invoiceCustomerAddress, setInvoiceCustomerAddress] = useState("");
  const [invoiceSiteName, setInvoiceSiteName] = useState("");
  const [invoiceSiteAddress, setInvoiceSiteAddress] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");

  const [materials, setMaterials] = useState("");
  const [labour, setLabour] = useState("");

  const [vatRate, setVatRate] = useState<0 | 20>(20);
  const [reverseVat, setReverseVat] = useState(false);

  const [applyCis, setApplyCis] = useState(false);
  const [cisPercent, setCisPercent] = useState(20);

  // ---------------- AUTO ADDRESS ----------------
  useEffect(() => {
    const c = customers.find(c => c.name === quoteCustomer);
    setQuoteCustomerAddress(c?.address || "");
  }, [quoteCustomer, customers]);

  useEffect(() => {
    const c = customers.find(c => c.name === invoiceCustomer);
    setInvoiceCustomerAddress(c?.address || "");
  }, [invoiceCustomer, customers]);

  // ---------------- SAVE CUSTOMER ----------------
  const saveCustomer = () => {
    setCustomers(prev => [...prev, { name, address, email: "", phone: "" }]);
    setName("");
    setAddress("");
  };

  // ---------------- SAVE QUOTE ----------------
  const saveQuote = () => {
    const newQuote: Quote = {
      id: "Q-" + Date.now(),
      customer: quoteCustomer,
      customerAddress: quoteCustomerAddress,
      siteName: quoteSiteName,
      siteAddress: quoteSiteAddress,
      description: quoteDescription,
      amount: quoteAmount,
      vatRate: quoteVatRate,
      status: "Draft",
    };

    setQuotes(prev => [newQuote, ...prev]);
  };

  // ---------------- CALC INVOICE ----------------
  const calc = () => {
    const m = Number(materials || 0);
    const l = Number(labour || 0);

    const subtotal = m + l;
    const vat = reverseVat ? 0 : subtotal * (vatRate / 100);
    const cis = applyCis ? l * (cisPercent / 100) : 0;

    const total = subtotal + vat - cis;

    return { subtotal, vat, cis, total };
  };

  // ---------------- SAVE INVOICE ----------------
  const saveInvoice = () => {
    const newInvoice: Invoice = {
      id: "INV-" + Date.now(),
      customer: invoiceCustomer,
      customerAddress: invoiceCustomerAddress,
      siteName: invoiceSiteName,
      siteAddress: invoiceSiteAddress,
      description: invoiceDescription,
      materials,
      labour,
      vatRate,
      reverseVat,
      applyCis,
      cisPercent,
      status: "Unpaid",
    };

    setInvoices(prev => [newInvoice, ...prev]);
  };

  const totals = calc();

  return (
    <div style={{ padding: 14, maxWidth: 900, margin: "0 auto" }}>

      {/* CUSTOMER */}
      <h2>Add Customer</h2>
      <input style={input} placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input style={input} placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} />
      <button style={btn} onClick={saveCustomer}>Save Customer</button>

      {/* QUOTE */}
      <h2>Quote</h2>
      <select style={input} value={quoteCustomer} onChange={e => setQuoteCustomer(e.target.value)}>
        <option value="">Select Customer</option>
        {customers.map(c => <option key={c.name}>{c.name}</option>)}
      </select>

      <input style={input} value={quoteCustomerAddress} readOnly placeholder="Customer Address" />
      <input style={input} placeholder="Site Name" value={quoteSiteName} onChange={e => setQuoteSiteName(e.target.value)} />
      <input style={input} placeholder="Site Address" value={quoteSiteAddress} onChange={e => setQuoteSiteAddress(e.target.value)} />
      <input style={input} placeholder="Description" value={quoteDescription} onChange={e => setQuoteDescription(e.target.value)} />
      <input style={input} placeholder="Amount" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} />

      <button style={btn} onClick={saveQuote}>Save Quote</button>

      {/* INVOICE */}
      <h2>Invoice</h2>

      <select style={input} value={invoiceCustomer} onChange={e => setInvoiceCustomer(e.target.value)}>
        <option value="">Select Customer</option>
        {customers.map(c => <option key={c.name}>{c.name}</option>)}
      </select>

      <input style={input} value={invoiceCustomerAddress} readOnly placeholder="Customer Address" />
      <input style={input} placeholder="Site Name" value={invoiceSiteName} onChange={e => setInvoiceSiteName(e.target.value)} />
      <input style={input} placeholder="Site Address" value={invoiceSiteAddress} onChange={e => setInvoiceSiteAddress(e.target.value)} />
      <textarea style={input} placeholder="Description" value={invoiceDescription} onChange={e => setInvoiceDescription(e.target.value)} />

      <input style={input} placeholder="Materials" value={materials} onChange={e => setMaterials(e.target.value)} />
      <input style={input} placeholder="Labour" value={labour} onChange={e => setLabour(e.target.value)} />

      <label>
        <input type="checkbox" checked={applyCis} onChange={e => setApplyCis(e.target.checked)} />
        CIS
      </label>

      <label>
        <input type="checkbox" checked={reverseVat} onChange={e => setReverseVat(e.target.checked)} />
        Reverse VAT
      </label>

      <div style={{ marginTop: 10 }}>
        <div>Subtotal: £{totals.subtotal}</div>
        <div>VAT: £{totals.vat}</div>
        <div>CIS: -£{totals.cis}</div>
        <strong>Total: £{totals.total}</strong>
      </div>

      <button style={{ ...btn, marginTop: 10 }} onClick={saveInvoice}>
        Save Invoice
      </button>

    </div>
  );
}
