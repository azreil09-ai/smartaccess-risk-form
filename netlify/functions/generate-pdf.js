const PDFDocument = require("pdfkit");

exports.handler = async function(event) {
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
    const data = JSON.parse(event.body || "{}");

    // Build PDF in memory
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks = [];
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = doc.page.width;
      const M = 40;

      // ── Helper functions ──
      function sectionHeader(title, subtitle, num) {
        doc.moveDown(0.5);
        doc.rect(M, doc.y, W - M * 2, 24).fill("#0f1c35");
        const sy = doc.y;
        doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold");
        doc.text(num + ". " + title, M + 8, sy + 6, { width: W - M * 2 - 16 });
        doc.fillColor("#8892a4").fontSize(8).font("Helvetica");
        doc.text(subtitle, M + 8, sy + 6, { align: "right", width: W - M * 2 - 16 });
        doc.y = sy + 30;
        doc.fillColor("#0f1c35");
      }

      function fieldRow(label, value) {
        if (doc.y > 750) doc.addPage();
        const y = doc.y;
        doc.fillColor("#8892a4").fontSize(8).font("Helvetica");
        doc.text(label + ":", M, y, { width: 140 });
        doc.fillColor("#0f1c35").fontSize(9).font("Helvetica-Bold");
        doc.text(value || "—", M + 150, y, { width: W - M * 2 - 150 });
        doc.y = y + 16;
      }

      function twoFields(l1, v1, l2, v2) {
        if (doc.y > 750) doc.addPage();
        const y = doc.y;
        const half = (W - M * 2) / 2 - 5;
        doc.fillColor("#8892a4").fontSize(8).font("Helvetica");
        doc.text(l1 + ":", M, y, { width: 70 });
        doc.fillColor("#0f1c35").fontSize(9).font("Helvetica-Bold");
        doc.text(v1 || "—", M + 75, y, { width: half - 75 });
        doc.fillColor("#8892a4").fontSize(8).font("Helvetica");
        doc.text(l2 + ":", M + half + 10, y, { width: 70 });
        doc.fillColor("#0f1c35").fontSize(9).font("Helvetica-Bold");
        doc.text(v2 || "—", M + half + 85, y, { width: half - 75 });
        doc.y = y + 16;
      }

      function textBlock(label, value) {
        if (doc.y > 720) doc.addPage();
        doc.fillColor("#8892a4").fontSize(8).font("Helvetica");
        doc.text(label + ":", M, doc.y);
        doc.moveDown(0.2);
        doc.rect(M, doc.y, W - M * 2, 50).stroke("#e2e5ed");
        if (value) {
          doc.fillColor("#0f1c35").fontSize(9).font("Helvetica");
          doc.text(value, M + 5, doc.y + 5, { width: W - M * 2 - 10, height: 40 });
        }
        doc.y += 58;
      }

      function divider() {
        doc.moveDown(0.3);
        doc.moveTo(M, doc.y).lineTo(W - M, doc.y).stroke("#e2e5ed");
        doc.moveDown(0.3);
      }

      // ── HEADER ──
      doc.rect(0, 0, W, 120).fill("#0f1c35");
      doc.rect(0, 0, 6, 120).fill("#c9a84c");

      doc.fillColor("#c9a84c").fontSize(9).font("Helvetica-Bold");
      doc.text("ROPE ACCESS  ·  RISK MANAGEMENT", M, 18, { characterSpacing: 1.5 });

      doc.fillColor("#ffffff").fontSize(20).font("Helvetica-Bold");
      doc.text("Risk Management Form", M, 32);
      doc.fillColor("#ffffff").fontSize(11).font("Helvetica");
      doc.text("Rope Access Work  —  SmartAccess", M, 56);

      doc.fillColor("#8892a4").fontSize(8).font("Helvetica");
      doc.text("ISO 45001  |  IRATA / EN 363  |  IS 5568", M, 76);

      const formId = "RM-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
      doc.fillColor("#445070").fontSize(8);
      doc.text(formId + "  |  SmartAccess  |  smartaccess.co.il", M, 96);

      doc.y = 135;
      doc.fillColor("#0f1c35");

      // ── SECTION 1: General Info ──
      sectionHeader("General Information", "פרטים כלליים", 1);
      twoFields("Date / תאריך", data.date, "Shift / משמרת", data.shift);
      twoFields("Start / התחלה", data.timeStart, "End / סיום", data.timeEnd);
      fieldRow("Weather / מזג אוויר",
        [data.wxTemp ? data.wxTemp + "°C" : "", data.wxWind ? data.wxWind + " km/h" : "", data.wxCond]
          .filter(Boolean).join("  |  ") || "—");
      twoFields("Manager / מנהל", data.managerName, "ID / ת.ז.", data.managerId);
      fieldRow("Site / אתר", data.siteName);
      twoFields("Client / לקוח", data.clientName, "Location / מיקום", data.siteLocation);
      divider();

      // ── SECTION 2: Mission ──
      sectionHeader("Mission Description", "תיאור המשימה", 2);
      textBlock("Description / תיאור", data.missionDesc);
      textBlock("Special Notes / הערות", data.missionNotes);
      divider();

      // ── SECTION 3: Team ──
      sectionHeader("Team Members", "כוח אדם", 3);
      const members = data.members || [];
      if (members.length === 0) {
        fieldRow("Members", "No team members added");
      } else {
        members.forEach(function(m, i) {
          if (doc.y > 750) doc.addPage();
          const y = doc.y;
          doc.rect(M, y, W - M * 2, 18).fill(i % 2 === 0 ? "#f7f8fb" : "#ffffff");
          doc.fillColor("#0f1c35").fontSize(9).font("Helvetica-Bold");
          doc.text(m.name, M + 5, y + 4, { width: 200 });
          doc.fillColor("#8892a4").fontSize(8).font("Helvetica");
          doc.text(m.role + (m.id ? "  ·  " + m.id : ""), M + 210, y + 5, { width: 200 });
          doc.y = y + 20;
        });
      }
      divider();

      // ── SECTION 4: Risk Matrix ──
      if (doc.y > 600) doc.addPage();
      sectionHeader("Risk Assessment Matrix", "הערכת סיכונים", 4);

      // Table header
      const th = doc.y;
      doc.rect(M, th, W - M * 2, 18).fill("#1a2e52");
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
      doc.text("Risk / סיכון", M + 5, th + 5, { width: 170 });
      doc.text("Severity", M + 180, th + 5, { width: 60 });
      doc.text("Control / אמצעי בקרה", M + 250, th + 5, { width: 250 });
      doc.y = th + 22;

      const risks = [
        { name: "Fall from Height / נפילה מגובה", sev: "HIGH", color: "#c0392b", ctrl: data.risk0 },
        { name: "Falling Objects / נפילת חפצים", sev: "HIGH", color: "#c0392b", ctrl: data.risk1 },
        { name: "Heat & Sun / חום וקרינה", sev: "HIGH", color: "#c0392b", ctrl: data.risk2 },
        { name: "Electrical Lines / קווי חשמל", sev: "HIGH", color: "#c0392b", ctrl: data.risk3 },
        { name: "Strong Wind / רוח חזקה", sev: "MED", color: "#d4860a", ctrl: data.risk4 },
        { name: "Equipment Failure / כשל ציוד", sev: "MED", color: "#d4860a", ctrl: data.risk5 },
        { name: "Physical Condition / מצב גופני", sev: "MED", color: "#d4860a", ctrl: data.risk6 },
        { name: "Night Work / עבודת לילה", sev: "MED", color: "#d4860a", ctrl: data.risk7 },
      ];

      risks.forEach(function(r, i) {
        if (doc.y > 750) doc.addPage();
        const y = doc.y;
        doc.rect(M, y, W - M * 2, 18).fill(i % 2 === 0 ? "#f7f8fb" : "#ffffff");
        doc.fillColor("#0f1c35").fontSize(8).font("Helvetica-Bold");
        doc.text(r.name, M + 5, y + 5, { width: 165 });
        // Severity badge
        doc.rect(M + 175, y + 3, 50, 12).fill(r.color);
        doc.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold");
        doc.text(r.sev, M + 175, y + 6, { width: 50, align: "center" });
        doc.fillColor("#445070").fontSize(8).font("Helvetica");
        doc.text(r.ctrl || "—", M + 233, y + 5, { width: 260 });
        doc.y = y + 20;
      });

      if (data.riskNotes) {
        doc.moveDown(0.3);
        textBlock("Additional Risks / סיכונים נוספים", data.riskNotes);
      }
      divider();

      // ── SECTION 5: Checklist ──
      if (doc.y > 550) doc.addPage();
      sectionHeader("Pre-Work Inspection Checklist", "יומן בדיקות", 5);

      const checklist = data.checklist || [];
      const cats = [
        { label: "Team / צוות", color: "#2a5caa", items: ["Valid certifications (IRATA/EN)", "Medical clearance approved", "Team briefing completed"] },
        { label: "Equipment / ציוד", color: "#d4860a", items: ["PPE in valid condition", "Tools & equipment secured", "Consumables available"] },
        { label: "Emergency / חירום", color: "#c0392b", items: ["First aid kit present", "Rescue kit complete", "Evacuation route defined", "Emergency officer assigned"] },
        { label: "Site / אתר", color: "#2e7d4f", items: ["Hazards identified & documented", "Safe site access confirmed", "Power line distance checked", "Comms & grounding checked", "Anchors load tested", "Fencing & signage placed"] },
        { label: "Pre-Descent Briefing / בריפינג", color: "#5b4db0", items: ["Physical fitness checked", "Roles & tasks assigned", "Emergency equipment shown to all", "Buddy check completed", "Lifeline main + backup checked", "Power disconnected if needed"] }
      ];

      let idx = 0;
      cats.forEach(function(cat) {
        if (doc.y > 720) doc.addPage();
        // Category header
        const cy = doc.y;
        doc.rect(M, cy, 8, 14).fill(cat.color);
        doc.fillColor("#445070").fontSize(9).font("Helvetica-Bold");
        doc.text(cat.label, M + 12, cy + 2, { width: 300 });
        doc.y = cy + 18;

        cat.items.forEach(function(item) {
          if (doc.y > 750) doc.addPage();
          const iy = doc.y;
          const checked = checklist[idx] === true;
          // Checkbox
          doc.rect(M + 2, iy + 1, 10, 10).stroke(checked ? "#0f1c35" : "#ccc");
          if (checked) {
            doc.rect(M + 2, iy + 1, 10, 10).fill("#0f1c35");
            doc.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold");
            doc.text("✓", M + 3, iy + 2, { width: 10, align: "center" });
          }
          doc.fillColor(checked ? "#aaa" : "#0f1c35").fontSize(8.5).font("Helvetica");
          doc.text(item, M + 18, iy + 2, { width: W - M * 2 - 20 });
          doc.y = iy + 15;
          idx++;
        });
        doc.moveDown(0.3);
      });
      divider();

      // ── SECTION 6: Emergency Contacts ──
      if (doc.y > 650) doc.addPage();
      sectionHeader("Emergency Contacts", "אנשי קשר / חירום", 6);

      [
        { label: "Ambulance / מד\"א", num: "101" },
        { label: "Fire / כיבוי אש", num: "102" },
        { label: "Police / משטרה", num: "100" }
      ].forEach(function(e, i) {
        if (doc.y > 750) doc.addPage();
        const y = doc.y;
        doc.rect(M, y, W - M * 2, 18).fill(i % 2 === 0 ? "#f7f8fb" : "#ffffff");
        doc.fillColor("#8892a4").fontSize(8).font("Helvetica");
        doc.text(e.label, M + 5, y + 5, { width: 200 });
        doc.fillColor("#0f1c35").fontSize(13).font("Helvetica-Bold");
        doc.text(e.num, W - M - 50, y + 3, { width: 50, align: "right" });
        doc.y = y + 20;
      });

      twoFields("Hospital / בית חולים", data.hospital, "", "");
      twoFields("Safety Officer / ממונה בטיחות", data.safetyOfficer, "PM / מנהל פרויקט", data.projectManager);
      if (data.emergencyNotes) textBlock("Emergency Notes", data.emergencyNotes);
      divider();

      // ── SECTION 7: Signature ──
      if (doc.y > 650) doc.addPage();
      sectionHeader("Authorization & Signature", "אישור וחתימה", 7);
      twoFields("Approver / מאשר", data.approverName, "Role / תפקיד", data.approverRole);
      twoFields("Auth Date / תאריך", data.authDate, "Auth Time / שעה", data.authTime);

      doc.moveDown(0.5);
      const sy = doc.y;
      doc.rect(M, sy, W - M * 2, 55).dash(3, { space: 3 }).stroke("#ccc").undash();
      doc.fillColor("#b8c0cc").fontSize(9).font("Helvetica");
      doc.text("Digital Signature / חתימה דיגיטלית", M, sy + 10, { width: W - M * 2, align: "center" });
      if (data.signatureText) {
        doc.fillColor("#0f1c35").fontSize(16).font("Helvetica-Bold");
        doc.text(data.signatureText, M, sy + 28, { width: W - M * 2, align: "center" });
      }
      doc.y = sy + 62;

      // ── FOOTER on every page ──
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        const fy = doc.page.height - 28;
        doc.rect(0, fy, doc.page.width, 28).fill("#f0f2f7");
        doc.rect(0, fy, 4, 28).fill("#c9a84c");
        doc.fillColor("#8892a4").fontSize(7).font("Helvetica");
        doc.text(
          "Created by SmartAccess  |  smartaccess.co.il  |  " + formId,
          M, fy + 9, { width: 400 }
        );
        doc.text(
          (i + 1) + " / " + range.count,
          doc.page.width - M - 40, fy + 9, { width: 40, align: "right" }
        );
      }

      doc.end();
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"risk-management.pdf\"",
        "Access-Control-Allow-Origin": "*"
      },
      body: pdfBuffer.toString("base64"),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error("PDF error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
