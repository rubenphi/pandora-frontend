/* eslint-disable */
import { jsPDF } from "jspdf";

/**
 * Convierte una imagen remota o relativa a base64
 */
async function getBase64ImageFromUrl(imageUrl) {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("No se pudo cargar la imagen:", imageUrl, err);
    return null;
  }
}

/**
 * Genera el HTML representativo del examen para renderizado PDF
 */
function buildExamHtml(quiz, baseUrl = "") {
  const lessonData = quiz.lesson || {};
  const topic = lessonData.topic || "";
  const title = quiz.title || "";
  const courseName = lessonData.course?.name || "";

  let htmlOutput = `<h2>LECCIÓN: ${topic}</h2> <h2> CUESTIONARIO: ${title}</h2><h3>Grado: ${courseName}</h3>`;

  const validQuestions = (quiz.questions || [])
    .filter((q) => q && q.exist !== false)
    .sort((a, b) => a.id - b.id);

  validQuestions.forEach((question, index) => {
    let processedSentence = question.sentence || "";

    if (
      processedSentence.trim().startsWith("<p>") &&
      processedSentence.trim().endsWith("</p>")
    ) {
      processedSentence = processedSentence.trim().slice(3, -4);
    }

    processedSentence = processedSentence.replace(
      /^<h([1-6])>(.*?)<\/h\1>/i,
      "<strong>$2</strong>"
    );

    htmlOutput += `<div class="question-item">`;
    htmlOutput += `<p class="question-title"><strong>${index + 1}. </strong>${processedSentence}</p>`;

    if (question.photo) {
      let photoUrl = question.photo;
      if (!photoUrl.startsWith("http") && !photoUrl.startsWith("data:")) {
        const cleanBase = (baseUrl || "").replace(/\/+$/, "");
        const cleanPhoto = question.photo.startsWith("/")
          ? question.photo
          : "/" + question.photo;
        photoUrl = cleanBase + cleanPhoto;
      }
      htmlOutput += `<img src="${photoUrl}" style="max-width:100%;margin:4px 0 12px 0;display:block;" />`;
    }

    htmlOutput += `<div class="question-options">`;
    const sortedOptions = (question.options || [])
      .slice()
      .sort((a, b) => (a.identifier || "").localeCompare(b.identifier || ""));

    sortedOptions.forEach((opt) => {
      let processedOptionSentence = opt.sentence || "";
      if (
        processedOptionSentence.trim().startsWith("<p>") &&
        processedOptionSentence.trim().endsWith("</p>")
      ) {
        processedOptionSentence = processedOptionSentence.trim().slice(3, -4);
      }
      processedOptionSentence = processedOptionSentence.replace(
        /^<h([1-6])>(.*?)<\/h\1>/i,
        "<strong>$2</strong>"
      );
      htmlOutput += `<p class="question-option"><strong>${opt.identifier || ""}. </strong>${processedOptionSentence}</p>`;
    });
    htmlOutput += `</div>`;
    htmlOutput += `</div>`;
  });

  return htmlOutput;
}

/**
 * Genera un Blob PDF con el formato de examen oficial (A4 Carta, 2 columnas)
 * @param {Object} params
 * @param {Object} params.quiz - Objeto del cuestionario completo con lesson, questions, options
 * @param {string} params.baseUrl - URL base del backend para resolver imágenes
 * @returns {Promise<Blob>}
 */
