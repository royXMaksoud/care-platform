package com.portal.das.service.profile;

import com.portal.das.domain.model.InferredType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for TypeInferenceService
 * Tests type inference logic for various data patterns
 */
@DisplayName("Type Inference Service Tests")
class TypeInferenceServiceTest {

    private TypeInferenceService typeInferenceService;

    @BeforeEach
    void setUp() {
        typeInferenceService = new TypeInferenceService();
    }

    @Test
    @DisplayName("Should infer INTEGER type for numeric strings")
    void shouldInferIntegerType_WhenValidIntegers() {
        // Given
        List<String> values = Arrays.asList("1", "2", "3", "100", "-50");

        // When
        TypeInferenceService.TypeInferenceResult result = typeInferenceService.inferType(values);

        // Then
        assertThat(result.getDominantType()).isEqualTo(InferredType.INTEGER);
    }

    @Test
    @DisplayName("Should infer DECIMAL type for floating-point numbers")
    void shouldInferDecimalType_WhenFloatingPoints() {
        // Given
        List<String> values = Arrays.asList("1.5", "2.3", "3.14159", "-0.5");

        // When
        TypeInferenceService.TypeInferenceResult result = typeInferenceService.inferType(values);

        // Then
        assertThat(result.getDominantType()).isEqualTo(InferredType.DECIMAL);
    }

    @Test
    @DisplayName("Should infer BOOLEAN type for boolean values")
    void shouldInferBooleanType_WhenBooleanStrings() {
        // Given
        List<String> values = Arrays.asList("true", "false", "TRUE", "FALSE");

        // When
        TypeInferenceService.TypeInferenceResult result = typeInferenceService.inferType(values);

        // Then
        assertThat(result.getDominantType()).isEqualTo(InferredType.BOOLEAN);
    }

    @Test
    @DisplayName("Should infer DATE type for date patterns")
    void shouldInferDateType_WhenDateStrings() {
        // Given
        List<String> values = Arrays.asList("2024-01-15", "2024-02-20", "2024-03-25");

        // When
        TypeInferenceService.TypeInferenceResult result = typeInferenceService.inferType(values);

        // Then
        assertThat(result.getDominantType()).isEqualTo(InferredType.DATE);
    }

    @Test
    @DisplayName("Should infer DATETIME type for datetime patterns")
    void shouldInferDateTimeType_WhenDateTimeStrings() {
        // Given
        List<String> values = Arrays.asList(
                "2024-01-15 10:30:00",
                "2024-02-20 14:45:00",
                "2024-03-25 09:15:00"
        );

        // When
        TypeInferenceService.TypeInferenceResult result = typeInferenceService.inferType(values);

        // Then
        assertThat(result.getDominantType()).isEqualTo(InferredType.DATETIME);
    }

    @Test
    @DisplayName("Should infer STRING type for mixed content")
    void shouldInferStringType_WhenMixedContent() {
        // Given
        List<String> values = Arrays.asList("Hello", "World", "123abc", "test@email.com");

        // When
        TypeInferenceService.TypeInferenceResult result = typeInferenceService.inferType(values);

        // Then
        assertThat(result.getDominantType()).isEqualTo(InferredType.STRING);
    }

    @Test
    @DisplayName("Should handle empty list")
    void shouldHandleEmptyList() {
        // Given
        List<String> values = Collections.emptyList();

        // When
        TypeInferenceService.TypeInferenceResult result = typeInferenceService.inferType(values);

        // Then
        assertThat(result.getDominantType()).isEqualTo(InferredType.STRING);
    }

    @Test
    @DisplayName("Should handle null values in list")
    void shouldHandleNullValues_InList() {
        // Given
        List<String> values = Arrays.asList("1", "2", null, "3", "");

        // When
        TypeInferenceService.TypeInferenceResult result = typeInferenceService.inferType(values);

        // Then
        assertThat(result.getDominantType()).isEqualTo(InferredType.INTEGER);
    }

    @Test
    @DisplayName("Should prefer INTEGER over DECIMAL when all integers")
    void shouldPreferInteger_OverDecimal() {
        // Given
        List<String> values = Arrays.asList("100", "200", "300");

        // When
        TypeInferenceService.TypeInferenceResult result = typeInferenceService.inferType(values);

        // Then
        assertThat(result.getDominantType()).isEqualTo(InferredType.INTEGER);
    }

    @Test
    @DisplayName("Should infer DECIMAL when mixed integers and decimals")
    void shouldInferDecimal_WhenMixedIntegersAndDecimals() {
        // Given
        List<String> values = Arrays.asList("100", "200.5", "300");

        // When
        TypeInferenceService.TypeInferenceResult result = typeInferenceService.inferType(values);

        // Then
        assertThat(result.getDominantType()).isEqualTo(InferredType.DECIMAL);
    }

    @Test
    @DisplayName("Should handle various date formats")
    void shouldHandleVariousDateFormats() {
        // Given: ISO date format
        List<String> isoValues = Arrays.asList("2024-01-15", "2024-12-31");

        // When
        TypeInferenceService.TypeInferenceResult isoResult = typeInferenceService.inferType(isoValues);

        // Then
        assertThat(isoResult.getDominantType()).isEqualTo(InferredType.DATE);

        // Given: US date format
        List<String> usValues = Arrays.asList("01/15/2024", "12/31/2024");

        // When
        TypeInferenceService.TypeInferenceResult usResult = typeInferenceService.inferType(usValues);

        // Then
        assertThat(usResult.getDominantType()).isIn(InferredType.DATE, InferredType.STRING);
    }

    @Test
    @DisplayName("Should calculate confidence based on valid values")
    void shouldCalculateConfidence_BasedOnValidValues() {
        // Given: 80% integers, 20% invalid
        List<String> values = Arrays.asList("1", "2", "3", "4", "invalid");

        // When
        TypeInferenceService.TypeInferenceResult result = typeInferenceService.inferType(values);

        // Then: Should still infer as INTEGER due to majority
        assertThat(result.getDominantType()).isEqualTo(InferredType.INTEGER);
        assertThat(result.getConfidence()).isGreaterThan(0.5);
    }
}

