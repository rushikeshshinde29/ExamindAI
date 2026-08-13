package com.examind.ai.util;

import com.examind.ai.entity.*;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class PdfGeneratorUtil {

    public static byte[] generateCertificate(Attempt attempt) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // A4 Landscape size: 842 x 595. Set margins to ensure everything fits on a single page.
        Document document = new Document(PageSize.A4.rotate(), 65, 65, 40, 40);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();
            
            // Get content byte for drawing background assets under the text
            PdfContentByte cb = writer.getDirectContentUnder();
            
            // 1. Background: Clean off-white (#f8fafc)
            cb.setColorFill(new Color(248, 250, 252));
            cb.rectangle(0, 0, 842, 595);
            cb.fill();
            
            // 2. Faint, subtle wavy line texture in the background (slate-200 with 0.15 opacity equivalent color: #f1f5f9 / #e2e8f0)
            cb.setColorStroke(new Color(230, 235, 242));
            cb.setLineWidth(1f);
            
            // Wave 1
            cb.moveTo(0, 100);
            cb.curveTo(200, 150, 400, 50, 600, 120);
            cb.curveTo(700, 150, 800, 90, 842, 100);
            cb.stroke();
            
            // Wave 2
            cb.moveTo(0, 140);
            cb.curveTo(220, 185, 380, 85, 580, 155);
            cb.curveTo(680, 185, 780, 125, 842, 135);
            cb.stroke();
            
            // 3. Accent Color: Always Amber-600 (#d97706) to match the student certificate
            Color accentColor = new Color(217, 119, 6);
            
            // 4. Left Accent Block (Solid rectangular block on left edge)
            cb.setColorFill(accentColor);
            cb.rectangle(0, 210, 60, 220);
            cb.fill();
            
            // --- TOP LEFT LOGO & BRAND DETAILS ---
            // Logo text color: #0f172a
            Paragraph logoTitle = new Paragraph("EXAMIND AI", new Font(Font.HELVETICA, 13, Font.BOLD, new Color(15, 23, 42)));
            logoTitle.setAlignment(Element.ALIGN_LEFT);
            logoTitle.setSpacingBefore(5f);
            document.add(logoTitle);
            
            Paragraph logoLink = new Paragraph("www.examindai.com", new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(100, 116, 139)));
            logoLink.setAlignment(Element.ALIGN_LEFT);
            logoLink.setSpacingAfter(20f);
            document.add(logoLink);
            
            // --- TITLE ---
            // Certificate Title: Helvetica bold, 34pt, color: #d97706 with wide letter spacing
            Font titleFont = new Font(Font.HELVETICA, 34, Font.BOLD, new Color(217, 119, 6));
            Paragraph titlePara = new Paragraph("CERTIFICATE", titleFont);
            titlePara.setAlignment(Element.ALIGN_CENTER);
            titlePara.setSpacingAfter(4f);
            document.add(titlePara);
            
            // --- SUBTITLE ---
            // Color: #334155, Size: 9pt
            Font subtitleFont = new Font(Font.HELVETICA, 9, Font.BOLD, new Color(51, 65, 85));
            Paragraph subPara = new Paragraph("STUDYING FOR A CERTIFIED PLATFORM ACHIEVEMENT AND SUCCESSFUL ASSESSMENT COMPLETION", subtitleFont);
            subPara.setAlignment(Element.ALIGN_CENTER);
            subPara.setSpacingAfter(18f);
            document.add(subPara);
            
            // --- CERTIFIES LABEL ---
            Font certifiesFont = new Font(Font.HELVETICA, 9, Font.NORMAL, new Color(100, 116, 139));
            Paragraph certifiesPara = new Paragraph("THIS CERTIFIES THAT", certifiesFont);
            certifiesPara.setAlignment(Element.ALIGN_CENTER);
            certifiesPara.setSpacingBefore(12f);
            certifiesPara.setSpacingAfter(8f);
            document.add(certifiesPara);
            
            // --- CANDIDATE NAME ---
            // Times New Roman/Georgia fallback, Bold Italic, 36pt, color: #b45309
            Font nameFont = new Font(Font.TIMES_ROMAN, 36, Font.ITALIC | Font.BOLD, new Color(180, 83, 9));
            String studentName = attempt.getStudent() != null ? attempt.getStudent().getName() : "Student Name";
            Paragraph namePara = new Paragraph(studentName, nameFont);
            namePara.setAlignment(Element.ALIGN_CENTER);
            namePara.setSpacingAfter(12f);
            document.add(namePara);
            
            // --- DATE BADGE ---
            // Solid black/dark pill box (bg-[#0f172a]) containing the date
            PdfPTable datePillTable = new PdfPTable(1);
            datePillTable.setWidthPercentage(24f);
            datePillTable.setSpacingAfter(15f);
            
            PdfPCell dateCell = new PdfPCell();
            dateCell.setBackgroundColor(new Color(15, 23, 42)); // Dark Navy/Black #0f172a
            dateCell.setBorder(Rectangle.NO_BORDER);
            dateCell.setPaddingTop(4f);
            dateCell.setPaddingBottom(4f);
            dateCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            
            String dateText = attempt.getEndTime() != null ? 
                attempt.getEndTime().format(DateTimeFormatter.ofPattern("MMMM-dd-yyyy")).toUpperCase() : "AUGUST-25-2026";
            Paragraph pDate = new Paragraph(dateText, new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE));
            pDate.setAlignment(Element.ALIGN_CENTER);
            dateCell.addElement(pDate);
            datePillTable.addCell(dateCell);
            document.add(datePillTable);
            
            // --- DESCRIPTION ---
            // Color: #334155, Size: 9pt
            Font bodyFont = new Font(Font.HELVETICA, 9, Font.NORMAL, new Color(51, 65, 85));
            Paragraph descPara = new Paragraph(
                String.format("Is hereby awarded this certificate for successfully demonstrating proficiency in the assessment\n\"%s\" with a passing score of %.1f%%.", 
                    attempt.getQuiz().getTitle(), attempt.getPercentage()), 
                bodyFont
            );
            descPara.setAlignment(Element.ALIGN_CENTER);
            descPara.setSpacingAfter(35f);
            document.add(descPara);
            
            // --- FOOTER LAYOUT ---
            PdfPTable footerTable = new PdfPTable(3);
            footerTable.setWidthPercentage(100);
            footerTable.setWidths(new float[]{35f, 30f, 35f});
            
            // Left: Director By
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            
            Paragraph dirLine = new Paragraph("ExamindAI Director", new Font(Font.TIMES_ROMAN, 11, Font.ITALIC, new Color(15, 23, 42)));
            dirLine.setAlignment(Element.ALIGN_CENTER);
            leftCell.addElement(dirLine);
            
            Paragraph dirUnder = new Paragraph("________________________", new Font(Font.HELVETICA, 9, Font.NORMAL, new Color(100, 116, 139)));
            dirUnder.setAlignment(Element.ALIGN_CENTER);
            dirUnder.setSpacingBefore(-4f);
            leftCell.addElement(dirUnder);
            
            Paragraph dirLabel = new Paragraph("Director By", new Font(Font.HELVETICA, 8, Font.BOLD, new Color(148, 163, 184)));
            dirLabel.setAlignment(Element.ALIGN_CENTER);
            dirLabel.setSpacingBefore(4f);
            leftCell.addElement(dirLabel);
            
            // Center: Premium Laurel Wreath Seal / Award Badge
            PdfPCell centerCell = new PdfPCell();
            centerCell.setBorder(Rectangle.NO_BORDER);
            centerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            
            Paragraph spacer = new Paragraph(" ");
            spacer.setSpacingBefore(18f);
            centerCell.addElement(spacer);
            
            Paragraph sText = new Paragraph("EXAMIND AI CERTIFIED", new Font(Font.HELVETICA, 8, Font.BOLD, new Color(217, 119, 6)));
            sText.setAlignment(Element.ALIGN_CENTER);
            centerCell.addElement(sText);
            
            String certIdStr = attempt.getCertificateId() != null ? attempt.getCertificateId().toUpperCase() : "N/A";
            Paragraph cIdLabel = new Paragraph("ID: " + certIdStr, new Font(Font.HELVETICA, 7, Font.NORMAL, new Color(148, 163, 184)));
            cIdLabel.setAlignment(Element.ALIGN_CENTER);
            cIdLabel.setSpacingBefore(3f);
            centerCell.addElement(cIdLabel);
            
            // Right: Awarded By
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            
            Paragraph orgLine = new Paragraph("ExamindAI Platform", new Font(Font.TIMES_ROMAN, 11, Font.ITALIC, new Color(15, 23, 42)));
            orgLine.setAlignment(Element.ALIGN_CENTER);
            rightCell.addElement(orgLine);
            
            Paragraph orgUnder = new Paragraph("________________________", new Font(Font.HELVETICA, 9, Font.NORMAL, new Color(100, 116, 139)));
            orgUnder.setAlignment(Element.ALIGN_CENTER);
            orgUnder.setSpacingBefore(-4f);
            rightCell.addElement(orgUnder);
            
            Paragraph orgLabel = new Paragraph("Awarded By", new Font(Font.HELVETICA, 8, Font.BOLD, new Color(148, 163, 184)));
            orgLabel.setAlignment(Element.ALIGN_CENTER);
            orgLabel.setSpacingBefore(4f);
            rightCell.addElement(orgLabel);
            
            footerTable.addCell(leftCell);
            footerTable.addCell(centerCell);
            footerTable.addCell(rightCell);
            document.add(footerTable);
            
            // Draw vector exclamation circle badge in the center of the footer over the spacer space
            cb.saveState();
            cb.setColorStroke(accentColor);
            cb.setLineWidth(2f);
            float centerX = 421f;
            float centerY = 92f;
            
            // Draw outer circle
            cb.circle(centerX, centerY, 15);
            cb.stroke();
            
            // Draw exclamation vertical bar
            cb.setLineWidth(2.5f);
            cb.moveTo(centerX, centerY + 5);
            cb.lineTo(centerX, centerY - 2);
            cb.stroke();
            
            // Draw exclamation dot
            cb.setColorFill(accentColor);
            cb.circle(centerX, centerY - 7, 1.25f);
            cb.fill();
            
            cb.restoreState();
            
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            document.close();
        }
        return out.toByteArray();
    }

    public static byte[] generatePerformanceReport(Attempt attempt) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            
            // Title
            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD, new Color(124, 58, 237));
            Paragraph title = new Paragraph("Quiz Performance Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);
            
            // Summary Table
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(20);
            
            Font labelFont = new Font(Font.HELVETICA, 10, Font.BOLD, new Color(71, 85, 105));
            Font valFont = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(15, 23, 42));
            
            addSummaryCell(summaryTable, "Quiz Title:", attempt.getQuiz().getTitle(), labelFont, valFont);
            addSummaryCell(summaryTable, "Student Name:", attempt.getStudent() != null ? attempt.getStudent().getName() : "N/A", labelFont, valFont);
            addSummaryCell(summaryTable, "Student ID:", attempt.getStudent() != null && attempt.getStudent().getStudentId() != null ? attempt.getStudent().getStudentId() : "N/A", labelFont, valFont);
            addSummaryCell(summaryTable, "Obtained Score:", String.format("%.1f / %.1f (%.1f%%)", attempt.getObtainedMarks(), attempt.getTotalMarks(), attempt.getPercentage()), labelFont, valFont);
            addSummaryCell(summaryTable, "Passing Status:", attempt.isPassed() ? "PASSED" : "FAILED", labelFont, 
                new Font(Font.HELVETICA, 10, Font.BOLD, attempt.isPassed() ? new Color(22, 163, 74) : new Color(220, 38, 38)));
            addSummaryCell(summaryTable, "Date Completed:", attempt.getEndTime() != null ? attempt.getEndTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "N/A", labelFont, valFont);
            
            document.add(summaryTable);
            
            // Detailed responses section
            Paragraph qHeader = new Paragraph("Question-by-Question Analysis", new Font(Font.HELVETICA, 14, Font.BOLD, new Color(15, 23, 42)));
            qHeader.setSpacingAfter(10);
            document.add(qHeader);
            
            List<AttemptAnswer> answers = attempt.getAnswers();
            int index = 1;
            for (AttemptAnswer ans : answers) {
                Question q = ans.getQuestion();
                if (q == null) continue;
                
                Paragraph qText = new Paragraph(index + ". " + q.getText(), new Font(Font.HELVETICA, 11, Font.BOLD, new Color(15, 23, 42)));
                qText.setSpacingBefore(12);
                qText.setSpacingAfter(6);
                document.add(qText);
                
                List<QuestionOption> options = q.getOptions();
                for (int oIdx = 0; oIdx < options.size(); oIdx++) {
                    QuestionOption opt = options.get(oIdx);
                    char optChar = (char) ('A' + oIdx);
                    
                    String optionText = optChar + ") " + opt.getText();
                    boolean isSelected = ans.getSelectedOptionIndex() != null && ans.getSelectedOptionIndex() == oIdx;
                    boolean isCorrect = opt.isCorrect();
                    
                    Font optFont = new Font(Font.HELVETICA, 9, Font.NORMAL);
                    
                    if (isSelected && isCorrect) {
                        optFont = new Font(Font.HELVETICA, 9, Font.BOLD, new Color(22, 163, 74));
                        optionText += " (Your Answer - Correct)";
                    } else if (isSelected) {
                        optFont = new Font(Font.HELVETICA, 9, Font.BOLD, new Color(220, 38, 38));
                        optionText += " (Your Answer - Incorrect)";
                    } else if (isCorrect) {
                        optFont = new Font(Font.HELVETICA, 9, Font.BOLD, new Color(71, 85, 105));
                        optionText += " (Correct Answer)";
                    }
                    
                    Paragraph optPara = new Paragraph(optionText, optFont);
                    optPara.setIndentationLeft(20);
                    optPara.setSpacingAfter(2);
                    document.add(optPara);
                }
                
                // Find correct option details
                String correctOptionLabel = "";
                String correctOptionText = "";
                for (int oIdx = 0; oIdx < options.size(); oIdx++) {
                    if (options.get(oIdx).isCorrect()) {
                        correctOptionLabel = String.valueOf((char) ('A' + oIdx));
                        correctOptionText = options.get(oIdx).getText();
                        break;
                    }
                }
                
                if (!ans.isCorrect()) {
                    Paragraph correctPara = new Paragraph(
                        String.format("Correct Answer: Option %s (%s)", correctOptionLabel, correctOptionText), 
                        new Font(Font.HELVETICA, 9, Font.BOLD, new Color(22, 163, 74))
                    );
                    correctPara.setIndentationLeft(20);
                    correctPara.setSpacingBefore(3);
                    correctPara.setSpacingAfter(4);
                    document.add(correctPara);
                }
                
                Paragraph metaPara = new Paragraph(
                    String.format("Marks Awarded: %.1f / %.1f    |    Status: %s", 
                        ans.getMarksAwarded(), q.getMarks(), ans.isCorrect() ? "Correct" : "Incorrect"), 
                    new Font(Font.HELVETICA, 9, Font.ITALIC, new Color(100, 116, 139))
                );
                metaPara.setIndentationLeft(20);
                metaPara.setSpacingBefore(4);
                document.add(metaPara);
                
                if (q.getExplanation() != null && !q.getExplanation().isBlank()) {
                    Paragraph expPara = new Paragraph("Explanation: " + q.getExplanation(), 
                        new Font(Font.HELVETICA, 9, Font.NORMAL, new Color(100, 116, 139)));
                    expPara.setIndentationLeft(20);
                    expPara.setSpacingBefore(2);
                    expPara.setSpacingAfter(6);
                    document.add(expPara);
                }
                
                index++;
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            document.close();
        }
        return out.toByteArray();
    }

    private static void addSummaryCell(PdfPTable table, String label, String value, Font labelFont, Font valFont) {
        PdfPCell cellLabel = new PdfPCell(new Phrase(label, labelFont));
        cellLabel.setBorder(Rectangle.BOTTOM);
        cellLabel.setBorderColor(new Color(226, 232, 240));
        cellLabel.setPadding(6f);
        
        PdfPCell cellVal = new PdfPCell(new Phrase(value, valFont));
        cellVal.setBorder(Rectangle.BOTTOM);
        cellVal.setBorderColor(new Color(226, 232, 240));
        cellVal.setPadding(6f);
        
        table.addCell(cellLabel);
        table.addCell(cellVal);
    }
}