export async function generateQuizPdfBlob({ quiz, baseUrl = "" }) {
  const lessonData = quiz.lesson || {};
  const quizTitle = quiz.title || "Cuestionario";

  const generatedHtml = buildExamHtml(quiz, baseUrl);

  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });

  const marginX = 15;
  const pageWidth = 210;
  const pageHeight = 297;
  const maxContentWidth = pageWidth - marginX * 2; // 180 mm
  const bottomMargin = 15;
  const topMargin = 22;

  // 2 Column Configuration
  const gap = 8;
  const colWidth = (pageWidth - marginX * 2 - gap) / 2; // 86 mm
  const col1X = marginX;
  const col2X = marginX + colWidth + gap; // 109 mm

  let currentY = 25;
  let inTwoColumns = false;
  let currentColumn = 0;

  const drawPageHeader = () => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139); // slate-400
    pdf.text("Cuestionario", marginX, 14);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    const rightText = quizTitle;
    const leftLabelWidth = pdf.getTextWidth("Cuestionario");
    const maxRightWidth = pageWidth - marginX * 2 - leftLabelWidth - 6;
    let displayTitle = rightText;
    if (pdf.getTextWidth(displayTitle) > maxRightWidth) {
      while (
        pdf.getTextWidth(displayTitle + "...") > maxRightWidth &&
        displayTitle.length > 0
      ) {
        displayTitle = displayTitle.slice(0, -1);
      }
      displayTitle += "...";
    }
    pdf.text(
      displayTitle,
      pageWidth - marginX - pdf.getTextWidth(displayTitle),
      14
    );

    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.setLineWidth(0.5);
    pdf.line(marginX, 16, pageWidth - marginX, 16);
  };

  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - bottomMargin) {
      if (!inTwoColumns) {
        pdf.addPage("a4", "portrait");
        drawPageHeader();
        currentY = topMargin;
        return true;
      } else {
        if (currentColumn === 0) {
          currentColumn = 1;
          currentY = topMargin;
          return true;
        } else {
          pdf.addPage("a4", "portrait");
          drawPageHeader();
          currentColumn = 0;
          currentY = topMargin;
          return true;
        }
      }
    }
    return false;
  };

  const extractFragments = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const frags = [];

    const walk = (node, bold, italic, underline) => {
      if (node.nodeType === 3) {
        const t = node.textContent;
        if (t) frags.push({ text: t, bold, italic, underline });
        return;
      }
      const tag = node.tagName ? node.tagName.toLowerCase() : "";
      const isB = bold || tag === "strong" || tag === "b";
      const isI = italic || tag === "em" || tag === "i";
      const isU = underline || tag === "u";
      for (const ch of node.childNodes) {
        walk(ch, isB, isI, isU);
      }
    };

    walk(tmp, false, false, false);
    return frags;
  };

  const wrapFragments = (fragments, maxWidth, fontSize) => {
    const lines = [];
    let currentLine = [];
    let currentWidth = 0;

    for (const frag of fragments) {
      const parts = frag.text.split("\n");
      for (let pi = 0; pi < parts.length; pi++) {
        if (pi > 0) {
          lines.push(currentLine);
          currentLine = [];
          currentWidth = 0;
        }
        const segment = parts[pi];
        if (!segment) continue;
        const words = segment.split(/(\s+)/);
        for (const word of words) {
          if (!word) continue;
          pdf.setFont("helvetica", frag.bold ? "bold" : "normal");
          pdf.setFontSize(fontSize);
          const wordWidth = pdf.getTextWidth(word);
          if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [];
            currentWidth = 0;
          }
          currentLine.push({
            text: word,
            bold: frag.bold,
            italic: frag.italic,
            underline: frag.underline,
          });
          currentWidth += wordWidth;
        }
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);
    return lines;
  };

  const drawFormattedLine = (lineFrags, x, y, maxWidth, fontSize, color) => {
    let curX = x;
    pdf.setTextColor(color[0], color[1], color[2]);
    for (const frag of lineFrags) {
      pdf.setFont("helvetica", frag.bold ? "bold" : "normal");
      pdf.setFontSize(fontSize);
      pdf.text(frag.text, curX, y);
      const w = pdf.getTextWidth(frag.text);
      if (frag.underline) {
        pdf.setDrawColor(color[0], color[1], color[2]);
        pdf.setLineWidth(0.3);
        pdf.line(curX, y + 0.8, curX + w, y + 0.8);
      }
      curX += w;
    }
  };

  const estimateItemHeight = (node) => {
    let height = 0;
    const titleNode = node.querySelector(".question-title");
    const optionsNode = node.querySelector(".question-options");

    if (titleNode) {
      const qNumStrong = titleNode.querySelector("strong");
      const qNumText = qNumStrong
        ? qNumStrong.innerText || qNumStrong.textContent
        : "";
      const qHtml = titleNode.innerHTML || "";
      const qFrags = extractFragments(qHtml);
      const qFragmentsWithoutNum = (() => {
        let text = "";
        for (const f of qFrags) text += f.text;
        if (qNumText && text.startsWith(qNumText)) {
          return [
            {
              text: text.substring(qNumText.length),
              bold: false,
              italic: false,
              underline: false,
            },
          ];
        }
        return qFrags;
      })();

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      const numWidth = pdf.getTextWidth(qNumText);
      const textIndent = Math.max(numWidth + 1.2, 5);
      const textWidth = colWidth - textIndent;

      const qLines = wrapFragments(qFragmentsWithoutNum, textWidth, 10.5);
      height += qLines.length * 5.5;
      height += 1.5;
    }

    const imgNodes = node.querySelectorAll("img");
    for (const imgNode of imgNodes) {
      const imgSrc = imgNode.getAttribute("src") || "";
      if (!imgSrc) continue;
      if (imgSrc.startsWith("data:image")) {
        try {
          const imgProps = pdf.getImageProperties(imgSrc);
          const imgWidth = colWidth;
          let imgHeight = (imgProps.height / imgProps.width) * imgWidth;
          if (imgHeight > 120) imgHeight = 120;
          height += imgHeight + 8;
        } catch {
          height += 48;
        }
      } else {
        height += 68;
      }
    }

    const allParagraphs = node.querySelectorAll("p");
    for (const pNode of allParagraphs) {
      if (
        pNode.classList.contains("question-title") ||
        pNode.classList.contains("question-option")
      )
        continue;
      const pHtml = pNode.innerHTML || pNode.textContent || "";
      if (!pHtml.trim()) continue;
      const pFrags = extractFragments(pHtml);
      const pLines = wrapFragments(pFrags, colWidth, 10);
      height += pLines.length * 5 + 2;
    }

    if (optionsNode) {
      const optionItems = optionsNode.querySelectorAll(".question-option");
      for (const optNode of optionItems) {
        const optStrong = optNode.querySelector("strong");
        const optNumText = optStrong
          ? optStrong.innerText || optStrong.textContent
          : "";
        const optHtml = optNode.innerHTML || "";
        const optFrags = extractFragments(optHtml);
        const allText = optFrags.reduce((acc, f) => acc + f.text, "");
        let trimmedFrags = optFrags;
        if (optNumText && allText.startsWith(optNumText)) {
          let charsToRemove = optNumText.length;
          trimmedFrags = [];
          for (const f of optFrags) {
            if (charsToRemove <= 0) {
              trimmedFrags.push(f);
              continue;
            }
            if (charsToRemove >= f.text.length) {
              charsToRemove -= f.text.length;
            } else {
              trimmedFrags.push({
                text: f.text.substring(charsToRemove),
                bold: f.bold,
                italic: f.italic,
                underline: f.underline,
              });
              charsToRemove = 0;
            }
          }
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        const optNumWidth = pdf.getTextWidth(optNumText);
        const textIndent = Math.max(optNumWidth + 1.2, 4);
        const optTextWidth = colWidth - 4 - textIndent;

        const optLines = wrapFragments(trimmedFrags, optTextWidth, 9.5);
        height += optLines.length * 5;
        height += 1.2;
      }
    }

    height += 3;
    return height;
  };

  const drawListItem = (numberStr, htmlStr, isQuestion) => {
    const fontSizeNumber = isQuestion ? 11 : 9.5;
    const fontSizeText = isQuestion ? 10.5 : 9.5;
    const fontColorNumber = [15, 23, 42];
    const fontColorText = isQuestion ? [51, 65, 85] : [71, 85, 105];

    const colW = inTwoColumns ? colWidth : maxContentWidth;
    const currentWidth = isQuestion ? colW : colW - 4;
    const lineHeight = isQuestion ? 5.5 : 5;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(fontSizeNumber);
    const numWidth = pdf.getTextWidth(numberStr);
    const textIndent = Math.max(numWidth + 1.2, isQuestion ? 5 : 4);
    const textWidth = currentWidth - textIndent;

    const fragments = extractFragments(htmlStr);
    const lines = wrapFragments(fragments, textWidth, fontSizeText);
    const neededHeight = lines.length * lineHeight;
    checkPageBreak(neededHeight);

    const finalColX = inTwoColumns
      ? currentColumn === 0
        ? col1X
        : col2X
      : marginX;
    const finalMarginX = isQuestion ? finalColX : finalColX + 4;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(fontSizeNumber);
    pdf.setTextColor(fontColorNumber[0], fontColorNumber[1], fontColorNumber[2]);
    pdf.text(numberStr, finalMarginX, currentY);

    lines.forEach((lineFrags, idx) => {
      drawFormattedLine(
        lineFrags,
        finalMarginX + textIndent,
        currentY + idx * lineHeight,
        textWidth,
        fontSizeText,
        fontColorText
      );
    });

    currentY += neededHeight;
  };

  // Draw Header on first page
  drawPageHeader();

  // Parse HTML content
  const parser = new DOMParser();
  const doc = parser.parseFromString(generatedHtml, "text/html");
  const children = Array.from(doc.body.childNodes);

  for (const node of children) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (!text) continue;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);

      const lines = pdf.splitTextToSize(text, maxContentWidth);
      const lineHeight = 6;

      for (const line of lines) {
        checkPageBreak(lineHeight);
        pdf.text(line, marginX, currentY);
        currentY += lineHeight;
      }
      currentY += 2;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      if (tagName === "div" && node.classList.contains("question-item")) {
        if (!inTwoColumns) {
          inTwoColumns = true;
          currentColumn = 0;
          currentY += 2; // gap before columns
        }

        const estimatedHeight = estimateItemHeight(node);
        const maxColHeight = pageHeight - bottomMargin - topMargin;

        if (estimatedHeight < maxColHeight) {
          checkPageBreak(estimatedHeight);
        }

        const titleNode = node.querySelector(".question-title");
        const optionsNode = node.querySelector(".question-options");

        if (titleNode) {
          const qNumStrong = titleNode.querySelector("strong");
          const qNumText = qNumStrong
            ? qNumStrong.innerText || qNumStrong.textContent
            : "";

          const qHtml = titleNode.innerHTML || "";
          let trimmedHtml = qHtml;
          if (qNumText) {
            const tmp = document.createElement("div");
            tmp.innerHTML = qHtml;
            const fullText = tmp.textContent || "";
            if (fullText.startsWith(qNumText)) {
              const charsToRemove = qNumText.length;
              let removed = 0;
              const walkAndTrim = (node) => {
                if (removed >= charsToRemove) return;
                if (node.nodeType === 3) {
                  const len = Math.min(
                    node.textContent.length,
                    charsToRemove - removed
                  );
                  node.textContent = node.textContent.substring(len);
                  removed += len;
                } else {
                  for (const ch of node.childNodes) walkAndTrim(ch);
                }
              };
              walkAndTrim(tmp);
              trimmedHtml = tmp.innerHTML;
            }
          }

          drawListItem(qNumText, trimmedHtml, true);
          currentY += 1.5;
        }

        const imgNodes = node.querySelectorAll("img");
        for (const imgNode of imgNodes) {
          let imgSrc = imgNode.getAttribute("src") || "";
          if (!imgSrc) continue;
          if (!imgSrc.startsWith("data:image")) {
            try {
              imgSrc = await getBase64ImageFromUrl(imgSrc);
            } catch {
              continue;
            }
            if (!imgSrc) continue;
          }
          try {
            const imgProps = pdf.getImageProperties(imgSrc);
            const maxImgWidth = inTwoColumns ? colWidth : maxContentWidth;
            let imgWidth = maxImgWidth;
            let imgHeight = (imgProps.height / imgProps.width) * imgWidth;
            if (imgHeight > 120) {
              imgHeight = 120;
              imgWidth = (imgProps.width / imgProps.height) * imgHeight;
            }
            checkPageBreak(imgHeight + 8);
            const imgX = inTwoColumns
              ? currentColumn === 0
                ? col1X
                : col2X
              : marginX;
            pdf.addImage(imgSrc, "JPEG", imgX, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 8;
          } catch {
            // skip broken image
          }
        }

        const allParagraphs = node.querySelectorAll("p");
        for (const pNode of allParagraphs) {
          if (
            pNode.classList.contains("question-title") ||
            pNode.classList.contains("question-option")
          )
            continue;
          const pHtml = pNode.innerHTML || pNode.textContent || "";
          if (!pHtml.trim()) continue;
          const colW = inTwoColumns ? colWidth : maxContentWidth;
          const pFrags = extractFragments(pHtml);
          const pLines = wrapFragments(pFrags, colW, 10);
          const pColor = [51, 65, 85];
          const pLh = 5;
          for (const lineFrags of pLines) {
            checkPageBreak(pLh);
            const lx = inTwoColumns
              ? currentColumn === 0
                ? col1X
                : col2X
              : marginX;
            drawFormattedLine(lineFrags, lx, currentY, colW, 10, pColor);
            currentY += pLh;
          }
          currentY += 2;
        }

        if (optionsNode) {
          const optionItems = optionsNode.querySelectorAll(".question-option");
          for (const optNode of optionItems) {
            const optStrong = optNode.querySelector("strong");
            const optNumText = optStrong
              ? optStrong.innerText || optStrong.textContent
              : "";

            const optHtml = optNode.innerHTML || "";
            let trimmedHtml = optHtml;
            if (optNumText) {
              const tmp = document.createElement("div");
              tmp.innerHTML = optHtml;
              const fullText = tmp.textContent || "";
              if (fullText.startsWith(optNumText)) {
                const charsToRemove = optNumText.length;
                let removed = 0;
                const walkAndTrim = (node) => {
                  if (removed >= charsToRemove) return;
                  if (node.nodeType === 3) {
                    const len = Math.min(
                      node.textContent.length,
                      charsToRemove - removed
                    );
                    node.textContent = node.textContent.substring(len);
                    removed += len;
                  } else {
                    for (const ch of node.childNodes) walkAndTrim(ch);
                  }
                };
                walkAndTrim(tmp);
                trimmedHtml = tmp.innerHTML;
              }
            }

            drawListItem(optNumText, trimmedHtml, false);
            currentY += 1.2;
          }
        }
        currentY += 3;
      } else if (
        tagName === "div" &&
        node.classList.contains("fixed-options-container")
      ) {
        const optionItems = node.querySelectorAll(".fixed-option-item");
        for (const optNode of optionItems) {
          const optStrong = optNode.querySelector("strong");
          const optNumText = optStrong
            ? optStrong.innerText || optStrong.textContent
            : "";

          let optText = optNode.innerText || optNode.textContent || "";
          if (optNumText && optText.startsWith(optNumText)) {
            optText = optText.substring(optNumText.length);
          }
          optText = optText.trim();

          drawListItem(optNumText, optText, false);
          currentY += 1.2;
        }
        currentY += 3;
      } else if (tagName === "p") {
        const text = node.innerText || node.textContent || "";
        if (text.trim()) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          pdf.setTextColor(51, 65, 85);
          const lines = pdf.splitTextToSize(text, maxContentWidth);
          for (const line of lines) {
            checkPageBreak(6);
            pdf.text(line, marginX, currentY);
            currentY += 6;
          }
          currentY += 2;
        }
      } else if (tagName.startsWith("h") && tagName.length === 2) {
        const level = parseInt(tagName.charAt(1), 10);
        const text = node.innerText || node.textContent || "";
        if (!text.trim()) continue;

        let fontSize = 12;
        let lineHeight = 6;
        let bottomSpace = 4;

        if (level === 1) {
          fontSize = 18;
          lineHeight = 9;
          bottomSpace = 6;
        } else if (level === 2) {
          fontSize = 15;
          lineHeight = 8;
          bottomSpace = 5;
        } else {
          fontSize = 12;
          lineHeight = 7;
          bottomSpace = 4;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(fontSize);
        pdf.setTextColor(15, 23, 42);

        const lines = pdf.splitTextToSize(text, colWidth);
        currentY += 2;
        checkPageBreak(lineHeight);

        for (const line of lines) {
          checkPageBreak(lineHeight);
          pdf.text(line, marginX, currentY);
          currentY += lineHeight;
        }
        currentY += bottomSpace;
      } else if (tagName === "hr") {
        checkPageBreak(5);
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.5);
        pdf.line(marginX, currentY + 2, pageWidth - marginX, currentY + 2);
        currentY += 6;
      }
    }
  }

  return pdf.output("blob");
}

