package com.care.notification.application.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for appointment QR code and verification code data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentQRDTO {

    @JsonProperty("appointment_id")
    private UUID appointmentId;

    @JsonProperty("appointment_code")
    private String appointmentCode;

    @JsonProperty("qr_code_url")
    private String qrCodeUrl;

    @JsonProperty("verification_code")
    private String verificationCode;

    @JsonProperty("verification_code_expires_at")
    private Instant verificationCodeExpiresAt;

    @JsonProperty("appointment_date")
    private String appointmentDate;

    @JsonProperty("appointment_time")
    private String appointmentTime;

    @JsonProperty("beneficiary_name")
    private String beneficiaryName;

    @JsonProperty("service_type")
    private String serviceType;

    @JsonProperty("center_name")
    private String centerName;
}
