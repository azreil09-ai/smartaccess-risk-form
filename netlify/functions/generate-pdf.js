const { jsPDF } = require("jspdf");

exports.handler = async function(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // ── Fonts & helpers ──
    const W = 210, M = 14;
    let y = 0;

    function addPage() {
      pdf.addPage();
      y = 14;
    }

    function checkY(needed) {
      if (y + needed > 280) addPage();
    }

    function hLine(yPos, color) {
      pdf.setDrawColor(color || "#e2e5ed");
      pdf.setLineWidth(0.3);
      pdf.line(M, yPos, W - M, yPos);
    }

    function rtlText(txt, x, yPos, opts) {
      // jsPDF doesn't natively support RTL/Hebrew unicode well,
      // so we reverse for display and use built-in font
      if (!txt) return;
      pdf.text(String(txt), x, yPos, opts || {});
    }

    // ── HEADER ──
    pdf.setFillColor(15, 28, 53);
    pdf.roundedRect(M, 8, W - M * 2, 52, 4, 4, "F");

    // Gold accent line
    pdf.setFillColor(201, 168, 76);
    pdf.roundedRect(M, 8, 3, 52, 2, 2, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Risk Management Form", W - M - 2, 22, { align: "right" });
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("Rope Access Work", W - M - 2, 30, { align: "right" });

    pdf.setFontSize(8);
    pdf.setTextColor(201, 168, 76);
    pdf.text("ISO 45001  |  IRATA / EN 363  |  IS 5568", W - M - 2, 40, { align: "right" });

    pdf.setTextColor(180, 190, 210);
    pdf.setFontSize(8);
    const formId = "RM-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    pdf.text(formId, M + 6, 55);

    pdf.setTextColor(255,255,255);
    pdf.setFontSize(9);
    const generatedAt = new Date().toLocaleDateString("he-IL");
    pdf.text("Powered by SmartAccess", W - M - 2, 55, { align: "right" });

    y = 70;

    // ── SECTION HEADER ──
    function secHeader(title, subtitle) {
      checkY(14);
      pdf.setFillColor(240, 242, 247);
      pdf.roundedRect(M, y, W - M * 2, 12, 2, 2, "F");
      pdf.setFillColor(15, 28, 53);
      pdf.roundedRect(M, y, 8, 12, 2, 2, "F");
      pdf.setTextColor(15, 28, 53);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, W - M - 2, y + 8, { align: "right" });
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(136, 146, 164);
      pdf.text(subtitle, M + 12, y + 8);
      y += 17;
    }

    // ── FIELD ROW ──
    function fieldRow(label, value) {
      checkY(10);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(136, 146, 164);
      pdf.text(label + ":", M + 2, y);

      pdf.setTextColor(15, 28, 53);
      pdf.setFont("helvetica", value ? "bold" : "normal");
      pdf.setFontSize(9);
      const val = value || "—";
      pdf.text(val, W - M - 2, y, { align: "right", maxWidth: 130 });
      y += 7;
    }

    function twoFields(l1, v1, l2, v2) {
      checkY(10);
      const mid = W / 2;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(136, 146, 164);
      pdf.text(l1 + ":", M + 2, y);
      pdf.text(l2 + ":", mid + 2, y);
      pdf.setTextColor(15, 28, 53);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(v1 || "—", mid - 4, y, { align: "right" });
      pdf.text(v2 || "—", W - M - 2, y, { align: "right" });
      y += 7;
    }

    function textArea(label, value) {
      checkY(20);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(136, 146, 164);
      pdf.text(label + ":", M + 2, y);
      y += 5;
      pdf.setDrawColor(226, 229, 237);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(M, y, W - M * 2, 18, 2, 2);
      if (value) {
        pdf.setTextColor(15, 28, 53);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(value, W - M * 2 - 4);
        pdf.text(lines.slice(0, 3), W - M - 2, y + 5, { align: "right" });
      }
      y += 22;
    }

    // ── SECTION 1: General Info ──
    secHeader("1. General Information", "פרטים כלליים");
    twoFields("Date / תאריך", data.date, "Shift / משמרת", data.shift);
    twoFields("Start / התחלה", data.timeStart, "End / סיום", data.timeEnd);
    fieldRow("Weather / מזג אוויר", [data.wxTemp ? data.wxTemp + "°C" : "", data.wxWind ? data.wxWind + " km/h" : "", data.wxCond].filter(Boolean).join("  |  "));
    twoFields("Manager / מנהל מקצועי", data.managerName, "ID / ת.ז.", data.managerId);
    fieldRow("Site / שם האתר", data.siteName);
    twoFields("Client / לקוח", data.clientName, "Location / מיקום", data.siteLocation);
    y += 3;

    // ── SECTION 2: Mission ──
    secHeader("2. Mission Description", "תיאור המשימה");
    textArea("Description / תיאור", data.missionDesc);
    textArea("Special Notes / הערות", data.missionNotes);
    y += 2;

    // ── SECTION 3: Team ──
    secHeader("3. Team Members", "כוח אדם");
    if (data.members && data.members.length > 0) {
      data.members.forEach(function(m, i) {
        checkY(8);
        pdf.setFillColor(i % 2 === 0 ? 247 : 255, i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 251 : 255);
        pdf.rect(M, y - 4, W - M * 2, 8, "F");
        pdf.setTextColor(15, 28, 53);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text(m.name, W - M - 2, y, { align: "right" });
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(136, 146, 164);
        pdf.setFontSize(8);
        pdf.text(m.role + (m.id ? "  |  " + m.id : ""), M + 2, y);
        y += 8;
      });
    } else {
      fieldRow("Members", "No team members added");
    }
    y += 3;

    // ── SECTION 4: Risk Matrix ──
    secHeader("4. Risk Assessment Matrix", "הערכת סיכונים");

    // Table header
    pdf.setFillColor(15, 28, 53);
    pdf.rect(M, y, W - M * 2, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("Risk / סיכון", W - M - 2, y + 5.5, { align: "right" });
    pdf.text("Severity", M + 40, y + 5.5, { align: "right" });
    pdf.text("Control / אמצעי בקרה", M + 2, y + 5.5);
    y += 10;

    const risks = [
      { name: "Fall from Height / נפילה מגובה", sev: "HIGH", sevColor: [192, 57, 43], control: data.risk0 },
      { name: "Falling Objects / נפילת חפצים", sev: "HIGH", sevColor: [192, 57, 43], control: data.risk1 },
      { name: "Heat / Sun / חום וקרינה", sev: "HIGH", sevColor: [192, 57, 43], control: data.risk2 },
      { name: "Electrical Lines / חשמל", sev: "HIGH", sevColor: [192, 57, 43], control: data.risk3 },
      { name: "Strong Wind / רוח", sev: "MED", sevColor: [212, 134, 10], control: data.risk4 },
      { name: "Equipment Failure / כשל ציוד", sev: "MED", sevColor: [212, 134, 10], control: data.risk5 },
      { name: "Physical Condition / מצב גופני", sev: "MED", sevColor: [212, 134, 10], control: data.risk6 },
      { name: "Night Work / עבודת לילה", sev: "MED", sevColor: [212, 134, 10], control: data.risk7 },
    ];

    risks.forEach(function(r, i) {
      checkY(9);
      pdf.setFillColor(i % 2 === 0 ? 247 : 255, i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 251 : 255);
      pdf.rect(M, y - 4, W - M * 2, 9, "F");

      pdf.setTextColor(15, 28, 53);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text(r.name, W - M - 2, y + 1, { align: "right", maxWidth: 80 });

      // Severity badge
      pdf.setFillColor(r.sevColor[0], r.sevColor[1], r.sevColor[2]);
      pdf.roundedRect(M + 24, y - 3, 22, 6, 1, 1, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.text(r.sev, M + 35, y + 1, { align: "center" });

      pdf.setTextColor(68, 80, 112);
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");
      pdf.text(r.control || "—", M + 2, y + 1, { maxWidth: 22 });

      y += 9;
    });

    if (data.riskNotes) {
      y += 2;
      textArea("Additional Risks / סיכונים נוספים", data.riskNotes);
    }
    y += 2;

    // ── SECTION 5: Checklist ──
    secHeader("5. Pre-Work Inspection Checklist", "יומן בדיקות");

    const checkedItems = data.checklist || [];
    const cats = [
      { label: "Team", items: ["Valid certifications (IRATA/EN)", "Medical clearance approved", "Team briefing completed"] },
      { label: "Equipment", items: ["PPE in valid condition", "Tools secured", "Consumables available"] },
      { label: "Emergency", items: ["First aid kit present", "Rescue kit complete", "Evacuation route defined", "Emergency officer assigned"] },
      { label: "Site", items: ["Hazards identified", "Safe access confirmed", "Power line distance checked", "Anchors load tested", "Fencing & signage placed", "Comms checked"] },
      { label: "Pre-Descent Briefing", items: ["Physical fitness checked", "Roles assigned", "Emergency equipment shown", "Buddy check done", "Lifeline checked", "Power disconnected if needed"] }
    ];

    let itemIdx = 0;
    cats.forEach(function(cat) {
      checkY(8);
      pdf.setFillColor(240, 242, 247);
      pdf.rect(M, y - 3, W - M * 2, 7, "F");
      pdf.setTextColor(68, 80, 112);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text(cat.label, W - M - 2, y + 1, { align: "right" });
      y += 8;

      cat.items.forEach(function(item) {
        checkY(7);
        const checked = checkedItems[itemIdx] === true;
        // Checkbox
        pdf.setDrawColor(checked ? 15 : 200, checked ? 28 : 200, checked ? 53 : 200);
        pdf.setLineWidth(0.4);
        pdf.rect(W - M - 6, y - 3.5, 5, 5);
        if (checked) {
          pdf.setFillColor(15, 28, 53);
          pdf.rect(W - M - 6, y - 3.5, 5, 5, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(7);
          pdf.text("✓", W - M - 4.5, y);
        }
        pdf.setTextColor(checked ? 180 : 15, checked ? 190 : 28, checked ? 210 : 53);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", checked ? "normal" : "normal");
        pdf.text(item, W - M - 9, y, { align: "right", maxWidth: 150 });
        itemIdx++;
        y += 7;
      });
      y += 2;
    });

    // ── SECTION 6: Emergency Contacts ──
    checkY(50);
    secHeader("6. Emergency Contacts", "אנשי קשר / חירום");

    // Emergency numbers
    const emergencyNums = [
      { icon: "🚑", label: "Ambulance / מד\"א", num: "101" },
      { icon: "🚒", label: "Fire / כיבוי אש", num: "102" },
      { icon: "👮", label: "Police / משטרה", num: "100" }
    ];
    emergencyNums.forEach(function(e) {
      checkY(9);
      pdf.setFillColor(247, 248, 251);
      pdf.roundedRect(M, y - 4, W - M * 2, 9, 2, 2, "F");
      pdf.setTextColor(136, 146, 164);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(e.label, M + 2, y + 1);
      pdf.setTextColor(15, 28, 53);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(e.num, W - M - 2, y + 1, { align: "right" });
      y += 10;
    });

    twoFields("Hospital / בית חולים", data.hospital, "", "");
    twoFields("Safety Officer / ממונה בטיחות", data.safetyOfficer, "PM / מנהל פרויקט", data.projectManager);
    if (data.emergencyNotes) textArea("Emergency Notes", data.emergencyNotes);
    y += 2;

    // ── SECTION 7: Authorization ──
    checkY(60);
    secHeader("7. Authorization & Signature", "אישור וחתימה");
    twoFields("Approver / מאשר", data.approverName, "Role / תפקיד", data.approverRole);
    twoFields("Auth Date / תאריך אישור", data.authDate, "Auth Time / שעה", data.authTime);
    y += 4;

    // Signature box
    checkY(30);
    pdf.setDrawColor(226, 229, 237);
    pdf.setLineWidth(0.4);
    pdf.setLineDash([2, 2]);
    pdf.roundedRect(M, y, W - M * 2, 28, 2, 2);
    pdf.setLineDash([]);
    pdf.setTextColor(184, 192, 204);
    pdf.setFontSize(9);
    pdf.text("Digital Signature / חתימה דיגיטלית", W / 2, y + 15, { align: "center" });

    if (data.signatureText) {
      pdf.setTextColor(15, 28, 53);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(data.signatureText, W / 2, y + 20, { align: "center" });
    }
    y += 33;

    // ── FOOTER on every page ──
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFillColor(240, 242, 247);
      pdf.rect(0, 287, 210, 10, "F");
      pdf.setFillColor(201, 168, 76);
      pdf.rect(0, 287, 3, 10, "F");
      pdf.setTextColor(136, 146, 164);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.text("Created by SmartAccess | smartaccess.co.il | " + formId, 14, 293);
      pdf.text(i + " / " + pageCount, W - 14, 293, { align: "right" });
    }

    // ── OUTPUT ──
    const pdfBase64 = pdf.output("datauristring").split(",")[1];

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="risk-management.pdf"',
        "Access-Control-Allow-Origin": "*"
      },
      body: pdfBase64,
      isBase64Encoded: true
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
