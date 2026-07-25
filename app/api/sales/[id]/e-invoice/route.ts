import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const GST_STATE_CODES: Record<string, string> = {
  "Andhra Pradesh": "37", "Arunachal Pradesh": "12", "Assam": "18", "Bihar": "10",
  "Chhattisgarh": "22", "Goa": "30", "Gujarat": "24", "Haryana": "06",
  "Himachal Pradesh": "02", "Jharkhand": "20", "Karnataka": "29", "Kerala": "32",
  "Madhya Pradesh": "23", "Maharashtra": "27", "Manipur": "14", "Meghalaya": "17",
  "Mizoram": "15", "Nagaland": "13", "Odisha": "21", "Punjab": "03",
  "Rajasthan": "08", "Sikkim": "11", "Tamil Nadu": "33", "Telangana": "36",
  "Tripura": "16", "Uttar Pradesh": "09", "Uttarakhand": "05", "West Bengal": "19",
  "Andaman and Nicobar": "35", "Chandigarh": "04", "Dadra and Nagar Haveli": "26",
  "Daman and Diu": "25", "Delhi": "07", "Jammu and Kashmir": "01", "Ladakh": "38",
  "Lakshadweep": "31", "Puducherry": "34",
};

function buildGstnPayload(sale: any, items: any[]) {
  const branch = sale.branch;
  const sellerCode = GST_STATE_CODES[branch.state] || "27";
  const buyerStateCode = sale.patient?.state ? GST_STATE_CODES[sale.patient.state] : sellerCode;
  const isInterState = sellerCode !== buyerStateCode;

  const itemList = items.map((item: any, idx: number) => ({
    sl_no: idx + 1,
    prd_desc: item.medicine?.name || "",
    hsn_cd: item.medicine?.hsnCode || "3004",
    qty: item.quantity,
    unit: item.medicine?.unitOfMeasure || "PCS",
    unit_price: item.unitPrice,
    tot_amt: item.unitPrice * item.quantity,
    discount: item.discountAmount || 0,
    gst_rt: item.gstRate,
    txval: item.totalAmount - item.cgstAmount - item.sgstAmount,
    igst_amt: isInterState ? item.cgstAmount + item.sgstAmount : 0,
    cgst_amt: isInterState ? 0 : item.cgstAmount,
    sgst_amt: isInterState ? 0 : item.sgstAmount,
    tot_item_val: item.totalAmount,
  }));

  return {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: "N",
      IgstOnIntra: isInterState ? "Y" : "N",
    },
    DocDtls: {
      Typ: "INV",
      No: sale.invoiceNumber,
      Dt: new Date(sale.createdAt).toISOString().split("T")[0],
    },
    SellerDtls: {
      Gstin: branch.gstin || "",
      LglNm: branch.name,
      Addr1: branch.address,
      Loc: branch.city,
      Pin: branch.pincode,
      Stcd: sellerCode,
    },
    BuyerDtls: {
      Gstin: sale.patient?.gstin || "URP",
      LglNm: sale.patient?.name || "Walk-in Customer",
      Addr1: sale.patient?.address || "",
      Loc: sale.patient?.city || branch.city,
      Pin: sale.patient?.pincode || branch.pincode,
      Stcd: buyerStateCode,
      Pos: buyerStateCode,
    },
    ItemList: itemList,
    ValDtls: {
      TotVal: sale.subtotal,
      AssVal: sale.taxableAmount,
      TotGstVal: sale.totalGst,
      IgstVal: isInterState ? sale.totalGst : 0,
      CgstVal: isInterState ? 0 : sale.cgstAmount,
      SgstVal: isInterState ? 0 : sale.sgstAmount,
      OthChrg: 0,
      RndOffAmt: sale.roundOff,
      TotInvVal: sale.finalAmount,
    },
    PayDtls: {
      PayTerm: "Immediate",
      PayMode: sale.paymentMode?.toUpperCase() || "CASH",
    },
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const saleId = (await params).id;
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        branch: true,
        patient: true,
        items: { include: { medicine: true } },
      },
    });
    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    if (sale.eInvoiceId) return NextResponse.json({ error: "E-invoice already generated" }, { status: 400 });

    const payload = buildGstnPayload(sale, sale.items);
    const eInvoiceId = `EI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const updated = await prisma.sale.update({
      where: { id: saleId },
      data: { eInvoiceId },
    });

    await prisma.auditLog.create({
      data: {
        userId: sale.cashierId,
        action: "E_INVOICE_GENERATED",
        entityType: "sale",
        entityId: sale.invoiceNumber,
        newData: JSON.stringify({ eInvoiceId, payload }),
      },
    });

    return NextResponse.json({
      success: true,
      eInvoiceId,
      payload,
      note: "This JSON matches the GSTN e-invoice schema. Upload to GST portal (or API integration pending).",
    });
  } catch (error) {
    console.error("Error generating e-invoice:", error);
    return NextResponse.json({ error: "Failed to generate e-invoice" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const saleId = (await params).id;
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        branch: true,
        patient: true,
        items: { include: { medicine: true } },
      },
    });
    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    if (!sale.eInvoiceId) return NextResponse.json({ error: "No e-invoice generated yet" }, { status: 404 });

    const payload = buildGstnPayload(sale, sale.items);
    return NextResponse.json({ eInvoiceId: sale.eInvoiceId, payload });
  } catch {
    return NextResponse.json({ error: "Failed to fetch e-invoice" }, { status: 500 });
  }
}
