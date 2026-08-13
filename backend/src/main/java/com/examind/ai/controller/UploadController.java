package com.examind.ai.controller;

import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;
import com.examind.ai.exception.CustomException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/upload")
public class UploadController {

    private final FileStorageService fileStorageService;

    public UploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/image")
    public ResponseEntity<Map<String, Object>> uploadImage(
            @RequestParam("file") MultipartFile file) {
        String fileUrl = fileStorageService.storeFile(file);
        return ResponseEntity.ok(Map.of("success", true, "url", fileUrl));
    }


    @PostMapping("/questions")
    public ResponseEntity<Map<String, Object>> parseQuestions(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "quizId", required = false) Long quizId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> result = parseExcelFile(file, user);
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> parseExcelFile(MultipartFile file, User user) {
        // We can reuse the XSSFWorkbook parsing code:
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(file.getInputStream())) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(0);
            
            List<Map<String, Object>> questions = new java.util.ArrayList<>();
            List<String> errors = new java.util.ArrayList<>();

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            Map<String, Integer> colMap = new java.util.HashMap<>();
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.getCell(c);
                if (cell != null) {
                    colMap.put(cell.getStringCellValue().toLowerCase().trim(), c);
                }
            }

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) continue;

                try {
                    String qText = getCellValue(row, colMap, "question");
                    if (qText.isBlank()) qText = getCellValue(row, colMap, "text");
                    if (qText.isBlank()) {
                        errors.add("Row " + (r + 1) + ": Question text is missing");
                        continue;
                    }

                    String optA = getCellValue(row, colMap, "option a");
                    String optB = getCellValue(row, colMap, "option b");
                    String optC = getCellValue(row, colMap, "option c");
                    String optD = getCellValue(row, colMap, "option d");

                    if (optA.isBlank() || optB.isBlank()) {
                        errors.add("Row " + (r + 1) + ": Options A and B are required");
                        continue;
                    }

                    String correctStr = getCellValue(row, colMap, "correct answer");
                    if (correctStr.isBlank()) correctStr = getCellValue(row, colMap, "correct");
                    String cleanCorrect = correctStr.toLowerCase().trim();

                    int correctIdx = -1;
                    if (cleanCorrect.equals("a") || cleanCorrect.equals("option a") || cleanCorrect.equals("1")) correctIdx = 0;
                    else if (cleanCorrect.equals("b") || cleanCorrect.equals("option b") || cleanCorrect.equals("2")) correctIdx = 1;
                    else if (cleanCorrect.equals("c") || cleanCorrect.equals("option c") || cleanCorrect.equals("3")) correctIdx = 2;
                    else if (cleanCorrect.equals("d") || cleanCorrect.equals("option d") || cleanCorrect.equals("4")) correctIdx = 3;

                    if (correctIdx == -1) {
                        if (cleanCorrect.equalsIgnoreCase(optA.trim())) correctIdx = 0;
                        else if (cleanCorrect.equalsIgnoreCase(optB.trim())) correctIdx = 1;
                        else if (cleanCorrect.equalsIgnoreCase(optC.trim())) correctIdx = 2;
                        else if (cleanCorrect.equalsIgnoreCase(optD.trim())) correctIdx = 3;
                    }

                    List<Map<String, Object>> options = new java.util.ArrayList<>();
                    options.add(Map.of("text", optA, "isCorrect", correctIdx == 0));
                    options.add(Map.of("text", optB, "isCorrect", correctIdx == 1));
                    if (!optC.isBlank()) options.add(Map.of("text", optC, "isCorrect", correctIdx == 2));
                    if (!optD.isBlank()) options.add(Map.of("text", optD, "isCorrect", correctIdx == 3));

                    if (correctIdx == -1 || correctIdx >= options.size()) {
                        options.set(0, Map.of("text", optA, "isCorrect", true));
                        errors.add("Row " + (r + 1) + ": Could not parse correct answer \"" + correctStr + "\", defaulting to Option A");
                    }

                    double marksVal = 1.0;
                    String marksStr = getCellValue(row, colMap, "marks");
                    if (!marksStr.isBlank()) {
                        try {
                            marksVal = Double.parseDouble(marksStr);
                        } catch (NumberFormatException ignored) {}
                    }

                    String diff = getCellValue(row, colMap, "difficulty").toLowerCase();
                    diff = List.of("easy", "medium", "hard").contains(diff) ? diff : "medium";

                    Map<String, Object> q = new java.util.HashMap<>();
                    q.put("text", qText);
                    q.put("type", "mcq");
                    q.put("options", options);
                    q.put("explanation", getCellValue(row, colMap, "explanation"));
                    q.put("marks", marksVal);
                    q.put("difficulty", diff);
                    q.put("negativeMark", 0.0);
                    q.put("isAIGenerated", false);

                    questions.add(q);
                } catch (Exception ex) {
                    errors.add("Row " + (r + 1) + ": " + ex.getMessage());
                }
            }

            return Map.of("success", true, "data", questions, "errors", errors);
        } catch (Exception ex) {
            throw new CustomException("Failed to read Excel file: " + ex.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    private boolean isRowEmpty(org.apache.poi.ss.usermodel.Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            org.apache.poi.ss.usermodel.Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != org.apache.poi.ss.usermodel.CellType.BLANK) {
                return false;
            }
        }
        return true;
    }

    private String getCellValue(org.apache.poi.ss.usermodel.Row row, Map<String, Integer> colMap, String columnName) {
        Integer colIdx = null;
        for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
            if (entry.getKey().contains(columnName)) {
                colIdx = entry.getValue();
                break;
            }
        }
        if (colIdx == null) return "";

        org.apache.poi.ss.usermodel.Cell cell = row.getCell(colIdx);
        if (cell == null) return "";

        if (cell.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC) {
            return String.valueOf((int) cell.getNumericCellValue());
        } else if (cell.getCellType() == org.apache.poi.ss.usermodel.CellType.BOOLEAN) {
            return String.valueOf(cell.getBooleanCellValue());
        } else {
            return cell.getStringCellValue().trim();
        }
    }
}
