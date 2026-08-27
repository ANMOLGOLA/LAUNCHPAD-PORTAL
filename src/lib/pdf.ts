import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

interface DrawTextOptions {
  x: number;
  y: number;
  size: number;
  color?: [number, number, number];
}

export async function generateCertificatePDF(options: {
  recipientName: string;
  eventName: string;
  eventDate: string;
  certificateId: string;
  verificationUrl: string;
  isWatermarked?: boolean;
  templatePath?: string;
  templateFields?: any;
}): Promise<Buffer> {
  const { recipientName, eventName, eventDate, certificateId, verificationUrl, isWatermarked = false, templatePath, templateFields } = options;

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // A4 Landscape is 841.89 x 595.27 points
  const page = pdfDoc.addPage([841.89, 595.27]);
  const { width, height } = page.getSize();

  // Load fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Background
  if (templatePath) {
    try {
      const fullPath = path.join(process.cwd(), 'public', templatePath);
      const imageBytes = fs.readFileSync(fullPath);
      let image;
      if (templatePath.toLowerCase().endsWith('.png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
    } catch (err) {
      console.error('Failed to load template image, falling back to default:', err);
      drawDefaultBackground(page, width, height);
    }
  } else {
    drawDefaultBackground(page, width, height);
  }

  function drawDefaultBackground(page: any, width: number, height: number) {
    // Outer border (Deep Blue)
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: rgb(0.09, 0.23, 0.54),
      borderWidth: 4,
    });

    // Inner thin border (Golden/Yellow)
    page.drawRectangle({
      x: 28,
      y: 28,
      width: width - 56,
      height: height - 56,
      borderColor: rgb(0.95, 0.77, 0.06),
      borderWidth: 1.5,
    });

    // Corner accent decorations
    page.drawRectangle({ x: 35, y: height - 60, width: 25, height: 25, color: rgb(0.15, 0.45, 0.9) });
    page.drawRectangle({ x: width - 60, y: height - 60, width: 25, height: 25, color: rgb(0.06, 0.62, 0.35) });
    page.drawRectangle({ x: 35, y: 35, width: 25, height: 25, color: rgb(0.95, 0.77, 0.06) });
    page.drawRectangle({ x: width - 60, y: 35, width: 25, height: 25, color: rgb(0.85, 0.18, 0.18) });
  }


  // 3. Header Texts
  if (!templatePath) {
  const titleText = 'CERTIFICATE OF PARTICIPATION';
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 28);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: height - 100,
    size: 28,
    font: fontBold,
    color: rgb(0.09, 0.23, 0.54),
  });

  const subTitleText = 'Google Student Ambassador Program • Team Launchpad';
  const subTitleWidth = fontRegular.widthOfTextAtSize(subTitleText, 14);
  page.drawText(subTitleText, {
    x: (width - subTitleWidth) / 2,
    y: height - 130,
    size: 14,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  // 4. Middle Content
  const presentedToText = 'This certificate is proudly presented to';
  const presentedToWidth = fontItalic.widthOfTextAtSize(presentedToText, 16);
  page.drawText(presentedToText, {
    x: (width - presentedToWidth) / 2,
    y: height - 210,
    size: 16,
    font: fontItalic,
    color: rgb(0.3, 0.35, 0.45),
  });

  // Recipient Name (Auto shrink if too long)
  let nameSize = 36;
  let nameWidth = fontBold.widthOfTextAtSize(recipientName, nameSize);
  const maxNameWidth = width - 200;
  if (nameWidth > maxNameWidth) {
    nameSize = Math.floor((maxNameWidth / nameWidth) * nameSize);
    nameWidth = fontBold.widthOfTextAtSize(recipientName, nameSize);
  }

  page.drawText(recipientName, {
    x: (width - nameWidth) / 2,
    y: height - 270,
    size: nameSize,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Decorative underline under name
  page.drawLine({
    start: { x: (width - Math.min(nameWidth, 400)) / 2, y: height - 285 },
    end: { x: (width + Math.min(nameWidth, 400)) / 2, y: height - 285 },
    thickness: 2,
    color: rgb(0.15, 0.45, 0.9),
  });

  // Course / Event Text
  const forCompletingText = `for successfully attending and participating in the event`;
  const forCompletingWidth = fontRegular.widthOfTextAtSize(forCompletingText, 15);
  page.drawText(forCompletingText, {
    x: (width - forCompletingWidth) / 2,
    y: height - 330,
    size: 15,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });

  // Event Name
  let eventSize = 22;
  let eventTextWidth = fontBold.widthOfTextAtSize(eventName, eventSize);
  if (eventTextWidth > maxNameWidth) {
    eventSize = Math.floor((maxNameWidth / eventTextWidth) * eventSize);
    eventTextWidth = fontBold.widthOfTextAtSize(eventName, eventSize);
  }
  page.drawText(eventName, {
    x: (width - eventTextWidth) / 2,
    y: height - 370,
    size: eventSize,
    font: fontBold,
    color: rgb(0.15, 0.45, 0.9),
  });

  // 5. QR Code Generation & Embedding
  const qrBuffer = await QRCode.toBuffer(verificationUrl, {
    margin: 1,
    width: 90,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  });
  const qrImage = await pdfDoc.embedPng(qrBuffer);
  page.drawImage(qrImage, {
    x: width - 150,
    y: 60,
    width: 90,
    height: 90,
  });

  // Label under QR Code
  const qrLabel = 'Scan to verify';
  const qrLabelWidth = fontRegular.widthOfTextAtSize(qrLabel, 9);
  page.drawText(qrLabel, {
    x: width - 150 + (90 - qrLabelWidth) / 2,
    y: 48,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65),
  });

  // 6. Signatures & Metadata Info
  // Left: Signature Line
  page.drawLine({
    start: { x: 80, y: 110 },
    end: { x: 260, y: 110 },
    thickness: 1,
    color: rgb(0.7, 0.75, 0.8),
  });
  page.drawText('Google Student Ambassador', {
    x: 80,
    y: 92,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('Authorized Event Coordinator', {
    x: 80,
    y: 77,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  // Middle: Date & ID
  page.drawText(`Date Issued: ${eventDate}`, {
    x: 320,
    y: 100,
    size: 11,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });
  
  page.drawText(`Certificate ID: ${certificateId}`, {
    x: 320,
    y: 82,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });
  } else if (templatePath && templateFields) {
    // We have a custom template AND custom fields!
    // Parse colors from hex (e.g. #1a1a1a -> [r,g,b] between 0-1)
    const hexToRgb = (hex: string) => {
      const clean = hex.replace('#', '');
      return rgb(
        parseInt(clean.substring(0,2), 16) / 255,
        parseInt(clean.substring(2,4), 16) / 255,
        parseInt(clean.substring(4,6), 16) / 255
      );
    };

    if (templateFields.name) {
      const nameSize = templateFields.name.size || 36;
      const nWidth = fontBold.widthOfTextAtSize(recipientName, nameSize);
      // percentages to points (PDF y is from bottom, so invert it)
      const x = (templateFields.name.x / 100) * width - (nWidth / 2); // Center aligned
      const y = height - ((templateFields.name.y / 100) * height);

      page.drawText(recipientName, {
        x,
        y,
        size: nameSize,
        font: fontBold,
        color: templateFields.name.color ? hexToRgb(templateFields.name.color) : rgb(0,0,0)
      });
    }

    if (templateFields.date) {
      const dText = eventDate;
      const dSize = templateFields.date.size || 16;
      const dWidth = fontRegular.widthOfTextAtSize(dText, dSize);
      const x = (templateFields.date.x / 100) * width - (dWidth / 2); // Center aligned
      const y = height - ((templateFields.date.y / 100) * height);

      page.drawText(dText, {
        x,
        y,
        size: dSize,
        font: fontBold,
        color: templateFields.date.color ? hexToRgb(templateFields.date.color) : rgb(0,0,0)
      });
    }
  } // end if (!templatePath)

  // 7. Watermark overlay (semi-transparent text if preview mode is active)
  if (isWatermarked) {
    const watermarkText = 'PREVIEW — NOT VALID FOR USE';
    page.drawText(watermarkText, {
      x: 120,
      y: 180,
      size: 44,
      font: fontBold,
      color: rgb(0.9, 0.2, 0.2),
      opacity: 0.15,
      rotate: degrees(30)
    });

    page.drawText(watermarkText, {
      x: 180,
      y: 350,
      size: 44,
      font: fontBold,
      color: rgb(0.9, 0.2, 0.2),
      opacity: 0.15,
      rotate: degrees(30)
    });
  }

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
