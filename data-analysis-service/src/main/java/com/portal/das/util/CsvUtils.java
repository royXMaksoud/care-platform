package com.portal.das.util;

import org.apache.poi.ss.usermodel.*;

import java.io.*;
import java.nio.file.Path;
import java.util.Iterator;

/**
 * Utility class for CSV operations
 * Converts Excel files (xlsx, xls) to CSV format
 */
public class CsvUtils {

    /**
     * Convert Excel file to CSV format
     * Reads the first sheet and converts it to CSV
     *
     * @param inputStream Excel file input stream
     * @param outputPath Path where CSV file should be written
     * @throws IOException If file operations fail
     */
    public static void excelToCsv(InputStream inputStream, Path outputPath) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(inputStream);
             BufferedWriter writer = new BufferedWriter(new FileWriter(outputPath.toFile()))) {

            // Get the first sheet
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                throw new IOException("Excel file has no sheets");
            }

            // Iterate through rows
            Iterator<Row> rowIterator = sheet.iterator();
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                if (row == null) {
                    continue;
                }

                // Process each cell in the row
                StringBuilder line = new StringBuilder();
                int lastCellNum = row.getLastCellNum();
                
                for (int cellIndex = 0; cellIndex < lastCellNum; cellIndex++) {
                    Cell cell = row.getCell(cellIndex, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                    String cellValue = getCellValueAsString(cell);
                    
                    // Escape and quote if necessary
                    if (needsQuoting(cellValue)) {
                        cellValue = "\"" + cellValue.replace("\"", "\"\"") + "\"";
                    }
                    
                    line.append(cellValue);
                    
                    // Add comma except for last cell
                    if (cellIndex < lastCellNum - 1) {
                        line.append(",");
                    }
                }

                // Write line to file
                writer.write(line.toString());
                writer.newLine();
            }
        }
    }

    /**
     * Get cell value as string based on cell type
     *
     * @param cell Excel cell
     * @return String representation of cell value
     */
    private static String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // Format number to avoid scientific notation
                    double numericValue = cell.getNumericCellValue();
                    if (numericValue == (long) numericValue) {
                        return String.valueOf((long) numericValue);
                    } else {
                        return String.valueOf(numericValue);
                    }
                }
            
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    try {
                        return String.valueOf(cell.getNumericCellValue());
                    } catch (Exception ex) {
                        return "";
                    }
                }
            
            case BLANK:
                return "";
            
            case ERROR:
                return "#ERROR";
            
            default:
                return "";
        }
    }

    /**
     * Check if a cell value needs to be quoted in CSV
     *
     * @param value Cell value
     * @return true if quoting is needed
     */
    private static boolean needsQuoting(String value) {
        return value.contains(",") || 
               value.contains("\"") || 
               value.contains("\n") || 
               value.contains("\r");
    }

    /**
     * Count rows in a CSV file
     *
     * @param csvPath Path to CSV file
     * @return Number of rows (including header)
     * @throws IOException If file cannot be read
     */
    public static int countRows(Path csvPath) throws IOException {
        try (BufferedReader reader = new BufferedReader(new FileReader(csvPath.toFile()))) {
            int count = 0;
            while (reader.readLine() != null) {
                count++;
            }
            return count;
        }
    }

    /**
     * Read the header (first line) from a CSV file
     *
     * @param csvPath Path to CSV file
     * @return Array of column names
     * @throws IOException If file cannot be read
     */
    public static String[] readHeader(Path csvPath) throws IOException {
        try (BufferedReader reader = new BufferedReader(new FileReader(csvPath.toFile()))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                return new String[0];
            }
            return parseCSVLine(headerLine);
        }
    }

    /**
     * Parse a CSV line considering quoted values
     *
     * @param line CSV line
     * @return Array of values
     */
    private static String[] parseCSVLine(String line) {
        // Simple CSV parser - handles quotes and commas
        // For production, consider using Apache Commons CSV
        return line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);
    }
}

